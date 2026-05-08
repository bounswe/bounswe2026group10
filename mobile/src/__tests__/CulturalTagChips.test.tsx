import React from 'react';
import { render } from '@testing-library/react-native';
import { CulturalTagChips } from '../components/shared/CulturalTagChips';
import type { CulturalTagItem } from '../api/cultural-tags';
import i18n from '../i18n';

const TAGS: CulturalTagItem[] = [
  { id: 1, key: 'wedding', labelEn: 'Wedding', labelTr: 'Düğün', country: null },
  { id: 9, key: 'iftar', labelEn: 'Iftar', labelTr: 'İftar', country: 'Turkey' },
];

describe('CulturalTagChips', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders nothing when the tag list is empty', () => {
    const { toJSON } = render(<CulturalTagChips tags={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders one chip per tag with English labels by default', () => {
    const { getByText, getByTestId } = render(<CulturalTagChips tags={TAGS} />);
    expect(getByText('Wedding')).toBeTruthy();
    expect(getByText('Iftar')).toBeTruthy();
    expect(getByTestId('cultural-tag-chip-wedding')).toBeTruthy();
    expect(getByTestId('cultural-tag-chip-iftar')).toBeTruthy();
  });

  it('renders Turkish labels when the active locale is tr', async () => {
    await i18n.changeLanguage('tr');
    const { getByText } = render(<CulturalTagChips tags={TAGS} />);
    expect(getByText('Düğün')).toBeTruthy();
    expect(getByText('İftar')).toBeTruthy();
  });
});
