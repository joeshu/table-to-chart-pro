export type IssueLevel = 'error' | 'warning' | 'info';

export interface DataIssue {
  level: IssueLevel;
  row: number;
  col: number;
  message: string;
}

export interface DataTable {
  headers: string[];
  rows: string[][];
  columnIds?: string[];
}

let columnSequence=0;
export function createColumnId(prefix='column'){columnSequence++;return `${prefix}-${Date.now().toString(36)}-${columnSequence.toString(36)}`;}
export function ensureColumnIds(table:DataTable,legacy=false):DataTable{const existing=Array.isArray(table.columnIds)?table.columnIds:[];return {...table,columnIds:table.headers.map((_,index)=>existing[index]||(legacy?`legacy-column-${index}`:createColumnId(index===0?'category':'series')))};}
export function columnId(table:DataTable,index:number){return table.columnIds?.[index]??`legacy-column-${index}`;}

export interface NumericResult {
  value: number | null;
  kind: 'number' | 'percent' | 'empty' | 'invalid';
}

export type ChartType = 'bar' | 'line' | 'area' | 'combo' | 'pie' | 'doughnut' | 'radar' | 'scatter' | 'bubble' | 'waterfall' | 'heatmap' | 'funnel';
