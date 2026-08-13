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
    const { ctx } = chart; ctx.save(); const fontSize=options.fontSize??10;ctx.font=`600 ${fontSize}px Inter, sans-serif`; ctx.textAlign='center';ctx.textBaseline='middle';
    chart.data.datasets.forEach((dataset: any,index: number)=>{
      const meta=chart.getDatasetMeta(index); if(meta.hidden||dataset.skipDataLabels)return;
      meta.data.forEach((element:any,dataIndex:number)=>{
        const raw=dataset.data[dataIndex]; const value=Array.isArray(raw)?raw[1]-raw[0]:typeof raw==='object'?(raw.v??raw.y??raw.x):raw;
        if(typeof value!=='number')return; const point=element.tooltipPosition(),position=options.position??'auto',y=(position==='center'?point.y:(value>=0?(element.y??point.y)-5:(element.y??point.y)+14))+(options.offset??0); const formatter=dataset.valueFormatter??options.formatter,text=formatter(value),width=ctx.measureText(text).width+8,height=fontSize+6;ctx.textBaseline='middle';ctx.save();ctx.translate(point.x,y);ctx.rotate((options.rotation??0)*Math.PI/180);if(options.background){ctx.fillStyle=options.background;ctx.fillRect(-width/2,-height/2,width,height);}if(options.borderColor){ctx.strokeStyle=options.borderColor;ctx.strokeRect(-width/2,-height/2,width,height);}ctx.fillStyle=options.color;ctx.fillText(text,0,0);ctx.restore();
      });
    }); ctx.restore();
  },
};

export const plotFramePlugin={id:'workspacePlotFrame',afterDraw(chart:any,_args:unknown,options:any){if(!options?.width)return;const {ctx,chartArea}=chart;ctx.save();ctx.strokeStyle=options.color;ctx.lineWidth=options.width;ctx.strokeRect(chartArea.left,chartArea.top,chartArea.right-chartArea.left,chartArea.bottom-chartArea.top);ctx.restore();}};

export const insightPlugin={id:'workspaceInsights',afterDraw(chart:any,_args:unknown,options:any){if(!options)return;const {ctx,chartArea}=chart;ctx.save();if(options.centerText){ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=options.color;ctx.font='700 18px Inter, sans-serif';ctx.fillText(options.centerText,(chartArea.left+chartArea.right)/2,(chartArea.top+chartArea.bottom)/2);}if(options.heatLegend){const {min,max,color,formatter}=options.heatLegend,w=150,h=8,x=chartArea.right-w,y=chartArea.top-16,gradient=ctx.createLinearGradient(x,0,x+w,0);gradient.addColorStop(0,heatColor(min,min,max,color));gradient.addColorStop(1,heatColor(max,min,max,color));ctx.fillStyle=gradient;ctx.fillRect(x,y,w,h);ctx.fillStyle=options.color;ctx.font='10px Inter, sans-serif';ctx.textAlign='right';ctx.fillText(`${formatter(min)} → ${formatter(max)}`,x+w,y-2);}if(options.funnelValues){const values:number[]=options.funnelValues,meta=chart.getDatasetMeta(0);ctx.fillStyle=options.color;ctx.font='600 10px Inter, sans-serif';ctx.textAlign='left';meta.data.forEach((element:any,index:number)=>{if(index===0)return;const previous=values[index-1],change=previous?(values[index]/previous-1)*100:0,point=element.tooltipPosition(),label=change>0?`增长 ${change.toFixed(1)}%`:`流失 ${Math.abs(change).toFixed(1)}%`;ctx.fillText(label,point.x+8,point.y+4);});}ctx.restore();}};

