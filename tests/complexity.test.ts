import { describe, expect, it } from 'vitest';
import { evaluateComplexity } from '../src/data/complexity';
import { createDefaultChartSettings } from '../src/state/project';

function table(rows:number,series:number){return{headers:['项目',...Array.from({length:series},(_,index)=>`S${index+1}`)],rows:Array.from({length:rows},(_,row)=>[`R${row+1}`,...Array.from({length:series},(_,col)=>String(row+col+1))])};}

describe('complexity budget',()=>{
  it('warns on dense labels and too many points',()=>{
    const settings=createDefaultChartSettings();settings.showDataLabels=true;settings.animate=true;
    const budget=evaluateComplexity(table(1200,10),settings);
    expect(budget.level).toBe('warning');
    expect(budget.recommendations.join(' ')).toContain('数据标签');
    expect(budget.recommendations.join(' ')).toContain('关闭动画');
  });

  it('blocks excessive batch export budgets',()=>{
    const settings=createDefaultChartSettings();settings.seriesTrendlines={a:'linear',b:'polynomial',c:'movingAverage',d:'linear',e:'linear'};
    const budget=evaluateComplexity(table(100,15),settings,{format:'png',width:4000,height:3000,scale:2,batch:true});
    expect(budget.level).toBe('danger');
    expect(budget.metrics.exportCharts).toBe(15);
    expect(budget.recommendations.some(item=>item.includes('批量导出'))).toBe(true);
  });
});
