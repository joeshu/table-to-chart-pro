import type { ChartSettings } from '../state/project';
import type { DataTable } from '../types';
import type { ExportFormat } from '../export/exporter';

export type ComplexityLevel='ok'|'info'|'warning'|'danger';
export interface ExportBudgetInput{format:ExportFormat;width:number;height:number;scale:number;batch?:boolean}
export interface ComplexityBudget{level:ComplexityLevel;metrics:{series:number;rows:number;points:number;labels:number;trendlines:number;exportPixels:number;exportCharts:number};recommendations:string[]}
const order:ComplexityLevel[]=['ok','info','warning','danger'];
function trendlines(settings:ChartSettings){return Object.values(settings.seriesTrendlines??{}).filter(value=>value&&value!=='none').length+(settings.showTrendline?1:0);}
function bump(current:ComplexityLevel,next:ComplexityLevel){return order.indexOf(next)>order.indexOf(current)?next:current;}
export function evaluateComplexity(table:DataTable,settings:ChartSettings,exportJob?:ExportBudgetInput):ComplexityBudget{
  const series=Math.max(0,table.headers.length-1),rows=table.rows.length,points=series*rows,labels=settings.showDataLabels?points:0,trendlineCount=trendlines(settings),exportCharts=exportJob?.batch?Math.max(1,series):1,exportPixels=exportJob&&exportJob.format!=='csv'?exportJob.width*exportJob.height*exportJob.scale*exportJob.scale*exportCharts:0,recommendations:string[]=[];
  let level:ComplexityLevel='ok';
  function add(next:ComplexityLevel,message:string){level=bump(level,next);recommendations.push(message);}
  if(series>20)add('danger',`当前 ${series} 个系列过多，建议用“选择数据”隐藏次要系列或拆成多张图。`);else if(series>12)add('warning',`当前 ${series} 个系列较多，建议只保留核心系列以提升可读性。`);
  if(points>50000)add('danger',`当前 ${points.toLocaleString()} 个数据点接近浏览器渲染上限，建议聚合、抽样或缩小数据范围。`);else if(points>10000)add('warning',`当前 ${points.toLocaleString()} 个数据点较多，建议关闭动画或按周/月聚合。`);
  if(labels>10000)add('danger',`当前需绘制 ${labels.toLocaleString()} 个数据标签，建议关闭数据标签。`);else if(labels>1800)add('warning',`当前数据标签较密，建议仅在重点系列显示标签。`);
  if(trendlineCount>8)add('danger',`当前 ${trendlineCount} 条趋势线会明显拖慢渲染，建议保留关键趋势线。`);else if(trendlineCount>4)add('warning',`当前趋势线较多，建议减少到 4 条以内。`);
  if(settings.animate&&points>8000)add('info','数据点较多时建议关闭动画，交互会更稳定。');
  if(exportPixels>120_000_000)add('danger',`批量导出预计 ${(exportPixels/1_000_000).toFixed(0)}M 像素，建议降低尺寸、倍率或分批导出。`);else if(exportPixels>40_000_000)add('warning',`导出预计 ${(exportPixels/1_000_000).toFixed(0)}M 像素，建议使用 1×/2× 或减少批量列数。`);
  return{level,metrics:{series,rows,points,labels,trendlines:trendlineCount,exportPixels,exportCharts},recommendations};
}
