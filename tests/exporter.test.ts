import { describe,expect,it } from 'vitest';
import { createCsv,exportPresets } from '../src/export/exporter';

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
});