export function buildChartConfig(table: DataTable, settings: ChartSettings) {
  const basePalette=palettes[settings.theme], customColors=settings.customColors??[], palette={...basePalette,background:settings.background||basePalette.background,colors:customColors.length?customColors:basePalette.colors}, labels=table.rows.map(row=>row[0]);
  const numeric=(col:number)=>table.rows.map(row=>parseNumericValue(row[col]).value??0);
  const numericNullable=(col:number)=>table.rows.map(row=>parseNumericValue(row[col]).value);
  const isPercentColumn=(col:number)=>table.rows.some(row=>String(row[col]??'').trim().endsWith('%'));
  const columnFormatter=(col:number)=>(value:number)=>isPercentColumn(col)?`${settings.valuePrefix??''}${(value*100).toFixed(Math.max(1,settings.decimals))}%${settings.valueSuffix??''}`:formatter(value);
  const sourceColumns=table.headers.slice(1).map((_,index)=>index+1),seriesId=(column:number)=>table.columnIds?.[column]??String(column),resolveRef=(ref:number|string)=>typeof ref==='number'?ref:table.columnIds?.indexOf(ref)??-1,resolveRefs=(refs:(number|string)[]|null|undefined)=>(refs??[]).map(resolveRef).filter(column=>sourceColumns.includes(column)),readMap=<T>(map:Record<string,T>|undefined,column:number)=>map?.[seriesId(column)]??map?.[String(column)],orderedColumns=[...resolveRefs(settings.seriesOrder),...sourceColumns.filter(column=>!resolveRefs(settings.seriesOrder).includes(column))];
  const seriesName=(column:number)=>readMap(settings.seriesNames,column)||table.headers[column],seriesOpacity=(column:number)=>readMap(settings.seriesOpacity,column)??1,seriesColor=(column:number)=>readMap(settings.seriesColors,column)??palette.colors[(column-1)%palette.colors.length];
  const formatter=(value:number)=>`${settings.valuePrefix??''}${formatChartValue(value,settings.numberFormat,settings.decimals)}${settings.valueSuffix??''}`;
  const tooltip={callbacks:{label:(context:any)=>`${context.dataset.label?`${context.dataset.label}: `:''}${(context.dataset.valueFormatter??formatter)(Number(context.raw?.y??context.raw))}`}};
  const common:any={responsive:true,maintainAspectRatio:false,indexAxis:settings.type==='bar'&&settings.horizontal?'y':'x',interaction:{mode:['scatter','bubble'].includes(settings.type)?'nearest':'index',intersect:false},layout:{padding:settings.plotMarginTop===undefined?settings.plotPadding:{top:settings.plotMarginTop??settings.plotPadding,right:settings.plotMarginRight??settings.plotPadding,bottom:settings.plotMarginBottom??settings.plotPadding,left:settings.plotMarginLeft??settings.plotPadding}},animation:settings.animate?{duration:450}:false,plugins:{legend:{display:settings.showLegend,position:settings.legendPosition,labels:{color:palette.text,usePointStyle:true,pointStyle:settings.legendPointStyle,font:{size:settings.legendFontSize},padding:18},reverse:settings.legendReverse},title:{display:Boolean(settings.title),text:settings.title,color:settings.titleColor||palette.text,align:settings.titleAlign,font:{size:settings.titleFontSize,weight:'600'},padding:{bottom:settings.subtitle?4:16}},subtitle:{display:Boolean(settings.subtitle),text:settings.subtitle,color:settings.subtitleColor||palette.text,font:{size:settings.subtitleFontSize,weight:'normal'},padding:{bottom:16}},tooltip,workspaceDataLabels:{enabled:settings.showDataLabels,color:settings.dataLabelColor||palette.text,fontSize:settings.dataLabelFontSize,background:settings.dataLabelBackground,borderColor:settings.dataLabelBorderColor,position:settings.dataLabelPosition,rotation:settings.dataLabelRotation,offset:settings.dataLabelOffset,formatter},workspacePlotFrame:{width:settings.plotBorderWidth,color:settings.plotBorderColor||palette.grid}}};
  if(settings.type==='pie'||settings.type==='doughnut'){
    const sourceValues=numeric(1),total=sourceValues.reduce((sum,value)=>sum+Math.max(0,value),0),threshold=settings.pieMergeSmallThreshold??0,keptLabels:string[]=[],keptValues:number[]=[],smallIndexes:number[]=[];sourceValues.forEach((value,index)=>{if(threshold>0&&total>0&&value/total*100<threshold)smallIndexes.push(index);else{keptLabels.push(labels[index]);keptValues.push(value);}});if(smallIndexes.length){keptLabels.push('其他');keptValues.push(smallIndexes.reduce((sum,index)=>sum+sourceValues[index],0));}
    return {type:settings.type,data:{labels:keptLabels,datasets:[{label:table.headers[1],data:keptValues,backgroundColor:palette.colors,borderColor:palette.background,borderWidth:2}]},options:{...common,rotation:(settings.pieRotation??0)*Math.PI/180,cutout:settings.type==='doughnut'?`${settings.pieCutout??55}%`:0,plugins:{...common.plugins,workspaceInsights:{centerText:settings.type==='doughnut'?settings.pieCenterText:'',color:palette.text}}},plugins:[dataLabelPlugin,insightPlugin,plotFramePlugin]};
  }
  if(settings.type==='scatter'){
    const points=table.rows.map(row=>({x:parseNumericValue(row[1]).value??0,y:parseNumericValue(row[2]).value??0}));
    const regression=linearRegression(points);const datasets:any[]=[{label:`${table.headers[1]} / ${table.headers[2]}`,data:points,backgroundColor:palette.colors[0]+'99',borderColor:palette.colors[0],pointRadius:6}];
    if(settings.showTrendline&&regression)datasets.push({type:'line',label:`趋势线 R²=${regression.r2.toFixed(3)}`,data:regression.line,borderColor:palette.colors[1]??'#d64545',borderWidth:2,pointRadius:0,fill:false});
    return {type:'scatter',data:{datasets},options:{...common,scales:axes(palette,settings,formatter)},plugins:[dataLabelPlugin,plotFramePlugin]};
  }
  if(settings.type==='bubble') return {type:'bubble',data:{datasets:[{label:`${table.headers[1]} / ${table.headers[2]}`,data:table.rows.map(row=>({x:parseNumericValue(row[1]).value??0,y:parseNumericValue(row[2]).value??0,r:Math.max(4,Math.sqrt(Math.abs(parseNumericValue(row[3]).value??10))*2)})),backgroundColor:palette.colors[0]+'77',borderColor:palette.colors[0]}]},options:{...common,scales:axes(palette,settings,formatter)},plugins:[dataLabelPlugin,plotFramePlugin]};
  if(settings.type==='waterfall'){
    let running=0;const values=numeric(1),data=values.map(value=>{const start=running;running+=value;return[start,running];});
    return {type:'bar',data:{labels,datasets:[{label:table.headers[1],data,backgroundColor:values.map(value=>value>=0?'#168a62':'#d64545'),borderRadius:5}]},options:{...common,plugins:{...common.plugins,tooltip:{callbacks:{label:(context:any)=>`${formatter(values[context.dataIndex])}，累计 ${formatter(data[context.dataIndex][1])}`}}},scales:axes(palette,settings,formatter)},plugins:[dataLabelPlugin,plotFramePlugin]};
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
      plugins:[dataLabelPlugin,insightPlugin,plotFramePlugin]
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
        scales:{x:{beginAtZero:true,border:{display:settings.showAxisBorder,color:palette.grid},grid:{display:settings.showGrid,color:palette.grid,lineWidth:settings.gridLineWidth},ticks:{color:palette.text,callback:(value:any)=>formatter(Number(value))}},y:{grid:{display:false},ticks:{color:palette.text}}}
      },
      plugins:[dataLabelPlugin,insightPlugin,plotFramePlugin]
    };
  }
  if(settings.type==='combo'){
    const barColumns=new Set(resolveRefs(settings.comboBarColumns));
    const allIndexes=orderedColumns,hidden=new Set(resolveRefs(settings.hiddenColumns)),visibleIndexes=allIndexes.filter(index=>!hidden.has(index));
    const rightSet=settings.comboRightAxisColumns===null?new Set(visibleIndexes.filter(index=>!barColumns.has(index))):new Set(resolveRefs(settings.comboRightAxisColumns).filter(index=>visibleIndexes.includes(index)));
    const rightIndexes=visibleIndexes.filter(index=>rightSet.has(index)),leftIndexes=visibleIndexes.filter(index=>!rightSet.has(index));
    const rightPercent=rightIndexes.length>0&&rightIndexes.every(index=>isPercentColumn(index)), leftPercent=leftIndexes.length>0&&leftIndexes.every(index=>isPercentColumn(index)), rightFormat=settings.rightAxisFormat&&settings.rightAxisFormat!=='auto'?settings.rightAxisFormat:(rightPercent?'percent':settings.numberFormat);
    const rightDecimals=settings.y2AxisDecimals??settings.decimals,rightFormatter=(value:number)=>rightFormat==='percent'?`${(value*100).toFixed(Math.max(1,rightDecimals))}%`:formatChartValue(value,rightFormat,rightDecimals),percentScale=rightFormat==='percent'?0.01:1;
    const datasets:any[]=orderedColumns.map(column=>{const header=seriesName(column),isBar=barColumns.has(column),color=seriesColor(column),opacity=seriesOpacity(column),lineWidth=readMap(settings.seriesLineWidths,column)??settings.lineWidth,pointSize=readMap(settings.seriesPointRadii,column)??settings.pointRadius,dashed=readMap(settings.seriesDashed,column)??settings.lineDash;return {type:isBar?'bar':'line',label:header,data:numeric(column),hidden:hidden.has(column),valueFormatter:columnFormatter(column),backgroundColor:isBar?alphaColor(color,opacity):alphaColor(color,.14*opacity),borderColor:alphaColor(color,opacity),borderWidth:isBar?settings.barBorderWidth:lineWidth,borderRadius:isBar?settings.barRadius:0,categoryPercentage:settings.barCategoryPercentage,barPercentage:settings.barPercentage,borderDash:!isBar&&dashed?[8,5]:[],stepped:!isBar&&settings.lineStepped,tension:isBar?0:(settings.smooth?.34:0),pointRadius:isBar?0:pointSize,pointHoverRadius:isBar?0:pointSize+2,pointStyle:readMap(settings.seriesPointStyles,column)??'circle',spanGaps:!isBar&&settings.connectGaps,stack:isBar&&settings.stacked?'main':undefined,yAxisID:rightSet.has(column)?'y1':'y',fill:!isBar&&settings.areaFill};});
    const scales:any=axes(palette,settings,leftPercent?(value:number)=>`${(value*100).toFixed(Math.max(1,settings.yAxisDecimals??settings.decimals))}%`:(value:number)=>formatChartValue(value,settings.numberFormat,settings.yAxisDecimals??settings.decimals));scales.y.display=leftIndexes.length>0;if(leftPercent){scales.y.min=settings.yScaleType==='logarithmic'?(settings.yMin&&settings.yMin>0?settings.yMin*.01:undefined):(settings.yMin===null?0:settings.yMin*.01);scales.y.max=settings.yMax===null?1:settings.yMax*.01;scales.y.ticks.stepSize=settings.yScaleType==='linear'&&settings.yStep!==null?settings.yStep*.01:undefined;}if(!settings.yAxisTitle&&leftIndexes.length===1){const leftIndex=leftIndexes[0];scales.y.title={display:true,text:seriesName(leftIndex),color:settings.yAxisColor||palette.text,font:{size:settings.yAxisFontSize}};}scales.y1={type:settings.y2ScaleType,reverse:settings.y2Reverse,display:rightIndexes.length>0,position:'right',beginAtZero:settings.y2ScaleType==='linear'&&settings.y2BeginAtZero&&settings.y2Min===null, min:settings.y2ScaleType==='logarithmic'?(settings.y2Min&&settings.y2Min>0?settings.y2Min*percentScale:undefined):(settings.y2Min===null?(rightFormat==='percent'?0:undefined):settings.y2Min*percentScale),max:settings.y2Max===null?(rightFormat==='percent'?1:undefined):settings.y2Max*percentScale,title:{display:Boolean(settings.rightAxisTitle||rightIndexes.length===1),text:settings.rightAxisTitle||(rightIndexes.length===1?seriesName(rightIndexes[0]):''),color:settings.y2AxisColor||palette.text,font:{size:settings.y2AxisFontSize}},border:{display:settings.showAxisBorder,color:palette.grid},grid:{display:false},ticks:{stepSize:settings.y2ScaleType==='linear'&&settings.y2Step!==null?settings.y2Step*percentScale:undefined,color:settings.y2AxisColor||palette.text,font:{size:settings.y2AxisFontSize},callback:(value:any)=>rightFormatter(Number(value))}};
    for(const [index,column] of orderedColumns.entries())if(!barColumns.has(column)){const trend=createTrendDataset(column,seriesId(column),numeric(column),datasets[index],settings);if(trend)datasets.push(trend);}
    return {type:'bar',data:{labels,datasets},options:{...common,scales},plugins:[dataLabelPlugin,plotFramePlugin]};
  }
  const type=(settings.type==='area'?'line':settings.type) as ChartType;
  const forceArea=settings.type==='area',rawSeries=orderedColumns.map(column=>numeric(column)),positiveTotals=table.rows.map((_,rowIndex)=>rawSeries.reduce((sum,series)=>sum+Math.max(0,series[rowIndex]),0)),negativeTotals=table.rows.map((_,rowIndex)=>rawSeries.reduce((sum,series)=>sum+Math.abs(Math.min(0,series[rowIndex])),0)),hasNegative=rawSeries.some(series=>series.some(value=>value<0)),visibleColumns=table.headers.slice(1).map((_,index)=>index+1).filter(index=>!resolveRefs(settings.hiddenColumns).includes(index)),allPercent=!settings.percentageStacked&&visibleColumns.length>0&&visibleColumns.every(isPercentColumn);
  const datasets:any[]=orderedColumns.map((column,seriesIndex)=>{const color=seriesColor(column),opacity=seriesOpacity(column),lineWidth=readMap(settings.seriesLineWidths,column)??settings.lineWidth,pointSize=readMap(settings.seriesPointRadii,column)??settings.pointRadius,dashed=readMap(settings.seriesDashed,column)??settings.lineDash;return {label:seriesName(column),valueFormatter:columnFormatter(column),data:settings.percentageStacked?rawSeries[seriesIndex].map((value,rowIndex)=>{const total=value<0?negativeTotals[rowIndex]:positiveTotals[rowIndex];return total?value/total*100:0;}):(type==='line'?numericNullable(column):rawSeries[seriesIndex]),backgroundColor:type==='line'||type==='radar'?(forceArea||settings.areaFill||type==='radar'?alphaColor(color,.2*opacity):'transparent'):alphaColor(color,opacity),borderColor:alphaColor(color,opacity),hidden:resolveRefs(settings.hiddenColumns).includes(column),borderWidth:type==='bar'?settings.barBorderWidth:lineWidth,borderRadius:type==='bar'?settings.barRadius:0,categoryPercentage:settings.barCategoryPercentage,barPercentage:settings.barPercentage,borderDash:type==='line'&&dashed?[8,5]:[],stepped:type==='line'&&settings.lineStepped,tension:settings.smooth?.36:0,fill:type==='radar'||forceArea||(type==='line'&&settings.areaFill),spanGaps:settings.connectGaps,stack:settings.stacked?'main':undefined,pointRadius:type==='line'?pointSize:undefined,pointHoverRadius:type==='line'?pointSize+2:undefined,pointStyle:type==='line'?(readMap(settings.seriesPointStyles,column)??'circle'):undefined};});
  if(type==='line')for(const [index,column] of orderedColumns.entries()){const trend=createTrendDataset(column,seriesId(column),numeric(column),datasets[index],settings);if(trend)datasets.push(trend);}
  const axisDecimals=settings.yAxisDecimals??settings.decimals,axisFormatter=allPercent?(value:number)=>`${(value*100).toFixed(Math.max(1,axisDecimals))}%`:(value:number)=>formatChartValue(value,settings.numberFormat,axisDecimals);
  const options:any=type==='radar'?{...common,scales:{r:{grid:{display:settings.showGrid,color:palette.grid},pointLabels:{color:palette.text},ticks:{display:false}}}}:{...common,scales:axes(palette,settings,axisFormatter,hasNegative)};
  if(allPercent&&type!=='radar'){options.scales.y.min=settings.yScaleType==='logarithmic'?(settings.yMin&&settings.yMin>0?settings.yMin*.01:undefined):(settings.yMin===null?0:settings.yMin*.01);options.scales.y.max=settings.yMax===null?undefined:settings.yMax*.01;options.scales.y.ticks.stepSize=settings.yScaleType==='linear'&&settings.yStep!==null?settings.yStep*.01:undefined;}
  return {type,data:{labels,datasets},options,plugins:[dataLabelPlugin,plotFramePlugin]};
}

