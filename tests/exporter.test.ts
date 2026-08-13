import { describe,expect,it } from 'vitest';
import { createCsv,exportPresets } from '../src/export/exporter';
import { buildSvgChartOption } from '../src/export/svg';
import { createDefaultChartSettings } from '../src/state/project';

describe('export service',()=>{
  it('exports UTF-8 BOM CSV with quotes and commas',()=>{
    const csv=createCsv({headers:['地区','说明'],rows:[['上海,浦东','他说"好"'],['北京','换\n行']]});
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"上海,浦东"');
    expect(csv).toContain('"他说""好"""');
    expect(csv).toContain('"换\n行"');
  });
  it('provides presentation print and social presets',()=>{
    expect(exportPresets.some(item=>item.id==='ppt169')).toBe(true);
    expect(exportPresets.some(item=>item.id==='a4portrait')).toBe(true);
    expect(exportPresets.some(item=>item.id==='redbook')).toBe(true);
  });
  it('builds native SVG chart options for vector export',()=>{
    const settings=createDefaultChartSettings(),table={headers:['项目','收入','利润'],columnIds:['category','revenue','profit'],rows:[['A','10','3'],['B','12','4']]};
    settings.seriesNames={profit:'利润率'};settings.seriesColors={profit:'#ff0000'};settings.seriesOrder=['profit','revenue'];settings.showDataLabels=true;
    const option:any=buildSvgChartOption(table,settings,{format:'svg',width:1200,height:900,scale:1,background:'theme',fileName:'chart'});
    expect(option.backgroundColor).toBe('#ffffff');
    expect(option.series[0].name).toBe('利润率');
    expect(option.series[0].itemStyle.color).toBe('#ff0000');
    expect(option.series[0].label.show).toBe(true);
  });
});
