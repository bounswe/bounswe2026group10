import { useState } from 'react';

export function useServingAdjuster(baseServings: number) {
  const [servings, setServings] = useState(baseServings);

  const increment = () => setServings((s) => s + 1);
  const decrement = () => setServings((s) => Math.max(1, s - 1));

  return { servings, increment, decrement };
}
