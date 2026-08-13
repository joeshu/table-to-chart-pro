import { describe, expect, it } from 'vitest';
import { migrateProject, parseProject } from '../src/platform/native';

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
    const loaded=parseProject(JSON.stringify(valid));
    expect(loaded.metadata.name).toBe('测试项目');
    expect(loaded.chart.pieCutout).toBe(55);
    expect(loaded.chart.pieCenterText).toBe('');
  });
  it('rejects unsupported or damaged projects', () => {
    expect(() => parseProject('{"schemaVersion":2}')).toThrow(/不受支持|不支持|损坏/);
    expect(() => parseProject('{"schemaVersion":1,"data":{"headers":[]},"chart":{}}')).toThrow(/损坏/);
  });
  it('migrates legacy projects without a schema version', () => {
    const legacy = { metadata: { name: '旧项目' }, data: valid.data, chart: { ...valid.chart, customColors: undefined } };
    const migrated = migrateProject(legacy);
    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.chart.customColors).toEqual([]);
  });
});
