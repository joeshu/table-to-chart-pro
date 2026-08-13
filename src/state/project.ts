import { computed, reactive, ref } from 'vue';
import { parseTable } from '../data/parser';
import { validateTable } from '../data/validator';
import {createColumnId,ensureColumnIds,type ChartType,type DataTable} from '../types';

export type ThemeName = 'business' | 'ocean' | 'forest' | 'sunset' | 'dark' | 'rose';
export type AppTheme = 'system' | 'light' | 'dark';

export type LegendPosition = 'top' | 'bottom' | 'left' | 'right';
export type NumberFormat = 'number' | 'compact' | 'percent' | 'currency';
export type SeriesRef = number | string;

export interface ChartSettings {
  type: ChartType;
  theme: ThemeName;
  title: string;
  subtitle: string;
  source: string;
  xAxisTitle: string;
  yAxisTitle: string;
  legendPosition: LegendPosition;
  showLegend: boolean;
  showDataLabels: boolean;
  showGrid: boolean;
  animate: boolean;
  background: string;
  numberFormat: NumberFormat;
  decimals: number;
  horizontal: boolean;
  stacked: boolean;
  smooth: boolean;
  areaFill: boolean;
  customColors: string[];
  seriesColors?: Record<string,string>;
  yMin: number | null;
  yMax: number | null;
  yStep: number | null;
  valuePrefix: string;
  valueSuffix: string;
  percentageStacked: boolean;
  connectGaps: boolean;
  pieCutout: number;
  pieRotation: number;
  showTrendline: boolean;
  pieCenterText: string;
  pieMergeSmallThreshold: number;
  comboBarColumns: SeriesRef[];
  rightAxisTitle: string;
  rightAxisFormat: NumberFormat | 'auto';
  y2Min: number | null;
  y2Max: number | null;
  y2Step: number | null;
  yBeginAtZero: boolean;
  y2BeginAtZero: boolean;
  comboRightAxisColumns: SeriesRef[] | null;
  hiddenColumns: SeriesRef[];
  barCategoryPercentage: number;
  barPercentage: number;
  barRadius: number;
  barBorderWidth: number;
  lineWidth: number;
  lineDash: boolean;
  pointRadius: number;
  xLabelRotation: number;
  dataLabelPosition: 'auto' | 'top' | 'center';
  lineStepped: boolean;
  xMaxTicks: number;
  showAxisBorder: boolean;
  gridLineWidth: number;
  seriesNames: Record<string,string>;
  seriesOrder: SeriesRef[];
  seriesOpacity: Record<string,number>;
  seriesLineWidths: Record<string,number>;
  seriesPointRadii: Record<string,number>;
  seriesDashed: Record<string,boolean>;
  xAxisFontSize: number;
  xAxisColor: string;
  yAxisFontSize: number;
  yAxisColor: string;
  yAxisDecimals: number | null;
  y2AxisFontSize: number;
  y2AxisColor: string;
  y2AxisDecimals: number | null;
  titleFontSize: number;
  titleColor: string;
  titleAlign: 'start' | 'center' | 'end';
  subtitleFontSize: number;
  subtitleColor: string;
  legendFontSize: number;
  legendPointStyle: 'circle' | 'rect' | 'line';
  legendReverse: boolean;
  dataLabelFontSize: number;
  dataLabelColor: string;
  dataLabelBackground: string;
  dataLabelBorderColor: string;
  plotPadding: number;
  plotBorderWidth: number;
  plotBorderColor: string;
  seriesPointStyles: Record<string,'circle'|'rect'|'triangle'|'rectRot'|'cross'>;
  seriesTrendlines: Record<string,'none'|'linear'|'polynomial'|'movingAverage'>;
  seriesMovingAveragePeriods: Record<string,number>;
  showTrendEquation: boolean;
  showTrendR2: boolean;
  yScaleType: 'linear' | 'logarithmic';
  y2ScaleType: 'linear' | 'logarithmic';
  yReverse: boolean;
  y2Reverse: boolean;
  dataLabelRotation: number;
  dataLabelOffset: number;
  categoryColumn?: SeriesRef;
  dataStartRow?: number;
  dataEndRow?: number | null;
  plotMarginTop?: number;
  plotMarginRight?: number;
  plotMarginBottom?: number;
  plotMarginLeft?: number;
}

