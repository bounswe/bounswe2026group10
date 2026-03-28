import type { MeasurementUnit } from '../types/common';

export type RegionSystem = 'metric' | 'imperial';

interface ConvertedUnit {
  unit: MeasurementUnit;
  quantity: number;
}

const METRIC_UNITS: MeasurementUnit[] = ['g', 'kg', 'ml', 'L'];
const IMPERIAL_UNITS: MeasurementUnit[] = ['oz', 'lb', 'cup', 'tbsp', 'tsp'];
const PASSTHROUGH_UNITS: MeasurementUnit[] = ['piece', 'pinch'];

function isMetricUnit(unit: MeasurementUnit): boolean {
  return METRIC_UNITS.includes(unit);
}

function isImperialUnit(unit: MeasurementUnit): boolean {
  return IMPERIAL_UNITS.includes(unit);
}

function round2(value: number): number {
  return parseFloat(value.toFixed(2));
}

function convertToImperial(unit: MeasurementUnit, quantity: number): ConvertedUnit {
  switch (unit) {
    case 'g': {
      if (quantity > 453) {
        return { unit: 'lb', quantity: round2(quantity / 453.592) };
      }
      return { unit: 'oz', quantity: round2(quantity / 28.3495) };
    }
    case 'kg':
      return { unit: 'lb', quantity: round2(quantity * 2.20462) };
    case 'ml': {
      if (quantity < 15) {
        return { unit: 'tsp', quantity: round2(quantity / 4.929) };
      }
      if (quantity < 45) {
        return { unit: 'tbsp', quantity: round2(quantity / 14.787) };
      }
      return { unit: 'cup', quantity: round2(quantity / 236.588) };
    }
    case 'L':
      return { unit: 'cup', quantity: round2(quantity * 4.22675) };
    default:
      return { unit, quantity };
  }
}

function convertToMetric(unit: MeasurementUnit, quantity: number): ConvertedUnit {
  switch (unit) {
    case 'oz':
      return { unit: 'g', quantity: round2(quantity * 28.3495) };
    case 'lb':
      return { unit: 'kg', quantity: round2(quantity / 2.20462) };
    case 'cup':
      return { unit: 'ml', quantity: round2(quantity * 236.588) };
    case 'tbsp':
      return { unit: 'ml', quantity: round2(quantity * 14.787) };
    case 'tsp':
      return { unit: 'ml', quantity: round2(quantity * 4.929) };
    default:
      return { unit, quantity };
  }
}

export function getUnitBasedOnRegion(
  originalUnit: MeasurementUnit,
  quantity: number,
  region: RegionSystem = 'metric',
): ConvertedUnit {
  if (PASSTHROUGH_UNITS.includes(originalUnit)) {
    return { unit: originalUnit, quantity };
  }

  if (region === 'imperial' && isMetricUnit(originalUnit)) {
    return convertToImperial(originalUnit, quantity);
  }

  if (region === 'metric' && isImperialUnit(originalUnit)) {
    return convertToMetric(originalUnit, quantity);
  }

  return { unit: originalUnit, quantity };
}
