import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DishVarietyCard } from '../components/search/DishVarietyCard';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

const baseVariety = {
  id: 1,
  name: 'Adana Kebabı',
  description: 'Acılı kıyma kebabı',
  genreId: 2,
  genreName: 'Kebap',
};

describe('DishVarietyCard', () => {
  it('renders variety name', () => {
    const { getByText } = render(<DishVarietyCard variety={baseVariety} />);
    expect(getByText('Adana Kebabı')).toBeTruthy();
  });

  it('renders description when provided', () => {
    const { getByText } = render(<DishVarietyCard variety={baseVariety} />);
    expect(getByText('Acılı kıyma kebabı')).toBeTruthy();
  });

  it('renders genre tag when provided', () => {
    const { getByText } = render(<DishVarietyCard variety={baseVariety} />);
    expect(getByText('Kebap')).toBeTruthy();
  });

  it('does not render description when absent', () => {
    const variety = { ...baseVariety, description: undefined };
    const { queryByText } = render(<DishVarietyCard variety={variety as any} />);
    expect(queryByText('Acılı kıyma kebabı')).toBeNull();
  });

  it('does not render genre tag when absent', () => {
    const variety = { ...baseVariety, genreName: undefined };
    const { queryByText } = render(<DishVarietyCard variety={variety as any} />);
    expect(queryByText('Kebap')).toBeNull();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<DishVarietyCard variety={baseVariety} onPress={onPress} />);
    fireEvent.press(getByText('Adana Kebabı'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not render an image placeholder', () => {
    const { UNSAFE_queryAllByProps } = render(<DishVarietyCard variety={baseVariety} />);
    const imagePlaceholders = UNSAFE_queryAllByProps({ testID: 'variety-image-placeholder' });
    expect(imagePlaceholders).toHaveLength(0);
  });
});
