import type { ChartSettings } from '../state/project';
import type { DataTable } from '../types';

export interface ProjectDocument {
  schemaVersion: 1;
  metadata: { name: string; updatedAt: string };
  data: DataTable;
  chart: ChartSettings;
}

export interface OpenedProject { path: string | null; document: ProjectDocument }

function isTauri() { return '__TAURI_INTERNALS__' in window; }

export async function openProject(): Promise<OpenedProject | null> {
  if (!isTauri()) return openProjectInBrowser();
  const [{ open }, { invoke }] = await Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/api/core')]);
  const path = await open({ multiple:false, directory:false, filters:[{name:'表格转图表项目',extensions:['t2c','json']}] });
  if (!path || Array.isArray(path)) return null;
  const contents = await invoke<string>('read_text_file',{path});
  return { path, document: parseProject(contents) };
}

export async function saveProject(document: ProjectDocument, currentPath: string | null, saveAs = false): Promise<string | null> {
  const contents = JSON.stringify(document,null,2);
  if (!isTauri()) { downloadBlob(contents,`${document.metadata.name || 'chart-project'}.t2c`,'application/json'); return currentPath; }
  const [{ save }, { invoke }] = await Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/api/core')]);
  const path = !saveAs && currentPath ? currentPath : await save({defaultPath:`${document.metadata.name || 'chart-project'}.t2c`,filters:[{name:'表格转图表项目',extensions:['t2c']}]});
  if (!path) return null;
  await invoke('write_text_file',{path,contents}); return path;
}

export async function savePng(dataUrl:string, suggestedName:string):Promise<boolean>{
  if(!isTauri()){const link=document.createElement('a');link.href=dataUrl;link.download=suggestedName;link.click();return true;}
  const [{save},{invoke}]=await Promise.all([import('@tauri-apps/plugin-dialog'),import('@tauri-apps/api/core')]);
  const path=await save({defaultPath:suggestedName,filters:[{name:'PNG 图片',extensions:['png']}]}); if(!path)return false;
  await invoke('write_base64_file',{path,contents:dataUrl});return true;
}

export async function copyText(text:string):Promise<void>{
  if(isTauri()){const {writeText}=await import('@tauri-apps/plugin-clipboard-manager');await writeText(text);return;}
  await navigator.clipboard.writeText(text);
}

export async function rememberRecent(path:string){
  if(!isTauri()){localStorage.setItem('recent-project',path);return;}
  const {load}=await import('@tauri-apps/plugin-store');const store=await load('settings.json',{autoSave:true});await store.set('recentProject',path);
}

export function parseProject(contents:string):ProjectDocument{
  const value=JSON.parse(contents) as Partial<ProjectDocument>;
  if(value.schemaVersion!==1||!value.data?.headers||!value.data?.rows||!value.chart)throw new Error('项目文件格式不受支持或已损坏');
  return value as ProjectDocument;
}

function openProjectInBrowser():Promise<OpenedProject|null>{return new Promise(resolve=>{const input=document.createElement('input');input.type='file';input.accept='.t2c,.json';input.onchange=async()=>{const file=input.files?.[0];if(!file)return resolve(null);resolve({path:null,document:parseProject(await file.text())});};input.click();});}
function downloadBlob(contents:string,name:string,type:string){const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([contents],{type}));link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);}
