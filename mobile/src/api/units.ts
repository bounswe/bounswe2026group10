import { fetchApi } from './client';

interface UnitRow {
  unit: string;
}

export async function getUnits(search?: string): Promise<string[]> {
  const path = search?.trim()
    ? `/units?search=${encodeURIComponent(search.trim())}`
    : '/units';
  const rows = await fetchApi<UnitRow[]>(path);
  return rows.map((r) => r.unit);
}