function axes(palette:{text:string;grid:string},settings:ChartSettings,formatter:(value:number)=>string,percentageHasNegative=false){
  const categoryColor=settings.xAxisColor||palette.text,axisColor=settings.yAxisColor||palette.text;const category={stacked:settings.stacked,title:{display:Boolean(settings.xAxisTitle),text:settings.xAxisTitle,color:categoryColor,font:{size:settings.xAxisFontSize}},border:{display:settings.showAxisBorder,color:palette.grid},grid:{display:false},ticks:{color:categoryColor,font:{size:settings.xAxisFontSize},minRotation:settings.xLabelRotation,maxRotation:settings.xLabelRotation,maxTicksLimit:settings.xMaxTicks,autoSkip:true}};
  const value={type:settings.yScaleType,reverse:settings.yReverse,stacked:settings.stacked,beginAtZero:settings.yScaleType==='linear'&&settings.yBeginAtZero&&(settings.yMin===null||settings.yMin===undefined),min:settings.yScaleType==='logarithmic'?(settings.yMin&&settings.yMin>0?settings.yMin:undefined):(settings.percentageStacked?(percentageHasNegative?-100:0):(settings.yMin??undefined)),max:settings.percentageStacked?100:(settings.yMax??undefined),title:{display:Boolean(settings.yAxisTitle),text:settings.yAxisTitle,color:axisColor,font:{size:settings.yAxisFontSize}},border:{display:settings.showAxisBorder,color:palette.grid},grid:{display:settings.showGrid,color:palette.grid,lineWidth:settings.gridLineWidth},ticks:{stepSize:settings.yScaleType==='linear'?(settings.yStep??undefined):undefined,color:axisColor,font:{size:settings.yAxisFontSize},callback:(value:any)=>settings.percentageStacked?`${Number(value).toFixed(0)}%`:formatter(Number(value))}};
  return settings.type==='bar'&&settings.horizontal?{x:value,y:category}:{x:category,y:value};
}

