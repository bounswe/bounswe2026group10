import { getUnitBasedOnRegion } from '../logic/UnitConversion';

describe('getUnitBasedOnRegion', () => {
  describe('metric to imperial', () => {
    it('converts grams to ounces', () => {
      const result = getUnitBasedOnRegion('g', 100, 'imperial');
      expect(result.unit).toBe('oz');
      expect(result.quantity).toBeCloseTo(3.53, 1);
    });

    it('converts large grams to pounds', () => {
      const result = getUnitBasedOnRegion('g', 500, 'imperial');
      expect(result.unit).toBe('lb');
      expect(result.quantity).toBeCloseTo(1.1, 1);
    });

    it('converts kilograms to pounds', () => {
      const result = getUnitBasedOnRegion('kg', 2, 'imperial');
      expect(result.unit).toBe('lb');
      expect(result.quantity).toBeCloseTo(4.41, 1);
    });

    it('converts small milliliters to teaspoons', () => {
      const result = getUnitBasedOnRegion('ml', 10, 'imperial');
      expect(result.unit).toBe('tsp');
      expect(result.quantity).toBeCloseTo(2.03, 1);
    });

    it('converts medium milliliters to tablespoons', () => {
      const result = getUnitBasedOnRegion('ml', 30, 'imperial');
      expect(result.unit).toBe('tbsp');
      expect(result.quantity).toBeCloseTo(2.03, 1);
    });

    it('converts large milliliters to cups', () => {
      const result = getUnitBasedOnRegion('ml', 250, 'imperial');
      expect(result.unit).toBe('cup');
      expect(result.quantity).toBeCloseTo(1.06, 1);
    });

    it('converts liters to cups', () => {
      const result = getUnitBasedOnRegion('L', 1, 'imperial');
      expect(result.unit).toBe('cup');
      expect(result.quantity).toBeCloseTo(4.23, 1);
    });
  });

  describe('imperial to metric', () => {
    it('converts ounces to grams', () => {
      const result = getUnitBasedOnRegion('oz', 4, 'metric');
      expect(result.unit).toBe('g');
      expect(result.quantity).toBeCloseTo(113.4, 0);
    });

    it('converts pounds to kilograms', () => {
      const result = getUnitBasedOnRegion('lb', 2, 'metric');
      expect(result.unit).toBe('kg');
      expect(result.quantity).toBeCloseTo(0.91, 1);
    });

    it('converts cups to milliliters', () => {
      const result = getUnitBasedOnRegion('cup', 1, 'metric');
      expect(result.unit).toBe('ml');
      expect(result.quantity).toBeCloseTo(236.59, 0);
    });

    it('converts tablespoons to milliliters', () => {
      const result = getUnitBasedOnRegion('tbsp', 2, 'metric');
      expect(result.unit).toBe('ml');
      expect(result.quantity).toBeCloseTo(29.57, 0);
    });

    it('converts teaspoons to milliliters', () => {
      const result = getUnitBasedOnRegion('tsp', 3, 'metric');
      expect(result.unit).toBe('ml');
      expect(result.quantity).toBeCloseTo(14.79, 0);
    });
  });

  describe('passthrough units', () => {
    it('returns piece unchanged for imperial', () => {
      const result = getUnitBasedOnRegion('piece', 5, 'imperial');
      expect(result).toEqual({ unit: 'piece', quantity: 5 });
    });

    it('returns pinch unchanged for imperial', () => {
      const result = getUnitBasedOnRegion('pinch', 2, 'imperial');
      expect(result).toEqual({ unit: 'pinch', quantity: 2 });
    });
  });

  describe('same-system no-op', () => {
    it('returns metric unit unchanged when region is metric', () => {
      const result = getUnitBasedOnRegion('g', 500, 'metric');
      expect(result).toEqual({ unit: 'g', quantity: 500 });
    });

    it('returns imperial unit unchanged when region is imperial', () => {
      const result = getUnitBasedOnRegion('oz', 8, 'imperial');
      expect(result).toEqual({ unit: 'oz', quantity: 8 });
    });
  });

  describe('defaults', () => {
    it('defaults to metric region', () => {
      const result = getUnitBasedOnRegion('cup', 1);
      expect(result.unit).toBe('ml');
    });
  });

  describe('edge cases', () => {
    it('handles zero quantity', () => {
      const result = getUnitBasedOnRegion('g', 0, 'imperial');
      expect(result.quantity).toBe(0);
    });
  });
});
