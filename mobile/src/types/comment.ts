import type { ISODateString } from './common';
import type { User } from './user';

export interface Comment {
  id: string;
  recipeId: string;
  author: Pick<User, 'id' | 'firstName' | 'lastName' | 'profilePictureUrl'>;
  text: string;
  createdAt: ISODateString;
}

export interface Rating {
  id: string;
  recipeId: string;
  userId: string;
  score: 1 | 2 | 3 | 4 | 5;
}

export interface RatingSummary {
  average: number;
  totalCount: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
