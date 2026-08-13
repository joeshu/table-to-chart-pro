import { createDefaultChartSettings, type ChartSettings } from '../state/project';
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

export async function importWorkbook(pathOverride?: string, encoding = 'utf-8'): Promise<ImportedWorkbook | null> {
  if (!isTauri()) return importWorkbookInBrowser(encoding);
  const [{ open }, { invoke }] = await Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/api/core')]);
  const selected = pathOverride || await open({ multiple:false, directory:false, filters:[{name:'表格文件',extensions:['xlsx','xls','xlsb','ods','csv','tsv','txt']}] });
  if (!selected || Array.isArray(selected)) return null;
  const sheets = await invoke<ImportedSheet[]>('import_spreadsheet',{path:selected,encoding});
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

export async function saveExportFile(contents:string,suggestedName:string,extension:'png'|'pdf'|'svg'|'csv'):Promise<boolean>{
  const labels={png:'PNG 图片',pdf:'PDF 文档',svg:'SVG 矢量图',csv:'CSV 数据'};
  if(!isTauri()){
    const link=document.createElement('a');link.download=suggestedName;
    const type=extension==='csv'?'text/csv;charset=utf-8':extension==='svg'?'image/svg+xml;charset=utf-8':'';
    link.href=contents.startsWith('data:')?contents:URL.createObjectURL(new Blob([contents],{type}));link.click();return true;
  }
  const [{save},{invoke}]=await Promise.all([import('@tauri-apps/plugin-dialog'),import('@tauri-apps/api/core')]);
  const path=await save({defaultPath:suggestedName,filters:[{name:labels[extension],extensions:[extension]}]});if(!path)return false;
  if(extension==='csv'||extension==='svg')await invoke('write_text_file',{path,contents});else await invoke('write_base64_file',{path,contents});return true;
}

export async function savePng(dataUrl:string,suggestedName:string):Promise<boolean>{return saveExportFile(dataUrl,suggestedName,'png');}

export async function shareImage(dataUrl:string,fileName:string,title:string):Promise<boolean>{
  if(!navigator.share)return false;
  const response=await fetch(dataUrl);const blob=await response.blob();const file=new File([blob],fileName,{type:'image/png'});
  if(navigator.canShare&&!navigator.canShare({files:[file]}))return false;
  await navigator.share({title,text:'由表格转图表 Pro 生成',files:[file]});return true;
}

export async function copyText(text:string):Promise<void>{
  if(isTauri()){const {writeText}=await import('@tauri-apps/plugin-clipboard-manager');await writeText(text);return;}
  await navigator.clipboard.writeText(text);
}

export async function copySvg(svg:string):Promise<void>{
  if(navigator.clipboard?.write&&typeof ClipboardItem!=='undefined'){
    const item=new ClipboardItem({'image/svg+xml':new Blob([svg],{type:'image/svg+xml'}),'text/plain':new Blob([svg],{type:'text/plain'})});
    try{await navigator.clipboard.write([item]);return;}catch(error){void error;/* Fall back to plain text for browsers without rich clipboard permission. */}
  }
  await copyText(svg);
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

export function migrateProject(value:unknown):ProjectDocument{
  if(!value||typeof value!=='object')throw new Error('项目文件格式不受支持或已损坏');
  const source=value as Record<string,any>;
  if(source.schemaVersion===1){if(!source.data||!Array.isArray(source.data.headers)||source.data.headers.length<2||!Array.isArray(source.data.rows)||!source.chart||typeof source.chart!=='object')throw new Error('项目文件格式不受支持或已损坏');return {...source,metadata:{name:String(source.metadata?.name??'未命名项目'),updatedAt:String(source.metadata?.updatedAt??new Date().toISOString())},chart:{...createDefaultChartSettings(),...source.chart,customColors:Array.isArray(source.chart.customColors)?source.chart.customColors:[],comboBarColumns:Array.isArray(source.chart.comboBarColumns)?source.chart.comboBarColumns:[1],rightAxisTitle:String(source.chart.rightAxisTitle??''),rightAxisFormat:source.chart.rightAxisFormat??'auto',y2Min:source.chart.y2Min??null,y2Max:source.chart.y2Max??null,y2Step:source.chart.y2Step??null,yBeginAtZero:source.chart.yBeginAtZero??true,y2BeginAtZero:source.chart.y2BeginAtZero??true}} as ProjectDocument;}
  if(source.schemaVersion===undefined&&source.data?.headers&&source.data?.rows&&source.chart){
    return {schemaVersion:1,metadata:{name:source.metadata?.name??'迁移项目',updatedAt:source.metadata?.updatedAt??new Date().toISOString()},data:source.data,chart:{...createDefaultChartSettings(),...source.chart,customColors:source.chart.customColors??[],comboBarColumns:Array.isArray(source.chart.comboBarColumns)?source.chart.comboBarColumns:[1],rightAxisTitle:String(source.chart.rightAxisTitle??''),rightAxisFormat:source.chart.rightAxisFormat??'auto',y2Min:source.chart.y2Min??null,y2Max:source.chart.y2Max??null,y2Step:source.chart.y2Step??null,yBeginAtZero:source.chart.yBeginAtZero??true,y2BeginAtZero:source.chart.y2BeginAtZero??true}} as ProjectDocument;
  }
  throw new Error(`不支持的项目版本：${String(source.schemaVersion??'未知')}`);
}

export function parseProject(contents:string):ProjectDocument{
  return migrateProject(JSON.parse(contents));
}

function openProjectInBrowser():Promise<OpenedProject|null>{return new Promise(resolve=>{const input=document.createElement('input');input.type='file';input.accept='.t2c,.json';input.onchange=async()=>{const file=input.files?.[0];if(!file)return resolve(null);resolve({path:null,document:parseProject(await file.text())});};input.click();});}
function importWorkbookInBrowser(encoding:string):Promise<ImportedWorkbook|null>{return new Promise(resolve=>{const input=document.createElement('input');input.type='file';input.accept='.csv,.tsv,.txt';input.onchange=async()=>{const file=input.files?.[0];if(!file)return resolve(null);const {parseTable}=await import('../data/parser');const text=new TextDecoder(encoding).decode(await file.arrayBuffer());const table=parseTable(text);resolve({path:null,name:file.name,sheets:[{name:'数据',...table}]});};input.click();});}
function downloadBlob(contents:string,name:string,type:string){const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([contents],{type}));link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);}

export async function saveBatchFiles(files:{name:string;contents:string}[],extension:'png'|'pdf'|'svg'):Promise<boolean>{
  if(!files.length)return false;if(!isTauri()){for(const file of files){const link=document.createElement('a');link.download=file.name;link.href=file.contents.startsWith('data:')?file.contents:URL.createObjectURL(new Blob([file.contents],{type:extension==='svg'?'image/svg+xml;charset=utf-8':''}));link.click();await new Promise(resolve=>setTimeout(resolve,80));}return true;}
  const [{open},{invoke}]=await Promise.all([import('@tauri-apps/plugin-dialog'),import('@tauri-apps/api/core')]);const directory=await open({directory:true,multiple:false,title:'选择批量导出目录'});if(!directory||Array.isArray(directory))return false;const separator=directory.includes('\\')?'\\':'/';for(const file of files){const path=`${directory}${separator}${file.name}`;if(extension==='svg')await invoke('write_text_file',{path,contents:file.contents});else await invoke('write_base64_file',{path,contents:file.contents});}return true;
}
