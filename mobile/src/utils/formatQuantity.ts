export function formatQuantity(quantity: number, unit: string): string {
  if (unit === 'piece') {
    return String(Math.round(quantity));
  }
  const formatted = parseFloat(quantity.toFixed(2));
  return String(formatted);
}
