import type { RecipeCard } from '../types/recipe';

export const mockAlternatives: RecipeCard[] = [
  {
    id: 'recipe-002',
    title: 'Street-Style Adana',
    thumbnailUrl: 'https://picsum.photos/seed/adana-street/400/300',
    author: { id: 'user-002', firstName: 'Fatma', lastName: 'Yilmaz' },
    rating: 4.5,
    ratingCount: 87,
    region: 'Adana, Turkey',
    dishVarietyId: 'variety-adana-kebab',
    dishVarietyName: 'Adana Kebab',
    type: 'COMMUNITY',
    tags: ['HALAL'],
    status: 'PUBLISHED',
    updatedAt: '2025-07-10T14:00:00Z',
  },
  {
    id: 'recipe-003',
    title: 'Spicy Adana Wrap',
    thumbnailUrl: 'https://picsum.photos/seed/adana-wrap/400/300',
    author: { id: 'user-003', firstName: 'Emre', lastName: 'Kaya' },
    rating: 4.2,
    ratingCount: 45,
    region: 'Istanbul, Turkey',
    dishVarietyId: 'variety-adana-kebab',
    dishVarietyName: 'Adana Kebab',
    type: 'COMMUNITY',
    tags: ['HALAL', 'HEARTY'],
    status: 'PUBLISHED',
    updatedAt: '2025-08-22T09:15:00Z',
  },
];
