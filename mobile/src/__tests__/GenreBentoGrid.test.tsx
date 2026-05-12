import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GenreBentoGrid } from '../components/search/GenreBentoGrid';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

const mockGenres = [
  { id: 1, name: 'Kebap', description: '', varieties: [] },
  { id: 2, name: 'Çorbalar', description: '', varieties: [] },
  { id: 3, name: 'Tatlılar', description: '', varieties: [] },
];

describe('GenreBentoGrid', () => {
  it('renders all genre names', () => {
    const { getByText } = render(
      <GenreBentoGrid genres={mockGenres} onGenrePress={jest.fn()} />
    );
    expect(getByText('Kebap')).toBeTruthy();
    expect(getByText('Çorbalar')).toBeTruthy();
    expect(getByText('Tatlılar')).toBeTruthy();
  });

  it('returns null when genres list is empty', () => {
    const { toJSON } = render(
      <GenreBentoGrid genres={[]} onGenrePress={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it('calls onGenrePress with the correct genre when a row is pressed', () => {
    const onGenrePress = jest.fn();
    const { getByText } = render(
      <GenreBentoGrid genres={mockGenres} onGenrePress={onGenrePress} />
    );
    fireEvent.press(getByText('Çorbalar'));
    expect(onGenrePress).toHaveBeenCalledWith(mockGenres[1]);
  });

  it('applies active style to the active genre row', () => {
    const { getByText } = render(
      <GenreBentoGrid genres={mockGenres} onGenrePress={jest.fn()} activeGenreId={2} />
    );
    expect(getByText('Çorbalar')).toBeTruthy();
  });
});
