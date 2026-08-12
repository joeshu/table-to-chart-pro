import { describe,expect,it } from 'vitest';
import { buildChartConfig } from '../src/charts/config';
import { projectTemplates } from '../src/templates/library';
import type { ChartSettings } from '../src/state/project';

const base:ChartSettings={type:'bar',theme:'business',title:'测试',subtitle:'',source:'',xAxisTitle:'',yAxisTitle:'',legendPosition:'top',showLegend:true,showDataLabels:false,showGrid:true,animate:false,background:'#fff',numberFormat:'number',decimals:0,horizontal:false,stacked:false,smooth:true,areaFill:false,customColors:[]};
const table={headers:['项目','数值A','数值B','规模'],rows:[['A','10','20','9'],['B','-4','18','16']]};

describe('professional charts',()=>{
  it('builds area chart as a filled line chart',()=>{const config:any=buildChartConfig(table,{...base,type:'area'});expect(config.type).toBe('line');expect(config.data.datasets[0].fill).toBe(true);});
  it('builds combo chart with a secondary axis',()=>{const config:any=buildChartConfig(table,{...base,type:'combo'});expect(config.data.datasets[0].type).toBe('bar');expect(config.data.datasets[1].type).toBe('line');expect(config.options.scales.y1.position).toBe('right');});
  it('builds bubble and waterfall datasets',()=>{const bubble:any=buildChartConfig(table,{...base,type:'bubble'});expect(bubble.type).toBe('bubble');expect(bubble.data.datasets[0].data[0].r).toBeGreaterThan(0);const waterfall:any=buildChartConfig(table,{...base,type:'waterfall'});expect(waterfall.data.datasets[0].data[0]).toEqual([0,10]);expect(waterfall.data.datasets[0].data[1]).toEqual([10,6]);});
  it('applies custom brand colors',()=>{const config:any=buildChartConfig(table,{...base,type:'bar',customColors:['#123456']});expect(config.data.datasets[0].backgroundColor).toBe('#123456');});
});

describe('template library',()=>{it('contains usable, unique templates',()=>{expect(projectTemplates.length).toBeGreaterThanOrEqual(5);expect(new Set(projectTemplates.map(item=>item.id)).size).toBe(projectTemplates.length);for(const item of projectTemplates){expect(item.data.headers.length).toBeGreaterThan(1);expect(item.data.rows.length).toBeGreaterThan(0);}});});
