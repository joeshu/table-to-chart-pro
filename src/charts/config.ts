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
        const raw=dataset.data[dataIndex]; const value=Array.isArray(raw)?raw[1]-raw[0]:typeof raw==='object'?(raw.v??raw.y??raw.x):raw;
        if(typeof value!=='number')return; const point=element.tooltipPosition(); const formatter=dataset.valueFormatter??options.formatter; ctx.fillText(formatter(value),point.x,point.y-5);
      });
    }); ctx.restore();
  },
};

export const insightPlugin={id:'workspaceInsights',afterDraw(chart:any,_args:unknown,options:any){if(!options)return;const {ctx,chartArea}=chart;ctx.save();if(options.centerText){ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=options.color;ctx.font='700 18px Inter, sans-serif';ctx.fillText(options.centerText,(chartArea.left+chartArea.right)/2,(chartArea.top+chartArea.bottom)/2);}if(options.heatLegend){const {min,max,color,formatter}=options.heatLegend,w=150,h=8,x=chartArea.right-w,y=chartArea.top-16,gradient=ctx.createLinearGradient(x,0,x+w,0);gradient.addColorStop(0,heatColor(min,min,max,color));gradient.addColorStop(1,heatColor(max,min,max,color));ctx.fillStyle=gradient;ctx.fillRect(x,y,w,h);ctx.fillStyle=options.color;ctx.font='10px Inter, sans-serif';ctx.textAlign='right';ctx.fillText(`${formatter(min)} → ${formatter(max)}`,x+w,y-2);}if(options.funnelValues){const values:number[]=options.funnelValues,meta=chart.getDatasetMeta(0);ctx.fillStyle=options.color;ctx.font='600 10px Inter, sans-serif';ctx.textAlign='left';meta.data.forEach((element:any,index:number)=>{if(index===0)return;const previous=values[index-1],change=previous?(values[index]/previous-1)*100:0,point=element.tooltipPosition(),label=change>0?`增长 ${change.toFixed(1)}%`:`流失 ${Math.abs(change).toFixed(1)}%`;ctx.fillText(label,point.x+8,point.y+4);});}ctx.restore();}};

