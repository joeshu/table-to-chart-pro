import type { ChartSettings, SeriesRef } from '../state/project';
import type { DataTable } from '../types';

function resolveColumn(table:DataTable,ref:SeriesRef|undefined,fallback=0){
  if(typeof ref==='number')return ref>=0&&ref<table.headers.length?ref:fallback;
  const index=table.columnIds?.indexOf(ref??'')??-1;
  return index>=0?index:fallback;
}
function idAt(table:DataTable,index:number){return table.columnIds?.[index]??String(index);}
function resolveRefs(table:DataTable,refs:SeriesRef[]|null|undefined){return(refs??[]).map(ref=>resolveColumn(table,ref,-1)).filter(index=>index>0&&index<table.headers.length);}

/** Build the non-destructive chart view selected in the Excel-style data window. */
export function buildChartTable(table:DataTable,settings:ChartSettings):DataTable{
  const category=resolveColumn(table,settings.categoryColumn,0);
  const source=table.headers.map((_,index)=>index).filter(index=>index!==category&&index>0);
  const hidden=new Set(resolveRefs(table,settings.hiddenColumns));
  const visible=source.filter(index=>!hidden.has(index));
  const requested=resolveRefs(table,settings.seriesOrder).filter(index=>visible.includes(index));
  const columns=[category,...requested,...visible.filter(index=>!requested.includes(index))];
  const start=Math.max(0,(settings.dataStartRow??1)-1);
  const end=Math.min(table.rows.length,Math.max(start,settings.dataEndRow??table.rows.length));
  return {
    headers:columns.map(index=>table.headers[index]),
    columnIds:columns.map(index=>idAt(table,index)),
    rows:table.rows.slice(start,end).map(row=>columns.map(index=>row[index]??'')),
  };
}

export function selectedSeriesIds(table:DataTable,settings:ChartSettings){
  const category=resolveColumn(table,settings.categoryColumn,0);
  const hidden=new Set(resolveRefs(table,settings.hiddenColumns));
  return table.headers.map((_,index)=>index).filter(index=>index>0&&index!==category&&!hidden.has(index)).map(index=>idAt(table,index));
}
