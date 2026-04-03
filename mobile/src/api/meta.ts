import { mockDelay } from './client';

export async function getRegions(): Promise<string[]> {
  await mockDelay(200);
  return ['Turkey', 'Greece', 'Italy', 'Mexico', 'India', 'Japan'];
}