function linearRegression(points:{x:number;y:number}[]){
  if(points.length<2)return null;const n=points.length,sumX=points.reduce((sum,p)=>sum+p.x,0),sumY=points.reduce((sum,p)=>sum+p.y,0),sumXY=points.reduce((sum,p)=>sum+p.x*p.y,0),sumXX=points.reduce((sum,p)=>sum+p.x*p.x,0);const denominator=n*sumXX-sumX*sumX;if(denominator===0)return null;const slope=(n*sumXY-sumX*sumY)/denominator,intercept=(sumY-slope*sumX)/n,meanY=sumY/n;const ssTotal=points.reduce((sum,p)=>sum+(p.y-meanY)**2,0),ssResidual=points.reduce((sum,p)=>sum+(p.y-(slope*p.x+intercept))**2,0);const r2=ssTotal===0?1:1-ssResidual/ssTotal;const xs=points.map(p=>p.x),min=Math.min(...xs),max=Math.max(...xs);return{slope,intercept,r2,line:[{x:min,y:slope*min+intercept},{x:max,y:slope*max+intercept}]};
}

function heatColor(value:number,min:number,max:number,hex:string){const ratio=max===min?0.5:(value-min)/(max-min),color=hex.replace('#',''),r=parseInt(color.slice(0,2),16),g=parseInt(color.slice(2,4),16),b=parseInt(color.slice(4,6),16),mix=.12+ratio*.88;return`rgba(${Math.round(255+(r-255)*mix)},${Math.round(255+(g-255)*mix)},${Math.round(255+(b-255)*mix)},1)`;}

