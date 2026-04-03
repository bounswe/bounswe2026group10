import { fetchApi } from './client';

export async function getRegions(): Promise<string[]> {
  return fetchApi<string[]>('/meta/regions');
}
