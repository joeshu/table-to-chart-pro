import { describe, expect, it } from 'vitest';
import { formatChartValue } from '../src/charts/config';

describe('chart number formatting', () => {
  it('formats standard numbers and decimals', () => {
    expect(formatChartValue(1234.5, 'number', 1)).toBe('1,234.5');
  });
  it('formats percentages and currency', () => {
    expect(formatChartValue(0.125, 'percent', 1)).toBe('12.5%');
    expect(formatChartValue(1200, 'currency', 0)).toContain('1,200');
  });
  it('formats compact values and rejects non-finite values', () => {
    expect(formatChartValue(12000, 'compact', 1)).toMatch(/1[.．]?2万|12K/i);
    expect(formatChartValue(Number.NaN, 'number', 0)).toBe('—');
  });
});
