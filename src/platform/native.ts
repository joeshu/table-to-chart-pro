import type { ChartSettings } from '../state/project';
import type { DataTable } from '../types';

export interface ProjectDocument {
  schemaVersion: 1;
  metadata: { name: string; updatedAt: string };
  data: DataTable;
  chart: ChartSettings;
}

export interface OpenedProject { path: string | null; document: ProjectDocument }
export interface ImportedSheet { name: string; headers: string[]; rows: string[][] }
export interface ImportedWorkbook { path: string | null; name: string; sheets: ImportedSheet[] }

function isTauri() { return '__TAURI_INTERNALS__' in window; }

export async function openProject(): Promise<OpenedProject | null> {
  if (!isTauri()) return openProjectInBrowser();
  const [{ open }, { invoke }] = await Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/api/core')]);
  const path = await open({ multiple:false, directory:false, filters:[{name:'表格转图表项目',extensions:['t2c','json']}] });
  if (!path || Array.isArray(path)) return null;
  const contents = await invoke<string>('read_text_file',{path});
  return { path, document: parseProject(contents) };
}

export async function importWorkbook(pathOverride?: string): Promise<ImportedWorkbook | null> {
  if (!isTauri()) return importWorkbookInBrowser();
  const [{ open }, { invoke }] = await Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/api/core')]);
  const selected = pathOverride || await open({ multiple:false, directory:false, filters:[{name:'表格文件',extensions:['xlsx','xls','xlsb','ods','csv','tsv','txt']}] });
  if (!selected || Array.isArray(selected)) return null;
  const sheets = await invoke<ImportedSheet[]>('import_spreadsheet',{path:selected});
  return { path:selected, name:selected.split(/[\\/]/).pop() || '导入表格', sheets };
}

export async function saveProject(document: ProjectDocument, currentPath: string | null, saveAs = false): Promise<string | null> {
  const contents = JSON.stringify(document,null,2);
  if (!isTauri()) { downloadBlob(contents,`${document.metadata.name || 'chart-project'}.t2c`,'application/json'); return currentPath; }
  const [{ save }, { invoke }] = await Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/api/core')]);
  const path = !saveAs && currentPath ? currentPath : await save({defaultPath:`${document.metadata.name || 'chart-project'}.t2c`,filters:[{name:'表格转图表项目',extensions:['t2c']}]});
  if (!path) return null;
  await invoke('write_text_file',{path,contents}); return path;
}

export async function saveExportFile(contents:string,suggestedName:string,extension:'png'|'pdf'|'csv'):Promise<boolean>{
  const labels={png:'PNG 图片',pdf:'PDF 文档',csv:'CSV 数据'};
  if(!isTauri()){
    const link=document.createElement('a');link.download=suggestedName;
    link.href=contents.startsWith('data:')?contents:URL.createObjectURL(new Blob([contents],{type:'text/csv;charset=utf-8'}));link.click();return true;
  }
  const [{save},{invoke}]=await Promise.all([import('@tauri-apps/plugin-dialog'),import('@tauri-apps/api/core')]);
  const path=await save({defaultPath:suggestedName,filters:[{name:labels[extension],extensions:[extension]}]});if(!path)return false;
  if(extension==='csv')await invoke('write_text_file',{path,contents});else await invoke('write_base64_file',{path,contents});return true;
}

export async function savePng(dataUrl:string,suggestedName:string):Promise<boolean>{return saveExportFile(dataUrl,suggestedName,'png');}

export async function copyText(text:string):Promise<void>{
  if(isTauri()){const {writeText}=await import('@tauri-apps/plugin-clipboard-manager');await writeText(text);return;}
  await navigator.clipboard.writeText(text);
}

export async function rememberRecent(path:string){
  if(!isTauri()){localStorage.setItem('recent-project',path);return;}
  const {load}=await import('@tauri-apps/plugin-store');const store=await load('settings.json',{autoSave:true});const recent=(await store.get<string[]>('recentProjects'))??[];await store.set('recentProjects',[path,...recent.filter(item=>item!==path)].slice(0,8));
}

export async function getRecentProjects():Promise<string[]>{
  if(!isTauri()){const value=localStorage.getItem('recent-project');return value?[value]:[];}
  const {load}=await import('@tauri-apps/plugin-store');const store=await load('settings.json',{autoSave:true});return (await store.get<string[]>('recentProjects'))??[];
}

export async function saveDraft(document:ProjectDocument):Promise<void>{
  const contents=JSON.stringify(document);
  if(!isTauri()){localStorage.setItem('project-draft',contents);return;}
  const {load}=await import('@tauri-apps/plugin-store');const store=await load('settings.json',{autoSave:true});await store.set('projectDraft',contents);
}

export async function loadDraft():Promise<ProjectDocument|null>{
  let contents:string|null|undefined;
  if(!isTauri())contents=localStorage.getItem('project-draft');
  else{const {load}=await import('@tauri-apps/plugin-store');const store=await load('settings.json',{autoSave:true});contents=await store.get<string>('projectDraft');}
  if(!contents)return null;try{return parseProject(contents);}catch{return null;}
}

export function parseProject(contents:string):ProjectDocument{
  const value=JSON.parse(contents) as Partial<ProjectDocument>;
  if(value.schemaVersion!==1||!value.data?.headers||!value.data?.rows||!value.chart)throw new Error('项目文件格式不受支持或已损坏');
  return value as ProjectDocument;
}

function openProjectInBrowser():Promise<OpenedProject|null>{return new Promise(resolve=>{const input=document.createElement('input');input.type='file';input.accept='.t2c,.json';input.onchange=async()=>{const file=input.files?.[0];if(!file)return resolve(null);resolve({path:null,document:parseProject(await file.text())});};input.click();});}
function importWorkbookInBrowser():Promise<ImportedWorkbook|null>{return new Promise(resolve=>{const input=document.createElement('input');input.type='file';input.accept='.csv,.tsv,.txt';input.onchange=async()=>{const file=input.files?.[0];if(!file)return resolve(null);const {parseTable}=await import('../data/parser');const table=parseTable(await file.text());resolve({path:null,name:file.name,sheets:[{name:'数据',...table}]});};input.click();});}
function downloadBlob(contents:string,name:string,type:string){const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([contents],{type}));link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);}
