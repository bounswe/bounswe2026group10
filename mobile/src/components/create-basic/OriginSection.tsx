import React from 'react';
import { View } from 'react-native';
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
  return (
    <View>
      <FormDropdown
        label="Country"
        value={country}
        options={COUNTRIES}
        onSelect={onCountryChange}
        placeholder="Select country"
        error={countryError}
        searchable
      />
      {country !== '' && (
        <>
          <FormTextInput
            label="City"
            value={city}
            onChangeText={onCityChange}
            placeholder="e.g., Istanbul"
            optional
          />
          <FormTextInput
            label="District"
            value={district}
            onChangeText={onDistrictChange}
            placeholder="e.g., Kadikoy"
            optional
          />
        </>
      )}
    </View>
  );
}
