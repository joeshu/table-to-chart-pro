import type { ChartType, DataTable } from '../types';
import type { ChartSettings, NumberFormat, ThemeName } from '../state/project';
import { parseNumericValue } from '../data/parser';

export const palettes: Record<ThemeName, { colors: string[]; background: string; text: string; grid: string }> = {
  business:{colors:['#5b5ce2','#18a7c9','#e5a93d','#d05252','#687386'],background:'#ffffff',text:'#172033',grid:'#e8eaf0'},
  ocean:{colors:['#087f8c','#5bc0be','#f4d35e','#ee964b','#5c677d'],background:'#f7fcfd',text:'#18323a',grid:'#dcebed'},
  forest:{colors:['#168a62','#62a87c','#f2c14e','#d95d39','#426a5a'],background:'#f7fbf8',text:'#17362d',grid:'#dce9e2'},
  sunset:{colors:['#d1495b','#edae49','#00798c','#30638e','#6f4e7c'],background:'#fffaf7',text:'#39242a',grid:'#f0e1da'},
  dark:{colors:['#7c83ff','#2ec4b6','#ffbf69','#ff6b6b','#a8b2c1'],background:'#171a22',text:'#f4f6fb',grid:'#303543'},
  rose:{colors:['#b84a7c','#da7f8f','#e5b181','#7f8f6b','#687386'],background:'#fff9fb',text:'#38232d',grid:'#f0dfe6'},
};

export function formatChartValue(value: number, format: NumberFormat, decimals: number): string {
  if (!Number.isFinite(value)) return '—';
  if (format === 'compact') return new Intl.NumberFormat('zh-CN',{notation:'compact',maximumFractionDigits:decimals}).format(value);
  if (format === 'percent') return new Intl.NumberFormat('zh-CN',{style:'percent',minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(value);
  if (format === 'currency') return new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY',minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(value);
  return new Intl.NumberFormat('zh-CN',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(value);
}

export const dataLabelPlugin = {
  id:'workspaceDataLabels',
  afterDatasetsDraw(chart: any, _args: unknown, options: any) {
    if (!options?.enabled) return;
    const { ctx } = chart; ctx.save(); ctx.font='600 11px Inter, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillStyle=options.color;
    chart.data.datasets.forEach((dataset: any,index: number)=>{
      const meta=chart.getDatasetMeta(index); if(meta.hidden)return;
      meta.data.forEach((element:any,dataIndex:number)=>{
        const raw=dataset.data[dataIndex]; const value=typeof raw==='object'?(raw.y??raw.x):raw;
        if(typeof value!=='number')return; const point=element.tooltipPosition(); ctx.fillText(options.formatter(value),point.x,point.y-5);
      });
    }); ctx.restore();
  },
};

export function buildChartConfig(table: DataTable, settings: ChartSettings) {
  const palette=palettes[settings.theme], labels=table.rows.map(row=>row[0]);
  const numeric=(col:number)=>table.rows.map(row=>parseNumericValue(row[col]).value??0);
  const formatter=(value:number)=>formatChartValue(value,settings.numberFormat,settings.decimals);
  const tooltip={callbacks:{label:(context:any)=>`${context.dataset.label?`${context.dataset.label}: `:''}${formatter(Number(context.raw?.y??context.raw))}`}};
  const common:any={responsive:true,maintainAspectRatio:false,indexAxis:settings.type==='bar'&&settings.horizontal?'y':'x',animation:settings.animate?{duration:450}:false,plugins:{legend:{display:settings.showLegend,position:settings.legendPosition,labels:{color:palette.text,usePointStyle:true,padding:18}},title:{display:Boolean(settings.title),text:settings.title,color:palette.text,font:{size:18,weight:'600'},padding:{bottom:settings.subtitle?4:16}},subtitle:{display:Boolean(settings.subtitle),text:settings.subtitle,color:palette.text,font:{size:12,weight:'normal'},padding:{bottom:16}},tooltip,workspaceDataLabels:{enabled:settings.showDataLabels,color:palette.text,formatter}}};
  if(settings.type==='pie'||settings.type==='doughnut') return {type:settings.type,data:{labels,datasets:[{label:table.headers[1],data:numeric(1),backgroundColor:palette.colors,borderColor:palette.background,borderWidth:2}]},options:common,plugins:[dataLabelPlugin]};
  if(settings.type==='scatter') return {type:'scatter',data:{datasets:[{label:`${table.headers[1]} / ${table.headers[2]}`,data:table.rows.map(row=>({x:parseNumericValue(row[1]).value??0,y:parseNumericValue(row[2]).value??0})),backgroundColor:palette.colors[0]+'99',borderColor:palette.colors[0],pointRadius:6}]},options:{...common,scales:axes(palette,settings,formatter)},plugins:[dataLabelPlugin]};
  const type=(settings.type==='heatmap'||settings.type==='funnel'?'bar':settings.type) as ChartType;
  const datasets=table.headers.slice(1).map((header,index)=>({label:header,data:numeric(index+1),backgroundColor:type==='line'||type==='radar'?(settings.areaFill||type==='radar'?palette.colors[index%palette.colors.length]+'33':'transparent'):palette.colors[index%palette.colors.length],borderColor:palette.colors[index%palette.colors.length],borderWidth:2,borderRadius:type==='bar'?5:0,tension:settings.smooth?.36:0,fill:type==='radar'||(type==='line'&&settings.areaFill),stack:settings.stacked?'main':undefined,pointRadius:type==='line'?3:undefined}));
  const options=type==='radar'?{...common,scales:{r:{grid:{display:settings.showGrid,color:palette.grid},pointLabels:{color:palette.text},ticks:{display:false}}}}:{...common,scales:axes(palette,settings,formatter)};
  return {type,data:{labels,datasets},options,plugins:[dataLabelPlugin]};
}

function axes(palette:{text:string;grid:string},settings:ChartSettings,formatter:(value:number)=>string){
  const category={stacked:settings.stacked,title:{display:Boolean(settings.xAxisTitle),text:settings.xAxisTitle,color:palette.text},grid:{display:false},ticks:{color:palette.text,maxRotation:40}};
  const value={stacked:settings.stacked,beginAtZero:true,title:{display:Boolean(settings.yAxisTitle),text:settings.yAxisTitle,color:palette.text},grid:{display:settings.showGrid,color:palette.grid},ticks:{color:palette.text,callback:(value:any)=>formatter(Number(value))}};
  return settings.type==='bar'&&settings.horizontal?{x:value,y:category}:{x:category,y:value};
}
