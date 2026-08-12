import type { ChartSettings } from '../state/project';
import type { DataTable } from '../types';

export interface ProjectTemplate { id:string; name:string; description:string; data:DataTable; chart:Partial<ChartSettings> }

export const projectTemplates:ProjectTemplate[]=[
  {id:'sales',name:'销售趋势',description:'月度销售额与利润',data:{headers:['月份','销售额','利润'],rows:[['1月','120','30'],['2月','150','42'],['3月','180','50'],['4月','210','66'],['5月','195','61'],['6月','240','78']]},chart:{type:'combo',title:'上半年销售与利润趋势',subtitle:'单位：万元',xAxisTitle:'月份',yAxisTitle:'金额（万元）'}},
  {id:'budget',name:'预算执行',description:'预算、实际与差异',data:{headers:['部门','预算','实际'],rows:[['市场','120','138'],['研发','220','205'],['销售','180','196'],['行政','80','72']]},chart:{type:'bar',title:'部门预算执行情况',stacked:false,showDataLabels:true}},
  {id:'funnel',name:'转化漏斗',description:'访问到成交的转化链路',data:{headers:['阶段','人数'],rows:[['访问','10000'],['注册','4200'],['试用','1800'],['付费','620']]},chart:{type:'funnel',title:'用户转化漏斗',showLegend:false,showDataLabels:true}},
  {id:'survey',name:'满意度调研',description:'各评价选项占比',data:{headers:['评价','人数'],rows:[['非常满意','320'],['满意','280'],['一般','150'],['不满意','60'],['非常不满意','20']]},chart:{type:'doughnut',title:'客户满意度分布',legendPosition:'bottom'}},
  {id:'waterfall',name:'利润拆解',description:'收入与成本贡献',data:{headers:['项目','金额'],rows:[['营业收入','850'],['材料成本','-280'],['人工成本','-160'],['营销费用','-90'],['其他收益','45']]},chart:{type:'waterfall',title:'利润贡献拆解',showDataLabels:true}},
];