export function buildChartConfig(table: DataTable, settings: ChartSettings) {
  const basePalette=palettes[settings.theme], customColors=settings.customColors??[], palette={...basePalette,background:settings.background||basePalette.background,colors:customColors.length?customColors:basePalette.colors}, labels=table.rows.map(row=>row[0]);
  const numeric=(col:number)=>table.rows.map(row=>parseNumericValue(row[col]).value??0);
  const numericNullable=(col:number)=>table.rows.map(row=>parseNumericValue(row[col]).value);
  const isPercentColumn=(col:number)=>table.rows.some(row=>String(row[col]??'').trim().endsWith('%'));
  const columnFormatter=(col:number)=>(value:number)=>isPercentColumn(col)?`${settings.valuePrefix??''}${(value*100).toFixed(Math.max(1,settings.decimals))}%${settings.valueSuffix??''}`:formatter(value);
  const formatter=(value:number)=>`${settings.valuePrefix??''}${formatChartValue(value,settings.numberFormat,settings.decimals)}${settings.valueSuffix??''}`;
  const tooltip={callbacks:{label:(context:any)=>`${context.dataset.label?`${context.dataset.label}: `:''}${(context.dataset.valueFormatter??formatter)(Number(context.raw?.y??context.raw))}`}};
  const common:any={responsive:true,maintainAspectRatio:false,indexAxis:settings.type==='bar'&&settings.horizontal?'y':'x',animation:settings.animate?{duration:450}:false,plugins:{legend:{display:settings.showLegend,position:settings.legendPosition,labels:{color:palette.text,usePointStyle:true,padding:18}},title:{display:Boolean(settings.title),text:settings.title,color:palette.text,font:{size:18,weight:'600'},padding:{bottom:settings.subtitle?4:16}},subtitle:{display:Boolean(settings.subtitle),text:settings.subtitle,color:palette.text,font:{size:12,weight:'normal'},padding:{bottom:16}},tooltip,workspaceDataLabels:{enabled:settings.showDataLabels,color:palette.text,formatter}}};
  if(settings.type==='pie'||settings.type==='doughnut'){
    const sourceValues=numeric(1),total=sourceValues.reduce((sum,value)=>sum+Math.max(0,value),0),threshold=settings.pieMergeSmallThreshold??0,keptLabels:string[]=[],keptValues:number[]=[],smallIndexes:number[]=[];sourceValues.forEach((value,index)=>{if(threshold>0&&total>0&&value/total*100<threshold)smallIndexes.push(index);else{keptLabels.push(labels[index]);keptValues.push(value);}});if(smallIndexes.length){keptLabels.push('其他');keptValues.push(smallIndexes.reduce((sum,index)=>sum+sourceValues[index],0));}
    return {type:settings.type,data:{labels:keptLabels,datasets:[{label:table.headers[1],data:keptValues,backgroundColor:palette.colors,borderColor:palette.background,borderWidth:2}]},options:{...common,rotation:(settings.pieRotation??0)*Math.PI/180,cutout:settings.type==='doughnut'?`${settings.pieCutout??55}%`:0,plugins:{...common.plugins,workspaceInsights:{centerText:settings.type==='doughnut'?settings.pieCenterText:'',color:palette.text}}},plugins:[dataLabelPlugin,insightPlugin]};
  }
  if(settings.type==='scatter'){
    const points=table.rows.map(row=>({x:parseNumericValue(row[1]).value??0,y:parseNumericValue(row[2]).value??0}));
    const regression=linearRegression(points);const datasets:any[]=[{label:`${table.headers[1]} / ${table.headers[2]}`,data:points,backgroundColor:palette.colors[0]+'99',borderColor:palette.colors[0],pointRadius:6}];
    if(settings.showTrendline&&regression)datasets.push({type:'line',label:`趋势线 R²=${regression.r2.toFixed(3)}`,data:regression.line,borderColor:palette.colors[1]??'#d64545',borderWidth:2,pointRadius:0,fill:false});
    return {type:'scatter',data:{datasets},options:{...common,scales:axes(palette,settings,formatter)},plugins:[dataLabelPlugin]};
  }
  if(settings.type==='bubble') return {type:'bubble',data:{datasets:[{label:`${table.headers[1]} / ${table.headers[2]}`,data:table.rows.map(row=>({x:parseNumericValue(row[1]).value??0,y:parseNumericValue(row[2]).value??0,r:Math.max(4,Math.sqrt(Math.abs(parseNumericValue(row[3]).value??10))*2)})),backgroundColor:palette.colors[0]+'77',borderColor:palette.colors[0]}]},options:{...common,scales:axes(palette,settings,formatter)},plugins:[dataLabelPlugin]};
  if(settings.type==='waterfall'){
    let running=0;const values=numeric(1),data=values.map(value=>{const start=running;running+=value;return[start,running];});
    return {type:'bar',data:{labels,datasets:[{label:table.headers[1],data,backgroundColor:values.map(value=>value>=0?'#168a62':'#d64545'),borderRadius:5}]},options:{...common,plugins:{...common.plugins,tooltip:{callbacks:{label:(context:any)=>`${formatter(values[context.dataIndex])}，累计 ${formatter(data[context.dataIndex][1])}`}}},scales:axes(palette,settings,formatter)},plugins:[dataLabelPlugin]};
  }
  if(settings.type==='heatmap'){
    const matrix=table.rows.flatMap((row,rowIndex)=>row.slice(1).map((value,colIndex)=>({x:colIndex,y:rowIndex,v:parseNumericValue(value).value??0}))),values=matrix.map(item=>item.v),min=Math.min(...values),max=Math.max(...values);
    return {
      type:'scatter',
      data:{datasets:[{label:'热力值',data:matrix,parsing:{xAxisKey:'x',yAxisKey:'y'},pointStyle:'rectRounded',pointRadius:18,pointHoverRadius:20,backgroundColor:matrix.map(item=>heatColor(item.v,min,max,palette.colors[0]))}]},
      options:{
        ...common,
        plugins:{...common.plugins,legend:{display:false},tooltip:{callbacks:{label:(context:any)=>`${table.rows[context.raw.y][0]} / ${table.headers[context.raw.x+1]}: ${formatter(context.raw.v)}`}},workspaceInsights:{heatLegend:{min,max,color:palette.colors[0],formatter},color:palette.text}},
        scales:{x:{min:-.5,max:table.headers.length-1.5,ticks:{stepSize:1,color:palette.text,callback:(value:any)=>table.headers[Number(value)+1]??''},grid:{display:false}},y:{min:-.5,max:table.rows.length-.5,reverse:true,ticks:{stepSize:1,color:palette.text,callback:(value:any)=>table.rows[Number(value)]?.[0]??''},grid:{display:false}}}
      },
      plugins:[dataLabelPlugin,insightPlugin]
    };
  }
  if(settings.type==='funnel'){
    const values=numeric(1),first=values[0]??0;
    return {
      type:'bar',
      data:{labels,datasets:[{label:table.headers[1],data:values,backgroundColor:values.map((_,index)=>palette.colors[index%palette.colors.length]),borderRadius:6}]},
      options:{
        ...common,
        indexAxis:'y',
        plugins:{...common.plugins,legend:{display:false},tooltip:{callbacks:{label:(context:any)=>`${formatter(context.raw)}${first?`，占首环节 ${(context.raw/first*100).toFixed(1)}%`:''}`}},workspaceInsights:{funnelValues:values,color:palette.text}},
        scales:{x:{beginAtZero:true,grid:{display:settings.showGrid,color:palette.grid},ticks:{color:palette.text,callback:(value:any)=>formatter(Number(value))}},y:{grid:{display:false},ticks:{color:palette.text}}}
      },
      plugins:[dataLabelPlugin,insightPlugin]
    };
  }
  if(settings.type==='combo'){
    const datasets=table.headers.slice(1).map((header,index)=>({type:index===0?'bar':'line',label:header,data:numeric(index+1),valueFormatter:columnFormatter(index+1),backgroundColor:index===0?palette.colors[0]:palette.colors[index%palette.colors.length]+'22',borderColor:palette.colors[index%palette.colors.length],borderRadius:index===0?5:0,tension:index===0?0:.34,pointRadius:index===0?0:4,yAxisID:index===0?'y':'y1'}));
    const scales:any=axes(palette,settings,formatter);scales.y1={position:'right',beginAtZero:true,grid:{display:false},ticks:{color:palette.text,callback:(value:any)=>columnFormatter(2)(Number(value))}};
    return {type:'bar',data:{labels,datasets},options:{...common,scales},plugins:[dataLabelPlugin]};
  }
  const type=(settings.type==='area'?'line':settings.type) as ChartType;
  const forceArea=settings.type==='area',rawSeries=table.headers.slice(1).map((_,index)=>numeric(index+1)),positiveTotals=table.rows.map((_,rowIndex)=>rawSeries.reduce((sum,series)=>sum+Math.max(0,series[rowIndex]),0)),negativeTotals=table.rows.map((_,rowIndex)=>rawSeries.reduce((sum,series)=>sum+Math.abs(Math.min(0,series[rowIndex])),0)),hasNegative=rawSeries.some(series=>series.some(value=>value<0));
  const datasets=table.headers.slice(1).map((header,index)=>({label:header,data:settings.percentageStacked?rawSeries[index].map((value,rowIndex)=>{const total=value<0?negativeTotals[rowIndex]:positiveTotals[rowIndex];return total?value/total*100:0;}):(type==='line'?numericNullable(index+1):rawSeries[index]),backgroundColor:type==='line'||type==='radar'?(forceArea||settings.areaFill||type==='radar'?palette.colors[index%palette.colors.length]+'33':'transparent'):palette.colors[index%palette.colors.length],borderColor:palette.colors[index%palette.colors.length],borderWidth:2,borderRadius:type==='bar'?5:0,tension:settings.smooth?.36:0,fill:type==='radar'||forceArea||(type==='line'&&settings.areaFill),spanGaps:settings.connectGaps,stack:settings.stacked?'main':undefined,pointRadius:type==='line'?3:undefined}));
  const options=type==='radar'?{...common,scales:{r:{grid:{display:settings.showGrid,color:palette.grid},pointLabels:{color:palette.text},ticks:{display:false}}}}:{...common,scales:axes(palette,settings,formatter,hasNegative)};
  return {type,data:{labels,datasets},options,plugins:[dataLabelPlugin]};
}