export function createDefaultChartSettings():ChartSettings{return {
  type:'bar',theme:'business',title:'数据可视化',subtitle:'',source:'',xAxisTitle:'',yAxisTitle:'',legendPosition:'top',showLegend:true,showDataLabels:false,showGrid:true,animate:true,background:'',numberFormat:'number',decimals:0,horizontal:false,stacked:false,smooth:true,areaFill:false,customColors:[],seriesColors:{},yMin:null,yMax:null,yStep:null,valuePrefix:'',valueSuffix:'',percentageStacked:false,connectGaps:false,pieCutout:55,pieRotation:0,showTrendline:false,pieCenterText:'',pieMergeSmallThreshold:0,comboBarColumns:[1],rightAxisTitle:'',rightAxisFormat:'auto',y2Min:null,y2Max:null,y2Step:null,yBeginAtZero:true,y2BeginAtZero:true,comboRightAxisColumns:null,hiddenColumns:[],barCategoryPercentage:.8,barPercentage:.9,barRadius:5,barBorderWidth:0,lineWidth:2,lineDash:false,pointRadius:4,xLabelRotation:0,dataLabelPosition:'auto',lineStepped:false,xMaxTicks:12,showAxisBorder:true,gridLineWidth:1,seriesNames:{},seriesOrder:[],seriesOpacity:{},seriesLineWidths:{},seriesPointRadii:{},seriesDashed:{},xAxisFontSize:11,xAxisColor:'',yAxisFontSize:11,yAxisColor:'',yAxisDecimals:null,y2AxisFontSize:11,y2AxisColor:'',y2AxisDecimals:null,titleFontSize:18,titleColor:'',titleAlign:'center',subtitleFontSize:12,subtitleColor:'',legendFontSize:11,legendPointStyle:'circle',legendReverse:false,dataLabelFontSize:10,dataLabelColor:'',dataLabelBackground:'',dataLabelBorderColor:'',plotPadding:8,plotBorderWidth:0,plotBorderColor:'',seriesPointStyles:{},seriesTrendlines:{},seriesMovingAveragePeriods:{},showTrendEquation:true,showTrendR2:true,yScaleType:'linear',y2ScaleType:'linear',yReverse:false,y2Reverse:false,dataLabelRotation:0,dataLabelOffset:0,categoryColumn:0,dataStartRow:1,dataEndRow:null,plotMarginTop:28,plotMarginRight:16,plotMarginBottom:28,plotMarginLeft:24,
};}

const emptyTable=():DataTable=>ensureColumnIds({headers:['项目','数值'],rows:[['示例 A','120'],['示例 B','180'],['示例 C','150']]});

const seriesArrayKeys=['comboBarColumns','comboRightAxisColumns','hiddenColumns','seriesOrder'] as const;
const seriesMapKeys=['seriesColors','seriesNames','seriesOpacity','seriesLineWidths','seriesPointRadii','seriesDashed','seriesPointStyles','seriesTrendlines','seriesMovingAveragePeriods'] as const;
function migrateSeriesBindings(data:DataTable,chart:ChartSettings){const ids=data.columnIds??[];for(const key of seriesArrayKeys){const current=chart[key];if(current===null)continue;(chart as any)[key]=(current??[]).map((ref:SeriesRef)=>typeof ref==='number'?ids[ref]:ref).filter((ref:unknown)=>typeof ref==='string'&&ids.includes(ref));}for(const key of seriesMapKeys){const current=(chart as any)[key]??{},next:Record<string,unknown>={};for(const [ref,value] of Object.entries(current)){const id=/^\d+$/.test(ref)?ids[Number(ref)]:ref;if(id&&ids.includes(id))next[id]=value;}(chart as any)[key]=next;}chart.seriesColors=chart.seriesColors??{};(chart.customColors??[]).forEach((color,index)=>{const id=ids[index+1];if(id&&!chart.seriesColors?.[id])chart.seriesColors![id]=color;});if(!chart.comboBarColumns.length&&ids[1])chart.comboBarColumns=[ids[1]];}
function clearSeriesBindings(chart:ChartSettings,data:DataTable){for(const key of seriesMapKeys)(chart as any)[key]={};chart.hiddenColumns=[];chart.seriesOrder=[];chart.comboRightAxisColumns=null;chart.comboBarColumns=data.columnIds?.[1]?[data.columnIds[1]]:[];}

