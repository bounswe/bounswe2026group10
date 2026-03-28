export function formatQuantity(quantity: number): string {
  const formatted = parseFloat(quantity.toFixed(2));
  return String(formatted);
}