function axes(palette:{text:string;grid:string},settings:ChartSettings,formatter:(value:number)=>string,percentageHasNegative=false){
  const category={stacked:settings.stacked,title:{display:Boolean(settings.xAxisTitle),text:settings.xAxisTitle,color:palette.text},grid:{display:false},ticks:{color:palette.text,maxRotation:40}};
  const value={stacked:settings.stacked,beginAtZero:settings.yMin===null||settings.yMin===undefined,min:settings.percentageStacked?(percentageHasNegative?-100:0):(settings.yMin??undefined),max:settings.percentageStacked?100:(settings.yMax??undefined),title:{display:Boolean(settings.yAxisTitle),text:settings.yAxisTitle,color:palette.text},grid:{display:settings.showGrid,color:palette.grid},ticks:{stepSize:settings.yStep??undefined,color:palette.text,callback:(value:any)=>settings.percentageStacked?`${Number(value).toFixed(0)}%`:formatter(Number(value))}};
  return settings.type==='bar'&&settings.horizontal?{x:value,y:category}:{x:category,y:value};
}

function linearRegression(points:{x:number;y:number}[]){
  if(points.length<2)return null;const n=points.length,sumX=points.reduce((sum,p)=>sum+p.x,0),sumY=points.reduce((sum,p)=>sum+p.y,0),sumXY=points.reduce((sum,p)=>sum+p.x*p.y,0),sumXX=points.reduce((sum,p)=>sum+p.x*p.x,0);const denominator=n*sumXX-sumX*sumX;if(denominator===0)return null;const slope=(n*sumXY-sumX*sumY)/denominator,intercept=(sumY-slope*sumX)/n,meanY=sumY/n;const ssTotal=points.reduce((sum,p)=>sum+(p.y-meanY)**2,0),ssResidual=points.reduce((sum,p)=>sum+(p.y-(slope*p.x+intercept))**2,0);const r2=ssTotal===0?1:1-ssResidual/ssTotal;const xs=points.map(p=>p.x),min=Math.min(...xs),max=Math.max(...xs);return{slope,intercept,r2,line:[{x:min,y:slope*min+intercept},{x:max,y:slope*max+intercept}]};
}

function heatColor(value:number,min:number,max:number,hex:string){const ratio=max===min?0.5:(value-min)/(max-min),color=hex.replace('#',''),r=parseInt(color.slice(0,2),16),g=parseInt(color.slice(2,4),16),b=parseInt(color.slice(4,6),16),mix=.12+ratio*.88;return`rgba(${Math.round(255+(r-255)*mix)},${Math.round(255+(g-255)*mix)},${Math.round(255+(b-255)*mix)},1)`;}
