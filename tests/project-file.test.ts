import { describe, expect, it } from 'vitest';
import { parseProject } from '../src/platform/native';

const valid = {
  schemaVersion: 1 as const,
  metadata: { name: '测试项目', updatedAt: '2026-08-12T00:00:00.000Z' },
  data: { headers: ['项目', '数值'], rows: [['A', '1']] },
  chart: {
    type:'bar',theme:'business',title:'标题',subtitle:'',source:'',xAxisTitle:'',yAxisTitle:'',legendPosition:'top',showLegend:true,showDataLabels:false,showGrid:true,animate:true,background:'#fff',numberFormat:'number',decimals:0,horizontal:false,stacked:false,smooth:true,areaFill:false,
  },
};

describe('project file contract', () => {
  it('loads schema version 1 projects', () => {
    expect(parseProject(JSON.stringify(valid)).metadata.name).toBe('测试项目');
  });
  it('rejects unsupported or damaged projects', () => {
    expect(() => parseProject('{"schemaVersion":2}')).toThrow(/不受支持|损坏/);
  });
});
