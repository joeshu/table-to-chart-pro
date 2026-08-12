import { describe, expect, it } from 'vitest';
import { detectDelimiter, parseDelimited, parseNumericValue, parseTable } from '../src/data/parser';
import { validateTable } from '../src/data/validator';
import { pearsonCorrelation, safeRatio } from '../src/data/statistics';

describe('data parser', () => {
  it('parses quoted CSV fields and CRLF', () => {
    expect(parseDelimited('地区,数值\r\n"上海,浦东","1,200"')).toEqual([['地区','数值'],['上海,浦东','1,200']]);
  });
  it('detects TSV and semicolon delimiters', () => {
    expect(detectDelimiter('a\tb\n1\t2')).toBe('\t');
    expect(detectDelimiter('a;b\n1;2')).toBe(';');
  });
  it('normalizes empty and duplicate headers', () => {
    expect(parseTable('项目,,项目\nA,1,2').headers).toEqual(['项目','列2','项目_2']);
  });
  it('handles currency percentages and invalid values', () => {
    expect(parseNumericValue('￥1,200.50').value).toBe(1200.5);
    expect(parseNumericValue('12.5%').value).toBe(.125);
    expect(parseNumericValue('(20)').value).toBe(-20);
    expect(parseNumericValue('错误').kind).toBe('invalid');
  });
});

describe('validation and statistics', () => {
  it('reports invalid numeric cells', () => {
    expect(validateTable({headers:['项目','值'],rows:[['A','x']]})).toHaveLength(1);
  });
  it('guards zero and constant-series math', () => {
    expect(safeRatio(2, 0)).toBeNull();
    expect(pearsonCorrelation([1,1],[2,3])).toBeNull();
    expect(pearsonCorrelation([1,2,3],[2,4,6])).toBeCloseTo(1);
  });
});
