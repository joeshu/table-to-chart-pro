import { computed, reactive, ref } from 'vue';
import { parseTable } from '../data/parser';
import { validateTable } from '../data/validator';
import type { ChartType, DataTable } from '../types';

export type ThemeName = 'business' | 'ocean' | 'forest' | 'sunset' | 'dark' | 'rose';
export type AppTheme = 'system' | 'light' | 'dark';

export type LegendPosition = 'top' | 'bottom' | 'left' | 'right';
export type NumberFormat = 'number' | 'compact' | 'percent' | 'currency';

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
  comboBarColumns: number[];
  rightAxisTitle: string;
  rightAxisFormat: NumberFormat | 'auto';
  y2Min: number | null;
  y2Max: number | null;
  y2Step: number | null;
  yBeginAtZero: boolean;
  y2BeginAtZero: boolean;
  comboRightAxisColumns: number[] | null;
  hiddenColumns: number[];
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
  seriesOrder: number[];
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
}

export function createDefaultChartSettings():ChartSettings{return {
  type:'bar',theme:'business',title:'数据可视化',subtitle:'',source:'',xAxisTitle:'',yAxisTitle:'',legendPosition:'top',showLegend:true,showDataLabels:false,showGrid:true,animate:true,background:'',numberFormat:'number',decimals:0,horizontal:false,stacked:false,smooth:true,areaFill:false,customColors:[],yMin:null,yMax:null,yStep:null,valuePrefix:'',valueSuffix:'',percentageStacked:false,connectGaps:false,pieCutout:55,pieRotation:0,showTrendline:false,pieCenterText:'',pieMergeSmallThreshold:0,comboBarColumns:[1],rightAxisTitle:'',rightAxisFormat:'auto',y2Min:null,y2Max:null,y2Step:null,yBeginAtZero:true,y2BeginAtZero:true,comboRightAxisColumns:null,hiddenColumns:[],barCategoryPercentage:.8,barPercentage:.9,barRadius:5,barBorderWidth:0,lineWidth:2,lineDash:false,pointRadius:4,xLabelRotation:0,dataLabelPosition:'auto',lineStepped:false,xMaxTicks:12,showAxisBorder:true,gridLineWidth:1,seriesNames:{},seriesOrder:[],seriesOpacity:{},seriesLineWidths:{},seriesPointRadii:{},seriesDashed:{},xAxisFontSize:11,xAxisColor:'',yAxisFontSize:11,yAxisColor:'',yAxisDecimals:null,y2AxisFontSize:11,y2AxisColor:'',y2AxisDecimals:null,titleFontSize:18,titleColor:'',titleAlign:'center',subtitleFontSize:12,subtitleColor:'',legendFontSize:11,legendPointStyle:'circle',legendReverse:false,dataLabelFontSize:10,dataLabelColor:'',dataLabelBackground:'',dataLabelBorderColor:'',plotPadding:8,plotBorderWidth:0,plotBorderColor:'',
};}

const emptyTable = (): DataTable => ({ headers: ['项目', '数值'], rows: [['示例 A', '120'], ['示例 B', '180'], ['示例 C', '150']] });

export function useProjectState() {
  const table = ref<DataTable>(emptyTable());
  const rawInput = ref('项目\t数值\n示例 A\t120\n示例 B\t180\n示例 C\t150');
  const settings = reactive<ChartSettings>(createDefaultChartSettings());
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
    table.value = parseTable(rawInput.value);
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
    table.value.headers.push(name); table.value.rows.forEach(row => row.push('0')); commit(previous);
  }
  function deleteColumn(index: number) {
    if (table.value.headers.length <= 2) return false;
    const previous = snapshot(); table.value.headers.splice(index, 1); table.value.rows.forEach(row => row.splice(index, 1)); commit(previous); return true;
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
    const previous = snapshot(); table.value = emptyTable(); rawInput.value = '项目\t数值\n示例 A\t120\n示例 B\t180\n示例 C\t150';Object.assign(settings,createDefaultChartSettings()); commit(previous);
  }
  function setTheme(theme: AppTheme) { appTheme.value = theme; localStorage.setItem('app-theme', theme); }
  function loadTable(data: DataTable) {
    const previous = snapshot(); table.value = JSON.parse(JSON.stringify(data));
    rawInput.value = [table.value.headers.join('\t'), ...table.value.rows.map(row => row.join('\t'))].join('\n');
    commit(previous);
  }
  function loadProject(data: DataTable, chart: ChartSettings) {
    table.value = JSON.parse(JSON.stringify(data));
    Object.assign(settings,createDefaultChartSettings(),chart,{customColors:chart.customColors??[]});
    rawInput.value = [table.value.headers.join('\t'), ...table.value.rows.map(row => row.join('\t'))].join('\n');
    undoStack.value = []; redoStack.value = []; saved.value = true;
  }
  function markSaved() { saved.value = true; }

  return { table, rawInput, settings, appTheme, zoom, saved, issues, hasErrors, undoStack, redoStack, parseRaw, updateCell, renameColumn, addRow, deleteRows, addColumn, deleteColumn, undo, redo, reset, setTheme, loadTable, loadProject, markSaved };
}
