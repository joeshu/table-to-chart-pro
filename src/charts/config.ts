import type { ChartType, DataTable } from '../types';
import type { ChartSettings, ThemeName } from '../state/project';
import { parseNumericValue } from '../data/parser';

export const palettes: Record<ThemeName, { colors: string[]; background: string; text: string; grid: string }> = {
  business: { colors: ['#5b5ce2','#18a7c9','#e5a93d','#d05252','#687386'], background:'#ffffff', text:'#172033', grid:'#e8eaf0' },
  ocean: { colors: ['#087f8c','#5bc0be','#f4d35e','#ee964b','#5c677d'], background:'#f7fcfd', text:'#18323a', grid:'#dcebed' },
  forest: { colors: ['#168a62','#62a87c','#f2c14e','#d95d39','#426a5a'], background:'#f7fbf8', text:'#17362d', grid:'#dce9e2' },
  sunset: { colors: ['#d1495b','#edae49','#00798c','#30638e','#6f4e7c'], background:'#fffaf7', text:'#39242a', grid:'#f0e1da' },
  dark: { colors: ['#7c83ff','#2ec4b6','#ffbf69','#ff6b6b','#a8b2c1'], background:'#171a22', text:'#f4f6fb', grid:'#303543' },
  rose: { colors: ['#b84a7c','#da7f8f','#e5b181','#7f8f6b','#687386'], background:'#fff9fb', text:'#38232d', grid:'#f0dfe6' },
};

export function buildChartConfig(table: DataTable, settings: ChartSettings) {
  const palette = palettes[settings.theme], labels = table.rows.map(row => row[0]);
  const numeric = (col: number) => table.rows.map(row => parseNumericValue(row[col]).value ?? 0);
  const common = { responsive:true, maintainAspectRatio:false, animation:settings.animate ? undefined : false, plugins:{ legend:{ display:settings.showLegend, position:'top' as const, labels:{ color:palette.text, usePointStyle:true, padding:18 } }, title:{ display:Boolean(settings.title), text:settings.title, color:palette.text, font:{ size:17, weight:'600' }, padding:{ bottom:18 } } } };
  if (settings.type === 'pie' || settings.type === 'doughnut') return { type:settings.type, data:{ labels, datasets:[{ data:numeric(1), backgroundColor:palette.colors, borderColor:palette.background, borderWidth:2 }] }, options:common };
  if (settings.type === 'scatter') return { type:'scatter', data:{ datasets:[{ label:`${table.headers[1]} / ${table.headers[2]}`, data:table.rows.map(row=>({x:parseNumericValue(row[1]).value??0,y:parseNumericValue(row[2]).value??0})), backgroundColor:palette.colors[0]+'99', borderColor:palette.colors[0], pointRadius:6 }] }, options:{...common,scales:{x:{grid:{color:palette.grid},ticks:{color:palette.text}},y:{grid:{color:palette.grid},ticks:{color:palette.text}}}} };
  const type = (settings.type === 'heatmap' || settings.type === 'funnel' ? 'bar' : settings.type) as ChartType;
  return { type, data:{ labels, datasets:table.headers.slice(1).map((header,index)=>({label:header,data:numeric(index+1),backgroundColor:type==='line'||type==='radar'?palette.colors[index%palette.colors.length]+'33':palette.colors[index%palette.colors.length],borderColor:palette.colors[index%palette.colors.length],borderWidth:2,tension:.28,fill:type==='radar'})) }, options:{...common,scales:type==='radar'?{r:{grid:{color:palette.grid},pointLabels:{color:palette.text},ticks:{display:false}}}:{x:{grid:{display:false},ticks:{color:palette.text}},y:{beginAtZero:true,grid:{color:palette.grid},ticks:{color:palette.text}}}} };
}
