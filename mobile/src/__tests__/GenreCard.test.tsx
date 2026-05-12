import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { GenreCard } from '../components/home/GenreCard';


jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('GenreCard', () => {
  it('renders the genre name', () => {
    const { getByText } = render(<GenreCard id={1} name="Soups" />);
    expect(getByText('Soups')).toBeTruthy();
  });

  it('renders a long genre name without crashing', () => {
    const { getByText } = render(<GenreCard id={2} name="Fermente Gıdalar" />);
    expect(getByText('Fermente Gıdalar')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<GenreCard id={1} name="Kebabs" onPress={onPress} />);
    fireEvent.press(getByText('Kebabs'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders without onPress without crashing', () => {
    const { getByText } = render(<GenreCard id={1} name="Pastries" />);
    expect(getByText('Pastries')).toBeTruthy();
  });

  it('label text style includes textAlign center', () => {
    const { getByText } = render(<GenreCard id={1} name="Soups" />);
    const label = getByText('Soups');
    const style = StyleSheet.flatten(label.props.style);
    expect(style?.textAlign).toBe('center');
  });
});
