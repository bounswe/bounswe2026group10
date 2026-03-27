import { formatQuantity } from '../utils/formatQuantity';

describe('formatQuantity', () => {
  it('returns the quantity as a string for simple numbers', () => {
    expect(formatQuantity(500, 'g')).toBe('500');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatQuantity(333.3333, 'g')).toBe('333.33');
  });

  it('strips trailing zeros', () => {
    expect(formatQuantity(250.0, 'ml')).toBe('250');
    expect(formatQuantity(1.5, 'tbsp')).toBe('1.5');
    expect(formatQuantity(2.1, 'tsp')).toBe('2.1');
  });

  it('rounds "piece" units to nearest integer', () => {
    expect(formatQuantity(2.5, 'piece')).toBe('3');
    expect(formatQuantity(2.4, 'piece')).toBe('2');
    expect(formatQuantity(1.7, 'piece')).toBe('2');
  });

  it('handles zero quantity', () => {
    expect(formatQuantity(0, 'g')).toBe('0');
  });

  it('handles very small quantities', () => {
    expect(formatQuantity(0.25, 'tsp')).toBe('0.25');
    expect(formatQuantity(0.333, 'tsp')).toBe('0.33');
  });

  it('handles scaling calculations correctly', () => {
    // 500g base at 4 servings, scaled to 6 servings: 500 * (6/4) = 750
    expect(formatQuantity(500 * (6 / 4), 'g')).toBe('750');
    // 2 pieces at 4 servings, scaled to 3 servings: 2 * (3/4) = 1.5 → rounds to 2
    expect(formatQuantity(2 * (3 / 4), 'piece')).toBe('2');
    // 1 tsp at 4 servings, scaled to 6 servings: 1 * (6/4) = 1.5
    expect(formatQuantity(1 * (6 / 4), 'tsp')).toBe('1.5');
  });
});
