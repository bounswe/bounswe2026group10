import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FormDropdown } from '../shared/FormDropdown';
import { FormTextInput } from '../shared/FormTextInput';
import { COUNTRIES } from '../../constants/recipeForm';

interface OriginSectionProps {
  country: string;
  city: string;
  district: string;
  onCountryChange: (value: string) => void;
  onCityChange: (text: string) => void;
  onDistrictChange: (text: string) => void;
  countryError?: string;
}

export function OriginSection({
  country,
  city,
  district,
  onCountryChange,
  onCityChange,
  onDistrictChange,
  countryError,
}: OriginSectionProps) {
  const { t } = useTranslation('common');
  return (
    <View>
      <FormDropdown
        label={t('create.origin.country')}
        value={country}
        options={COUNTRIES}
        onSelect={onCountryChange}
        placeholder={t('create.origin.countryPlaceholder')}
        error={countryError}
        searchable
      />
      {country !== '' && (
        <>
          <FormTextInput
            label={t('create.origin.city')}
            value={city}
            onChangeText={onCityChange}
            placeholder={t('create.origin.cityPlaceholder')}
            optional
          />
          <FormTextInput
            label={t('create.origin.district')}
            value={district}
            onChangeText={onDistrictChange}
            placeholder={t('create.origin.districtPlaceholder')}
            optional
          />
        </>
      )}
    </View>
  );
}