function alphaColor(hex:string,alpha:number){const value=hex.replace('#','');if(value.length!==6)return hex;const r=parseInt(value.slice(0,2),16),g=parseInt(value.slice(2,4),16),b=parseInt(value.slice(4,6),16);return`rgba(${r},${g},${b},${Math.max(0,Math.min(1,alpha))})`;}

function createTrendDataset(column:number,seriesRef:string,values:number[],base:any,settings:ChartSettings){
  const kind=settings.seriesTrendlines?.[seriesRef]??settings.seriesTrendlines?.[String(column)]??'none';if(kind==='none'||values.length<2)return null;
  let data:(number|null)[]=[],equation='',r2:number|null=null;
  if(kind==='movingAverage'){const period=Math.max(2,settings.seriesMovingAveragePeriods?.[seriesRef]??settings.seriesMovingAveragePeriods?.[String(column)]??3);data=values.map((_,index)=>index<period-1?null:values.slice(index-period+1,index+1).reduce((sum,value)=>sum+value,0)/period);equation=`移动平均(${period})`;}
  else if(kind==='linear'){const result=linearSeries(values);data=result.data;equation=`y=${result.a.toFixed(3)}x${signed(result.b)}`;r2=result.r2;}
  else{const result=quadraticSeries(values);if(!result)return null;data=result.data;equation=`y=${result.a.toFixed(3)}x²${signed(result.b)}x${signed(result.c)}`;r2=result.r2;}
  const logarithmic=base.yAxisID==='y1'?settings.y2ScaleType==='logarithmic':settings.yScaleType==='logarithmic';if(logarithmic)data=data.map(value=>value!==null&&value>0?value:null);
  const details=[settings.showTrendEquation?equation:'',settings.showTrendR2&&r2!==null?`R²=${r2.toFixed(3)}`:''].filter(Boolean).join(' · '),label=details?`${base.label} ${details}`:`${base.label} 趋势线`;
  return{type:'line',label,data,yAxisID:base.yAxisID,borderColor:base.borderColor,borderWidth:Math.max(1,base.borderWidth??2),borderDash:[7,5],pointRadius:0,pointHoverRadius:0,fill:false,tension:0,skipDataLabels:true};
}
function signed(value:number){return value>=0?`+${value.toFixed(3)}`:value.toFixed(3);}

