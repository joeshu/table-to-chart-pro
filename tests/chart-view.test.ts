import { describe, expect, it } from 'vitest';
import { buildChartTable } from '../src/data/chartView';
import { createDefaultChartSettings } from '../src/state/project';

describe('chart data view',()=>{
  it('reorders, hides and slices data without mutating source rows',()=>{
    const table={headers:['地区','收入','利润','人数'],columnIds:['category','revenue','profit','people'],rows:[['华东','10','3','8'],['华南','20','4','9'],['华北','30','5','10']]};
    const settings=createDefaultChartSettings();settings.categoryColumn='people';settings.seriesOrder=['profit','revenue'];settings.hiddenColumns=['revenue'];settings.dataStartRow=2;settings.dataEndRow=3;
    const view=buildChartTable(table,settings);
    expect(view.headers).toEqual(['人数','利润']);
    expect(view.columnIds).toEqual(['people','profit']);
    expect(view.rows).toEqual([['9','4'],['10','5']]);
    expect(table.headers).toEqual(['地区','收入','利润','人数']);
    expect(table.rows).toHaveLength(3);
  });

  it('keeps legacy numeric references usable',()=>{
    const table={headers:['项目','销售额','利润'],columnIds:['category','sales','profit'],rows:[['A','10','3']]};
    const settings=createDefaultChartSettings();settings.categoryColumn=0;settings.seriesOrder=[2,1];
    expect(buildChartTable(table,settings).columnIds).toEqual(['category','profit','sales']);
  });
});
