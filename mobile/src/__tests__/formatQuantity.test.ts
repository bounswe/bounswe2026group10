import { formatQuantity } from '../utils/formatQuantity';

describe('formatQuantity', () => {
  it('returns the quantity as a string for whole numbers', () => {
    expect(formatQuantity(500)).toBe('500');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatQuantity(333.3333)).toBe('333.33');
  });

  it('strips trailing zeros', () => {
    expect(formatQuantity(250.0)).toBe('250');
    expect(formatQuantity(1.5)).toBe('1.5');
    expect(formatQuantity(2.1)).toBe('2.1');
  });

  it('handles pieces as fractional values', () => {
    expect(formatQuantity(2.5)).toBe('2.5');
    expect(formatQuantity(1.75)).toBe('1.75');
    expect(formatQuantity(0.5)).toBe('0.5');
  });

  it('handles zero quantity', () => {
    expect(formatQuantity(0)).toBe('0');
  });

  it('handles very small quantities', () => {
    expect(formatQuantity(0.25)).toBe('0.25');
    expect(formatQuantity(0.333)).toBe('0.33');
  });

  it('handles scaling calculations correctly', () => {
    // 500g base at 4 servings, scaled to 6: 500 * (6/4) = 750
    expect(formatQuantity(500 * (6 / 4))).toBe('750');
    // 2 pieces at 4 servings, scaled to 3: 2 * (3/4) = 1.5
    expect(formatQuantity(2 * (3 / 4))).toBe('1.5');
    // 1 tsp at 4 servings, scaled to 6: 1 * (6/4) = 1.5
    expect(formatQuantity(1 * (6 / 4))).toBe('1.5');
  });
});