function fitScore(values:number[],predicted:number[]){const mean=values.reduce((sum,value)=>sum+value,0)/values.length,total=values.reduce((sum,value)=>sum+(value-mean)**2,0),residual=values.reduce((sum,value,index)=>sum+(value-predicted[index])**2,0);return total===0?1:1-residual/total;}
function linearSeries(values:number[]){const points=values.map((y,index)=>({x:index+1,y})),fit=linearRegression(points)!,data=points.map(point=>fit.slope*point.x+fit.intercept);return{a:fit.slope,b:fit.intercept,data,r2:fitScore(values,data)};}
function quadraticSeries(values:number[]){if(values.length<3)return null;let sx=0,sx2=0,sx3=0,sx4=0,sy=0,sxy=0,sx2y=0;values.forEach((y,index)=>{const x=index+1,x2=x*x;sx+=x;sx2+=x2;sx3+=x2*x;sx4+=x2*x2;sy+=y;sxy+=x*y;sx2y+=x2*y;});const coefficients=solve3([[sx4,sx3,sx2],[sx3,sx2,sx],[sx2,sx,values.length]],[sx2y,sxy,sy]);if(!coefficients)return null;const[a,b,c]=coefficients,data=values.map((_,index)=>{const x=index+1;return a*x*x+b*x+c;});return{a,b,c,data,r2:fitScore(values,data)};}

function solve3(matrix:number[][],vector:number[]){const rows=matrix.map((row,index)=>[...row,vector[index]]);for(let col=0;col<3;col++){let pivot=col;for(let row=col+1;row<3;row++)if(Math.abs(rows[row][col])>Math.abs(rows[pivot][col]))pivot=row;if(Math.abs(rows[pivot][col])<1e-12)return null;[rows[col],rows[pivot]]=[rows[pivot],rows[col]];const divisor=rows[col][col];for(let item=col;item<4;item++)rows[col][item]/=divisor;for(let row=0;row<3;row++){if(row===col)continue;const factor=rows[row][col];for(let item=col;item<4;item++)rows[row][item]-=factor*rows[col][item];}}return[rows[0][3],rows[1][3],rows[2][3]];}
