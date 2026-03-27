export interface Step {
  stepNumber: number;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  durationMinutes?: number;
  videoTimestamp?: number;
}
