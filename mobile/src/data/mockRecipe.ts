import type { Recipe } from '../types/recipe';

export const mockRecipe: Recipe = {
  id: 'recipe-001',
  title: "The Master's 1948 Adana",
  description:
    'A legendary Adana kebab recipe passed down through generations, featuring hand-minced lamb and the perfect blend of spices.',
  story:
    'To cook, the flames must sing, and the meat must breathe before you grill it. ' +
    'My grandfather gave this recipe to me in 1948. This is Adana — not ' +
    'another grilled meat dish. The fat must be from the tail, the peppers from ' +
    'Urfa, and the fire from real charcoal. Anything else is not Adana.',
  type: 'CULTURAL',
  status: 'PUBLISHED',
  author: {
    id: 'user-001',
    firstName: 'Master',
    lastName: 'Ahmet',
    email: 'ahmet@example.com',
    role: 'EXPERT',
    region: 'Adana, Turkey',
    preferredLanguage: 'tr',
    profilePictureUrl: 'https://picsum.photos/seed/ahmet/100/100',
    bio: 'Third-generation kebab master from Adana.',
    memberSince: '2024-01-15T00:00:00Z',
  },
  images: ['https://picsum.photos/seed/adana-kebab/800/600'],
  videoUrl: 'https://example.com/adana-kebab-video.mp4',
  rating: 4.8,
  ratingCount: 124,
  prepTime: '30 min',
  cookTime: '15 min',
  servings: 4,
  ingredients: [
    {
      id: 'ing-001',
      name: 'Minced Lamb',
      quantity: 500,
      unit: 'g',
      allergens: [],
      substitutionAvailable: true,
      substitutes: ['Minced Beef', 'Minced Chicken'],
    },
    {
      id: 'ing-002',
      name: 'Lamb Tail Fat',
      quantity: 100,
      unit: 'g',
      allergens: [],
      substitutionAvailable: true,
      substitutes: ['Beef Suet', 'Butter'],
    },
    {
      id: 'ing-003',
      name: 'Red Bell Peppers',
      quantity: 2,
      unit: 'piece',
      allergens: [],
      substitutionAvailable: false,
      substitutes: [],
    },
    {
      id: 'ing-004',
      name: 'Isot Pepper (Urfa Flakes)',
      quantity: 2,
      unit: 'tbsp',
      allergens: [],
      substitutionAvailable: true,
      substitutes: ['Aleppo Pepper', 'Korean Gochugaru'],
    },
    {
      id: 'ing-005',
      name: 'Salt',
      quantity: 1,
      unit: 'tsp',
      allergens: [],
      substitutionAvailable: false,
      substitutes: [],
    },
  ],
  tools: [
    { id: 'tool-001', name: 'Adana Skewers (wide, flat)' },
    { id: 'tool-002', name: 'Charcoal Grill' },
    { id: 'tool-003', name: 'Large Knife or Zirh' },
    { id: 'tool-004', name: 'Mixing Bowl' },
  ],
  steps: [
    {
      stepNumber: 1,
      title: 'Prepare the Meat',
      description:
        'Hand-mince the lamb and tail fat together using a large knife or zirh. Do not use a grinder — the texture must be coarse.',
      durationMinutes: 15,
    },
    {
      stepNumber: 2,
      title: 'Season the Mixture',
      description:
        'Add isot pepper and salt to the minced meat. Knead firmly for 5 minutes until the mixture becomes sticky and holds together.',
      durationMinutes: 5,
    },
    {
      stepNumber: 3,
      title: 'Shape onto Skewers',
      description:
        'Divide into 4 portions. Mold each portion onto a flat skewer, pressing firmly to form a long, even shape about 2cm thick.',
      durationMinutes: 5,
    },
    {
      stepNumber: 4,
      title: 'Grill over Charcoal',
      description:
        'Grill over hot charcoal for 3–4 minutes per side. The kebabs should have a slight char on the outside but remain juicy inside.',
      durationMinutes: 8,
    },
    {
      stepNumber: 5,
      title: 'Serve',
      description:
        'Serve on lavash bread with grilled tomatoes, peppers, and a squeeze of lemon. Add sumac onions on the side.',
      durationMinutes: 2,
    },
  ],
  origin: {
    country: 'Turkey',
    city: 'Adana',
  },
  dishVarietyId: 'variety-adana-kebab',
  tags: ['HALAL', 'HEARTY'],
  allergens: [],
  createdAt: '2025-06-01T12:00:00Z',
  updatedAt: '2025-06-15T08:30:00Z',
};
