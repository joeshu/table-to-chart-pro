import { jsPDF } from 'jspdf';
import type { ChartSettings } from '../state/project';
import type { DataTable } from '../types';
import { buildChartConfig, palettes } from '../charts/config';

declare const Chart: new (context:CanvasRenderingContext2D,config:any)=>{destroy():void;toBase64Image(type?:string,quality?:number):string};

export type ExportFormat='png'|'pdf'|'csv';
export interface ExportOptions { format:ExportFormat;width:number;height:number;scale:number;background:'theme'|'white'|'transparent';fileName:string;batch?:boolean; }
export const exportPresets=[
  {id:'ppt169',label:'PPT 16:9',width:1600,height:900},
  {id:'ppt43',label:'PPT 4:3',width:1200,height:900},
  {id:'a4landscape',label:'A4 横向',width:1754,height:1240},
  {id:'a4portrait',label:'A4 纵向',width:1240,height:1754},
  {id:'wechat',label:'公众号头图',width:900,height:383},
  {id:'redbook',label:'小红书 3:4',width:1080,height:1440},
];

export async function renderChartImage(table:DataTable,settings:ChartSettings,options:ExportOptions):Promise<string>{
  const canvas=document.createElement('canvas');canvas.width=options.width;canvas.height=options.height;canvas.style.width=`${options.width}px`;canvas.style.height=`${options.height}px`;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('无法创建导出画布');
  const palette=palettes[settings.theme],themeBackground=settings.background||palette.background,background=options.background==='transparent'?null:(options.background==='white'?'#ffffff':themeBackground);
  const config:any=buildChartConfig(table,{...settings,animate:false});config.options.responsive=false;config.options.maintainAspectRatio=false;config.options.animation=false;config.options.devicePixelRatio=options.scale;config.options.plugins.title.padding={top:28,bottom:settings.subtitle?4:16};
  config.plugins=[...(config.plugins??[]),{id:'exportSurface',beforeDraw(chart:any){if(background){const c=chart.ctx;c.save();c.globalCompositeOperation='destination-over';c.fillStyle=background;c.fillRect(0,0,chart.width,chart.height);c.restore();}},afterDraw(chart:any){if(settings.source){const c=chart.ctx;c.save();c.font='12px sans-serif';c.fillStyle=palette.text;c.globalAlpha=.62;c.textAlign='left';c.fillText(`数据来源：${settings.source}`,24,chart.height-16);c.restore();}}}];
  const chart=new Chart(ctx,config);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const data=canvas.toDataURL('image/png',1);chart.destroy();return data;
}

export function createPdf(dataUrl:string,width:number,height:number):string{
  const landscape=width>=height,pdf=new jsPDF({orientation:landscape?'landscape':'portrait',unit:'px',format:[width,height],hotfixes:['px_scaling']});
  pdf.addImage(dataUrl,'PNG',0,0,width,height,undefined,'FAST');return pdf.output('datauristring');
}

export function createCsv(table:DataTable):string{
  const escape=(value:string)=>/[",\r\n]/.test(value)?`"${value.replace(/"/g,'""')}"`:value;
  const rows=[table.headers,...table.rows].map(row=>row.map(value=>escape(String(value))).join(','));return '\uFEFF'+rows.join('\r\n');
}
