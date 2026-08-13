<script setup lang="ts">
import { computed,onMounted,onUnmounted,ref,watchEffect } from 'vue';
import AppToolbar from './components/AppToolbar.vue';import ChartCanvas from './components/ChartCanvas.vue';import ChartContextMenu from './components/ChartContextMenu.vue';import DataPanel from './components/DataPanel.vue';import PropertyPanel from './components/PropertyPanel.vue';import DataSelectDialog from './components/DataSelectDialog.vue';import StatusBar from './components/StatusBar.vue';import ExportDialog from './components/ExportDialog.vue';import TemplateDialog from './components/TemplateDialog.vue';import AboutDialog from './components/AboutDialog.vue';
import { createCsv,createPdf,renderChartImage,type ExportOptions } from './export/exporter';
import { renderChartSvg } from './export/svg';
import { type ProjectTemplate } from './templates/library';
import { createDefaultChartSettings,useProjectState,type AppTheme,type ChartSettings } from './state/project';
import { copySvg,copyText,getRecentProjects,importWorkbook,loadDraft,openProject,rememberRecent,saveBatchFiles,saveDraft,saveExportFile,saveProject,shareImage,type ImportedSheet,type ProjectDocument } from './platform/native';
import {parseNumericValue} from './data/parser';
import { buildChartTable } from './data/chartView';
import { evaluateComplexity } from './data/complexity';
import {deleteUserTemplate,loadUserTemplates,saveUserTemplate} from './templates/user';