export function useProjectState() {
  const table = ref<DataTable>(emptyTable());
  const rawInput = ref('项目\t数值\n示例 A\t120\n示例 B\t180\n示例 C\t150');
  const settings = reactive<ChartSettings>(createDefaultChartSettings());migrateSeriesBindings(table.value,settings);
  const appTheme = ref<AppTheme>((localStorage.getItem('app-theme') as AppTheme) || 'system');
  const zoom = ref(100);
  const saved = ref(true);
  const undoStack = ref<DataTable[]>([]);
  const redoStack = ref<DataTable[]>([]);
  const issues = computed(() => validateTable(table.value));
  const hasErrors = computed(() => issues.value.some(issue => issue.level === 'error'));

  function snapshot() { return JSON.parse(JSON.stringify(table.value)) as DataTable; }
  function commit(previous = snapshot()) {
    undoStack.value.push(previous);
    if (undoStack.value.length > 50) undoStack.value.shift();
    redoStack.value = [];
    saved.value = false;
  }
  function parseRaw() {
    const previous = snapshot();
    const parsed=parseTable(rawInput.value);table.value=ensureColumnIds({...parsed,columnIds:table.value.columnIds});
    commit(previous);
  }
  function updateCell(row: number, col: number, value: string) {
    if (table.value.rows[row][col] === value) return;
    const previous = snapshot(); table.value.rows[row][col] = value; commit(previous);
  }
  function renameColumn(col: number, value: string) {
    if (!value.trim() || table.value.headers[col] === value.trim()) return;
    const previous = snapshot(); table.value.headers[col] = value.trim(); commit(previous);
  }
  function addRow() {
    const previous = snapshot();
    table.value.rows.push([`新项 ${table.value.rows.length + 1}`, ...Array(table.value.headers.length - 1).fill('0')]); commit(previous);
  }
  function deleteRows(indices: number[]) {
    if (!indices.length || indices.length >= table.value.rows.length) return false;
    const previous = snapshot(); const selected = new Set(indices);
    table.value.rows = table.value.rows.filter((_, index) => !selected.has(index)); commit(previous); return true;
  }
  function addColumn() {
    const previous = snapshot(); const name = `新指标 ${table.value.headers.length}`;
    table.value.headers.push(name);table.value.columnIds?.push(createColumnId('series'));table.value.rows.forEach(row => row.push('0')); commit(previous);
  }
  function deleteColumn(index: number) {
    if (table.value.headers.length <= 2) return false;
    const previous=snapshot();migrateSeriesBindings(table.value,settings);table.value.headers.splice(index,1);table.value.columnIds?.splice(index,1);table.value.rows.forEach(row=>row.splice(index,1));migrateSeriesBindings(table.value,settings);commit(previous);return true;
  }
  function undo() {
    const previous = undoStack.value.pop(); if (!previous) return;
    redoStack.value.push(snapshot()); table.value = previous; saved.value = false;
  }
  function redo() {
    const next = redoStack.value.pop(); if (!next) return;
    undoStack.value.push(snapshot()); table.value = next; saved.value = false;
  }
  function reset() {
    const previous = snapshot(); table.value = emptyTable(); rawInput.value = '项目\t数值\n示例 A\t120\n示例 B\t180\n示例 C\t150';Object.assign(settings,createDefaultChartSettings());migrateSeriesBindings(table.value,settings); commit(previous);
  }
  function setTheme(theme: AppTheme) { appTheme.value = theme; localStorage.setItem('app-theme', theme); }
  function normalizeSeriesBindings(){migrateSeriesBindings(table.value,settings);}
  function loadTable(data:DataTable){const previous=snapshot();table.value=ensureColumnIds(data);clearSeriesBindings(settings,table.value);rawInput.value=[table.value.headers.join('\t'),...table.value.rows.map(row=>row.join('\t'))].join('\n');commit(previous);}
  function loadProject(data:DataTable,chart:ChartSettings){
    table.value=ensureColumnIds(data,true);Object.assign(settings,createDefaultChartSettings(),chart,{customColors:chart.customColors??[]});migrateSeriesBindings(table.value,settings);
    rawInput.value=[table.value.headers.join('\t'),...table.value.rows.map(row=>row.join('\t'))].join('\n');undoStack.value=[];redoStack.value=[];saved.value=true;
  }
  function markSaved() { saved.value = true; }

  return { table, rawInput, settings, appTheme, zoom, saved, issues, hasErrors, undoStack, redoStack, parseRaw, updateCell, renameColumn, addRow, deleteRows, addColumn, deleteColumn, undo, redo, reset, setTheme, loadTable, loadProject, normalizeSeriesBindings, markSaved };
}
