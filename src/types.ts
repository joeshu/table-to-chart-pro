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
}

export interface NumericResult {
  value: number | null;
  kind: 'number' | 'percent' | 'empty' | 'invalid';
}

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'scatter' | 'heatmap' | 'funnel';