const appVersion=__APP_VERSION__;
const state=useProjectState(),chart=ref<InstanceType<typeof ChartCanvas>>(),currentPath=ref<string|null>(null),projectName=ref('未命名项目'),notice=ref(''),focusTarget=ref<'chart'|'series'|'axis'|'appearance'>('chart'),draftStatus=ref<'saved'|'saving'|'draft'>('saved'),lastAutoSaved=ref(''),contextMenu=ref<{x:number;y:number;datasetIndex:number|null}|null>(null),styleClipboard=ref<Partial<ChartSettings>|null>(null);
const chartTable=computed(()=>buildChartTable(state.table.value,state.settings));
const complexityBudget=computed(()=>evaluateComplexity(chartTable.value,state.settings));
const importSheets=ref<ImportedSheet[]>([]),importName=ref(''),importing=ref(false),userTemplates=ref(loadUserTemplates()),recentProjects=ref<string[]>([]),showRecent=ref(false),showExport=ref(false),showTemplates=ref(false),showAbout=ref(false),showProperties=ref(false),showDataSelect=ref(false),mobileTab=ref<'data'|'chart'|'style'>('chart');let importRequestId=0;let draftTimer:number|undefined;const unlisteners:(()=>void)[]=[];
const chartError=computed(()=>{
  const view=chartTable.value,minimum:{[key:string]:number}={combo:2,scatter:2,bubble:3,heatmap:2},required=minimum[state.settings.type]??1;
  if(view.headers.length-1<required)return `当前图表至少需要 ${required} 个数值列`;
  if(['pie','doughnut','funnel'].includes(state.settings.type)&&view.rows.some(row=>(parseNumericValue(row[1]).value??0)<0))return '饼图、环形图和漏斗图不支持负值';
  const columns=view.headers.slice(1).map((_,index)=>index+1),hasNonPositive=(items:number[])=>view.rows.some(row=>items.some(column=>{const value=parseNumericValue(row[column]).value;return value!==null&&value<=0;}));
  if(state.settings.type==='combo'){const bars=new Set((state.settings.comboBarColumns??[]).map(ref=>typeof ref==='number'?ref:view.columnIds?.indexOf(ref)??-1)),right=new Set(state.settings.comboRightAxisColumns===null?columns.filter(column=>!bars.has(column)):((state.settings.comboRightAxisColumns??[]).map(ref=>typeof ref==='number'?ref:view.columnIds?.indexOf(ref)??-1)));const left=columns.filter(column=>!right.has(column));if(state.settings.yScaleType==='logarithmic'&&hasNonPositive(left))return '左侧对数轴要求所有数值大于 0';if(state.settings.y2ScaleType==='logarithmic'&&hasNonPositive([...right]))return '右侧对数轴要求所有数值大于 0';}
  else if(state.settings.yScaleType==='logarithmic'&&hasNonPositive(columns))return '对数轴要求所有数值大于 0';return '';
});
const errorCount=computed(()=>state.issues.value.filter(i=>i.level==='error').length);
const workspaceError=computed(()=>state.hasErrors.value?'请先修复数据面板中的错误':chartError.value);
const fileLabel=computed(()=>currentPath.value?.split(/[\\/]/).pop()||projectName.value);
function applyTheme(value:AppTheme){state.setTheme(value);}watchEffect(()=>{document.documentElement.dataset.theme=state.appTheme.value;});
watchEffect(()=>{JSON.stringify([state.table.value,state.settings]);window.clearTimeout(draftTimer);if(!state.saved.value){draftStatus.value='saving';draftTimer=window.setTimeout(()=>{void saveDraft(documentValue()).then(()=>{draftStatus.value='draft';lastAutoSaved.value=new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});});},800);}});
function changeSettings(value:Partial<ChartSettings>){Object.assign(state.settings,value);state.saved.value=false;}
function focusProperty(target:'chart'|'series'|'axis'|'appearance'){contextMenu.value=null;focusTarget.value=target;showProperties.value=true;mobileTab.value='style';}
function applyDataSelection(value:Partial<ChartSettings>){changeSettings(value);showDataSelect.value=false;showNotice('图表数据选择已应用');}
function handleContext(payload:{x:number;y:number;datasetIndex:number|null}){contextMenu.value={...payload};}
function selectedSeriesId(){const index=contextMenu.value?.datasetIndex;return index===null||index===undefined?null:chartTable.value.columnIds?.[index+1]??String(index+1);}
function copySeriesStyle(){const id=selectedSeriesId();if(!id)return;const keys=['seriesColors','seriesOpacity','seriesLineWidths','seriesPointRadii','seriesDashed','seriesPointStyles','seriesTrendlines','seriesMovingAveragePeriods'] as const;const copy:Partial<ChartSettings>={};for(const key of keys){const value=(state.settings as any)[key]?.[id];if(value!==undefined)(copy as any)[key]={[id]:value};}styleClipboard.value=copy;contextMenu.value=null;showNotice('系列样式已复制');}
function pasteSeriesStyle(){const id=selectedSeriesId();if(!id||!styleClipboard.value)return;const next:Partial<ChartSettings>={};for(const key of Object.keys(styleClipboard.value) as Array<keyof ChartSettings>){const source=(styleClipboard.value as any)[key];if(source?.[Object.keys(source)[0]]!==undefined)(next as any)[key]={[id]:source[Object.keys(source)[0]]};}changeSettings(next);contextMenu.value=null;showNotice('系列样式已粘贴');}
function documentValue():ProjectDocument{return{schemaVersion:1,metadata:{name:projectName.value,updatedAt:new Date().toISOString()},data:JSON.parse(JSON.stringify(state.table.value)),chart:JSON.parse(JSON.stringify(state.settings))};}
function routeOpenedFile(path:string){if(/\.(t2c|json)$/i.test(path))void handleOpenPath(path);else void handleImport(path,'utf-8');}
async function handleImport(path?:string,encoding='utf-8'){const requestId=++importRequestId;importing.value=true;try{const workbook=await importWorkbook(path,encoding);if(requestId!==importRequestId||!workbook)return;importName.value=workbook.name;if(workbook.sheets.length===1)applySheet(workbook.sheets[0]);else importSheets.value=workbook.sheets;}catch(error){if(requestId===importRequestId)showNotice(`导入失败：${message(error)}`,true);}finally{if(requestId===importRequestId)importing.value=false;}}
function cancelImport(){importRequestId++;importing.value=false;showNotice('已取消导入，解析结果不会应用');}
function saveCurrentTemplate(name:string){userTemplates.value=saveUserTemplate(name,state.table.value,state.settings);showNotice(`模板“${name}”已保存`);}
function removeTemplate(id:string){userTemplates.value=deleteUserTemplate(id);showNotice('自定义模板已删除');}
function applyTemplate(template:ProjectTemplate){if(!state.saved.value&&!confirm('应用模板会替换当前数据，是否继续？'))return;state.loadTable(template.data);Object.assign(state.settings,createDefaultChartSettings(),template.chart);state.normalizeSeriesBindings();projectName.value=template.name;currentPath.value=null;showTemplates.value=false;showNotice(`已应用模板：${template.name}`);}
function applySheet(sheet:ImportedSheet){state.loadTable({headers:sheet.headers,rows:sheet.rows});projectName.value=importName.value.replace(/\.[^.]+$/,'')||sheet.name;currentPath.value=null;importSheets.value=[];showNotice(`已导入工作表：${sheet.name}`);}
async function openRecent(path:string){await handleOpenPath(path);}
async function handleOpenPath(path:string){try{const {invoke}=await import('@tauri-apps/api/core');const contents=await invoke<string>('read_text_file',{path});const {parseProject}=await import('./platform/native');const document=parseProject(contents);state.loadProject(document.data,document.chart);currentPath.value=path;projectName.value=document.metadata.name;await rememberRecent(path);recentProjects.value=await getRecentProjects();showNotice('最近项目已打开');}catch(error){showNotice(`打开失败：${message(error)}`,true);}}
async function handleOpen(){try{const opened=await openProject();if(!opened)return;state.loadProject(opened.document.data,opened.document.chart);currentPath.value=opened.path;projectName.value=opened.document.metadata.name||'未命名项目';if(opened.path)await rememberRecent(opened.path);recentProjects.value=await getRecentProjects();showNotice('项目已打开');}catch(error){showNotice(`打开失败：${message(error)}`,true);}}
async function handleSave(saveAs=false){try{const path=await saveProject(documentValue(),currentPath.value,saveAs);if(path){currentPath.value=path;await rememberRecent(path);recentProjects.value=await getRecentProjects();}else if('__TAURI_INTERNALS__' in window)return;state.markSaved();showNotice('项目已保存');}catch(error){showNotice(`保存失败：${message(error)}`,true);}}
async function handleExport(options:ExportOptions){try{if(workspaceError.value)return showNotice(workspaceError.value,true);const view=chartTable.value,budget=evaluateComplexity(view,state.settings,options);if(budget.level!=='ok'&&budget.recommendations[0])showNotice(budget.recommendations[0],budget.level==='danger');if(options.batch&&options.format!=='csv'){const count=view.headers.length-1,totalPixels=budget.metrics.exportPixels;if(options.format!=='svg'&&totalPixels>120_000_000)return showNotice(`批量任务过大（${count} 张），请降低尺寸、倍率或列数`,true);const files:{name:string;contents:string}[]=[];for(let index=1;index<view.headers.length;index++){const header=view.headers[index],table={headers:[view.headers[0],header],columnIds:[view.columnIds?.[0]??'category',view.columnIds?.[index]??String(index)],rows:view.rows.map(row=>[row[0],row[index]])},settings={...state.settings,title:`${state.settings.title} · ${header}`,type:['scatter','bubble','heatmap','combo'].includes(state.settings.type)?'bar' as const:state.settings.type};const extension=options.format,contents=extension==='svg'?await renderChartSvg(table,settings,options):await renderChartImage(table,settings,options);files.push({name:`${safeName(options.fileName)}-${safeName(header)}.${extension}`,contents:extension==='pdf'?createPdf(contents,options.width,options.height):contents});showNotice(`正在生成 ${index}/${view.headers.length-1}`);}if(await saveBatchFiles(files,options.format)){showExport.value=false;showNotice(`已批量导出 ${files.length} 张图表`);}return;}let contents:string,extension:ExportOptions['format']=options.format;if(options.format==='csv'){contents=createCsv(view);}else if(options.format==='svg'){contents=await renderChartSvg(view,state.settings,options);}else{const image=await renderChartImage(view,state.settings,options);contents=options.format==='pdf'?createPdf(image,options.width,options.height):image;}const ok=await saveExportFile(contents,`${options.fileName}.${extension}`,extension);if(ok){showExport.value=false;showNotice(`${extension.toUpperCase()} 已导出`);}}catch(error){showNotice(`导出失败：${message(error)}`,true);}}
function safeName(value:string){return value.replace(/[\\/:*?"<>|]/g,'-').trim()||'chart';}
async function handleShare(){try{if(workspaceError.value)return showNotice(workspaceError.value,true);const options:ExportOptions={format:'png',width:1200,height:900,scale:2,background:'theme',fileName:projectName.value};const image=await renderChartImage(chartTable.value,state.settings,options);if(await shareImage(image,`${projectName.value}.png`,state.settings.title)){showNotice('已打开系统分享');return;}if(await saveExportFile(image,`${projectName.value}.png`,'png'))showNotice('当前平台不支持直接分享，已改为保存 PNG');}catch(error){if(message(error).includes('AbortError'))return;showNotice(`分享失败：${message(error)}`,true);}}
async function handleCopy(){const text=`${state.settings.title}${state.settings.subtitle?`\n${state.settings.subtitle}`:''}\n${state.table.value.rows.length} 行数据，${state.table.value.headers.length-1} 个指标${state.settings.source?`\n数据来源：${state.settings.source}`:''}`;try{await copyText(text);showNotice('摘要已复制');}catch(error){showNotice(`复制失败：${message(error)}`,true);}}
async function handleCopySvg(){try{if(workspaceError.value)return showNotice(workspaceError.value,true);const svg=await renderChartSvg(chartTable.value,state.settings,{format:'svg',width:1600,height:900,scale:1,background:'theme',fileName:projectName.value});await copySvg(svg);showNotice('SVG 已复制，可粘贴到 Figma、PPT 或 Illustrator');}catch(error){showNotice(`复制 SVG 失败：${message(error)}`,true);}}
function handleReset(){if(!state.saved.value&&!confirm('当前项目有未保存更改，仍要新建吗？'))return;state.reset();currentPath.value=null;projectName.value='未命名项目';}
function showNotice(text:string,error=false){notice.value=text;window.setTimeout(()=>{if(notice.value===text)notice.value='';},error?4500:2600);}function message(error:unknown){return error instanceof Error?error.message:String(error);}
function keydown(event:KeyboardEvent){if(contextMenu.value&&!event.ctrlKey&&!event.metaKey){contextMenu.value=null;}const mod=event.ctrlKey||event.metaKey;if(!mod)return;const key=event.key.toLowerCase();if(key==='z'){event.preventDefault();event.shiftKey?state.redo():state.undo();}else if(key==='y'){event.preventDefault();state.redo();}else if(key==='s'){event.preventDefault();void handleSave(event.shiftKey);}else if(key==='o'){event.preventDefault();void handleOpen();}}
function beforeUnload(event:BeforeUnloadEvent){if(!state.saved.value){event.preventDefault();event.returnValue='';}}
onMounted(async()=>{
  window.addEventListener('keydown',keydown);window.addEventListener('beforeunload',beforeUnload);recentProjects.value=await getRecentProjects();
  const draft=await loadDraft();if(draft&&confirm('发现自动保存的草稿，是否恢复？')){state.loadProject(draft.data,draft.chart);state.saved.value=false;projectName.value=draft.metadata.name;}
  if('__TAURI_INTERNALS__' in window){
    const [{getCurrentWebview},{invoke},{listen}]=await Promise.all([import('@tauri-apps/api/webview'),import('@tauri-apps/api/core'),import('@tauri-apps/api/event')]);
    unlisteners.push(await getCurrentWebview().onDragDropEvent(event=>{if(event.payload.type==='drop'){const path=event.payload.paths[0];if(path)routeOpenedFile(path);}}));
    unlisteners.push(await listen<string[]>('system-open-files',event=>event.payload.forEach(routeOpenedFile)));
    const startup=await invoke<string[]>('startup_files');startup.forEach(routeOpenedFile);
  }
});
onUnmounted(()=>{window.removeEventListener('keydown',keydown);window.removeEventListener('beforeunload',beforeUnload);window.clearTimeout(draftTimer);unlisteners.splice(0).forEach(unlisten=>unlisten());});
</script>
<template>
  <div class="app-frame" @click="contextMenu=null">
    <AppToolbar
      :can-undo="Boolean(state.undoStack.value.length)"
      :can-redo="Boolean(state.redoStack.value.length)"
      :saved="state.saved.value"
      :theme="state.appTheme.value"
      :file-name="fileLabel"
      @undo="state.undo"
      @redo="state.redo"
      @reset="handleReset"
      @templates="showTemplates = true"
      @about="showAbout = true"
      @properties="showProperties = !showProperties"
      @open="handleOpen"
      @recent="showRecent = !showRecent"
      @save="handleSave(false)"
      @save-as="handleSave(true)"
      @export="showExport = true"
      @copy="handleCopy"
      @copy-svg="handleCopySvg"
      @theme="applyTheme"
    />

    <div class="workspace-grid">
      <DataPanel
        :class="{ 'mobile-hidden': mobileTab !== 'data' }"
        :table="state.table.value"
        :raw="state.rawInput.value"
        :issues="state.issues.value"
        @update:raw="state.rawInput.value = $event"
        @parse="state.parseRaw"
        @import="handleImport(undefined, $event)"
        @cell="state.updateCell"
        @header="state.renameColumn"
        @add-row="state.addRow"
        @delete-rows="state.deleteRows"
        @add-column="state.addColumn"
        @delete-column="state.deleteColumn"
      />
      <ChartCanvas
        ref="chart"
        :class="{ 'mobile-hidden': mobileTab !== 'chart' }"
        :table="chartTable"
        :settings="state.settings"
        :zoom="state.zoom.value"
        :error-message="workspaceError"
        :complexity-notices="complexityBudget.recommendations"
        @select="focusProperty"
        @context="handleContext"
      />
      <PropertyPanel
        :class="{ 'mobile-hidden': mobileTab !== 'style', 'drawer-open': showProperties }"
        :settings="state.settings"
        :numeric-columns="chartTable.headers.length - 1"
        :headers="state.table.value.headers"
        :column-ids="state.table.value.columnIds"
        :focus="focusTarget"
        @change="changeSettings"
        @select-data="showDataSelect = true"
      />
    </div>

    <nav class="mobile-tabs" aria-label="移动工作区">
      <button :class="{ active: mobileTab === 'data' }" @click="mobileTab = 'data'">数据</button>
      <button :class="{ active: mobileTab === 'chart' }" @click="mobileTab = 'chart'">图表</button>
      <button :class="{ active: mobileTab === 'style' }" @click="mobileTab = 'style'">样式</button>
      <button class="share-tab" @click="handleShare">分享</button>
    </nav>

    <StatusBar
      :rows="state.table.value.rows.length"
      :cols="state.table.value.headers.length"
      :errors="errorCount"
      :saved="state.saved.value"
      :draft-status="draftStatus"
      :last-auto-saved="lastAutoSaved"
      :zoom="state.zoom.value"
      @zoom="state.zoom.value = $event"
    />
    <ChartContextMenu v-if="contextMenu" :table="chartTable" :settings="state.settings" :payload="contextMenu" :has-clipboard-style="Boolean(styleClipboard)" @close="contextMenu=null" @focus="focusProperty" @change="changeSettings" @copy-style="copySeriesStyle" @paste-style="pasteSeriesStyle" />
    <DataSelectDialog v-if="showDataSelect" :table="state.table.value" :settings="state.settings" @close="showDataSelect=false" @apply="applyDataSelection" />
    <TemplateDialog
      v-if="showTemplates"
      :user-templates="userTemplates"
      @close="showTemplates = false"
      @select="applyTemplate"
      @save="saveCurrentTemplate"
      @remove="removeTemplate"
    />
    <AboutDialog v-if="showAbout" :version="appVersion" @close="showAbout = false" />
    <ExportDialog
      v-if="showExport"
      :project-name="projectName"
      :series-count="chartTable.headers.length - 1"
      @close="showExport = false"
      @export="handleExport"
    />

    <div v-if="notice" class="native-notice">{{ notice }}</div>
    <div v-if="importing" class="import-progress">
      <span class="progress-spinner"></span>
      <strong>正在解析文件</strong>
      <button @click="cancelImport">取消</button>
    </div>

    <div v-if="importSheets.length" class="modal-backdrop" @click.self="importSheets = []">
      <section class="sheet-dialog">
        <header>
          <div>
            <span class="eyebrow">WORKBOOK</span>
            <h3>选择工作表</h3>
          </div>
          <button @click="importSheets = []">×</button>
        </header>
        <p>{{ importName }} 包含 {{ importSheets.length }} 个工作表</p>
        <button
          v-for="sheet in importSheets"
          :key="sheet.name"
          class="sheet-option"
          @click="applySheet(sheet)"
        >
          <strong>{{ sheet.name }}</strong>
          <span>{{ sheet.rows.length }} 行 × {{ sheet.headers.length }} 列</span>
        </button>
      </section>
    </div>

    <aside v-if="showRecent && recentProjects.length" class="recent-projects">
      <span>最近项目</span>
      <button
        v-for="path in recentProjects.slice(0, 3)"
        :key="path"
        :title="path"
        @click="openRecent(path)"
      >
        {{ path.split(/[\\/]/).pop() }}
      </button>
    </aside>
  </div>
</template>
