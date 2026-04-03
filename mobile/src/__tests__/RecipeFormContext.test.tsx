import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { RecipeFormProvider, useRecipeForm } from '../context/RecipeFormContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <RecipeFormProvider>{children}</RecipeFormProvider>
);

describe('RecipeFormContext', () => {
  it('initialises draft with empty/null values', () => {
    const { result } = renderHook(() => useRecipeForm(), { wrapper });
    const { draft } = result.current;
    expect(draft.title).toBe('');
    expect(draft.type).toBe('COMMUNITY');
    expect(draft.genreId).toBeNull();
    expect(draft.varietyId).toBeNull();
    expect(draft.servingSize).toBeUndefined();
    expect(draft.videoUrl).toBeNull();
    expect(draft.videoFileName).toBeNull();
  });

  it('initialises all array fields as empty arrays', () => {
    const { result } = renderHook(() => useRecipeForm(), { wrapper });
    const { draft } = result.current;
    expect(draft.dietaryTagIds).toEqual([]);
    expect(draft.dietaryTagNames).toEqual([]);
    expect(draft.allergenTagIds).toEqual([]);
    expect(draft.allergenTagNames).toEqual([]);
    expect(draft.ingredients).toEqual([]);
    expect(draft.tools).toEqual([]);
    expect(draft.imageUrls).toEqual([]);
    expect(draft.steps).toEqual([]);
  });

  it('updateDraft merges partial state without wiping other fields', () => {
    const { result } = renderHook(() => useRecipeForm(), { wrapper });
    act(() => result.current.updateDraft({ title: 'Soup' }));
    expect(result.current.draft.title).toBe('Soup');
    expect(result.current.draft.type).toBe('COMMUNITY');
    expect(result.current.draft.ingredients).toEqual([]);
  });

  it('updateDraft accumulates across multiple calls', () => {
    const { result } = renderHook(() => useRecipeForm(), { wrapper });
    act(() => result.current.updateDraft({ title: 'Soup' }));
    act(() => result.current.updateDraft({ servingSize: 4 }));
    expect(result.current.draft.title).toBe('Soup');
    expect(result.current.draft.servingSize).toBe(4);
  });

  it('updateDraft can overwrite a previously set field', () => {
    const { result } = renderHook(() => useRecipeForm(), { wrapper });
    act(() => result.current.updateDraft({ title: 'Soup' }));
    act(() => result.current.updateDraft({ title: 'Stew' }));
    expect(result.current.draft.title).toBe('Stew');
  });

  it('updating ingredients does not affect steps', () => {
    const { result } = renderHook(() => useRecipeForm(), { wrapper });
    const steps = [{ title: 'Boil water', description: '', timestamp: '' }];
    act(() => result.current.updateDraft({ steps }));
    act(() => result.current.updateDraft({ ingredients: [{ id: '1', ingredientId: 1, name: 'Salt', quantity: '5', unit: 'g' }] }));
    expect(result.current.draft.steps).toEqual(steps);
  });

  it('updating tools does not affect ingredients', () => {
    const { result } = renderHook(() => useRecipeForm(), { wrapper });
    const ingredients = [{ id: '1', ingredientId: 2, name: 'Flour', quantity: '200', unit: 'g' }];
    act(() => result.current.updateDraft({ ingredients }));
    act(() => result.current.updateDraft({ tools: [{ id: 'pan', name: 'Pan' }] }));
    expect(result.current.draft.ingredients).toEqual(ingredients);
  });

  it('resetDraft restores all fields to initial values', () => {
    const { result } = renderHook(() => useRecipeForm(), { wrapper });
    act(() => result.current.updateDraft({ title: 'Soup', servingSize: 4, varietyId: 7 }));
    act(() => result.current.resetDraft());
    expect(result.current.draft.title).toBe('');
    expect(result.current.draft.servingSize).toBeUndefined();
    expect(result.current.draft.varietyId).toBeNull();
  });

  it('useRecipeForm throws when called outside RecipeFormProvider', () => {
    // Suppress expected error output from React
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useRecipeForm())).toThrow(
      'useRecipeForm must be used inside RecipeFormProvider'
    );
    consoleError.mockRestore();
  });
});
