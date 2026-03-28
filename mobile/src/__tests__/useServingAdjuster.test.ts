import { renderHook, act } from '@testing-library/react-native';
import { useServingAdjuster } from '../hooks/useServingAdjuster';

describe('useServingAdjuster', () => {
  it('initializes with the base serving count', () => {
    const { result } = renderHook(() => useServingAdjuster(4));
    expect(result.current.servings).toBe(4);
  });

  it('increments the serving count', () => {
    const { result } = renderHook(() => useServingAdjuster(4));
    act(() => result.current.increment());
    expect(result.current.servings).toBe(5);
  });

  it('decrements the serving count', () => {
    const { result } = renderHook(() => useServingAdjuster(4));
    act(() => result.current.decrement());
    expect(result.current.servings).toBe(3);
  });

  it('does not decrement below 1', () => {
    const { result } = renderHook(() => useServingAdjuster(1));
    act(() => result.current.decrement());
    expect(result.current.servings).toBe(1);
  });

  it('does not decrement below 1 after multiple decrements', () => {
    const { result } = renderHook(() => useServingAdjuster(3));
    act(() => result.current.decrement());
    act(() => result.current.decrement());
    act(() => result.current.decrement());
    act(() => result.current.decrement());
    expect(result.current.servings).toBe(1);
  });

  it('supports multiple increments', () => {
    const { result } = renderHook(() => useServingAdjuster(2));
    act(() => result.current.increment());
    act(() => result.current.increment());
    act(() => result.current.increment());
    expect(result.current.servings).toBe(5);
  });

  it('supports increment then decrement back to base', () => {
    const { result } = renderHook(() => useServingAdjuster(4));
    act(() => result.current.increment());
    act(() => result.current.decrement());
    expect(result.current.servings).toBe(4);
  });
});
