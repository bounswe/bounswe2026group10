import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DietaryTag, AllergenTag } from '../../types/common';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import { GENRE_OPTIONS, VARIETY_OPTIONS, DIETARY_TAG_OPTIONS, ALLERGEN_TAG_OPTIONS } from '../../constants/recipeForm';
import { IconButton } from '../shared/IconButton';
import { FormTextInput } from '../shared/FormTextInput';
import { FormDropdown } from '../shared/FormDropdown';
import { ChipSelector } from '../shared/ChipSelector';
import { StepHeader } from './StepHeader';
import { ImportCards } from './ImportCards';
import { OriginSection } from './OriginSection';

export function CreateBasicInfoScreen() {
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [genreId, setGenreId] = useState('');
  const [varietyId, setVarietyId] = useState('');

  const varietyOptions = genreId ? (VARIETY_OPTIONS[genreId] ?? []) : [];

  const handleGenreChange = (id: string) => {
    setGenreId(id);
    setVarietyId('');
  };
  const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>([]);
  const [allergenTags, setAllergenTags] = useState<AllergenTag[]>([]);
  const [story, setStory] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleTag = <T extends string>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Recipe title is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      Alert.alert('Next', 'Navigation to Ingredients step coming soon.');
    }
  };

  const handleSaveDraft = () => {
    Alert.alert('Draft Saved', 'Your recipe draft has been saved.');
  };

  const handleClose = () => {
    Alert.alert('Discard Recipe?', 'Your changes will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <IconButton name="close" onPress={handleClose} />
        <Text style={styles.logoText}>Roots & Recipes</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StepHeader
          currentStep={1}
          totalSteps={4}
          title="Basic Info"
          subtitle="Lay the foundation for your culinary story."
        />

        <ImportCards />

        <FormTextInput
          label="Recipe Title"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
          }}
          placeholder="e.g., Nonna's Sunday Ragu"
          inputFont="serif"
          inputFontSize={fontSizes['2xl']}
          error={errors.title}
        />

        <OriginSection
          country={country}
          city={city}
          district={district}
          onCountryChange={setCountry}
          onCityChange={setCity}
          onDistrictChange={setDistrict}
        />

        <FormDropdown
          label="Genre"
          value={genreId}
          options={GENRE_OPTIONS}
          onSelect={handleGenreChange}
          placeholder="Select genre"
          searchable
        />

        <FormDropdown
          label="Variety"
          value={varietyId}
          options={varietyOptions}
          onSelect={setVarietyId}
          placeholder={genreId ? 'Select variety' : 'Select a genre first'}
          searchable
        />

        <ChipSelector
          label="Dietary Tags"
          options={DIETARY_TAG_OPTIONS}
          selected={dietaryTags}
          onToggle={(tag) => setDietaryTags(toggleTag(dietaryTags, tag))}
        />

        <ChipSelector
          label="Allergen Tags"
          options={ALLERGEN_TAG_OPTIONS}
          selected={allergenTags}
          onToggle={(tag) => setAllergenTags(toggleTag(allergenTags, tag))}
        />

        <FormTextInput
          label="The Story / Description"
          value={story}
          onChangeText={setStory}
          placeholder="Share the history of this dish or any special memories..."
          multiline
          numberOfLines={4}
          optional
        />

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>Next: Ingredients</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveDraftButton} onPress={handleSaveDraft} activeOpacity={0.7}>
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  logoText: {
    flex: 1,
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.xl,
    color: colors.primary,
    textAlign: 'center',
  },
  topBarSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  nextButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.lg,
    color: colors.white,
  },
  saveDraftButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  saveDraftText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.onSurfaceVariant,
  },
});
