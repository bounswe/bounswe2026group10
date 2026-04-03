import { fetchApi } from './client';

export interface ToolItem {
  name: string;
}

export async function getTools(): Promise<ToolItem[]> {
  return fetchApi<ToolItem[]>('/tools');
}
