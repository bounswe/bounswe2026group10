import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CreateStackParamList } from '../../navigation/types';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import { IconButton } from '../shared/IconButton';
import { FormTextInput } from '../shared/FormTextInput';
import { FormDropdown } from '../shared/FormDropdown';
import { ChipSelector } from '../shared/ChipSelector';
import { StepHeader } from './StepHeader';
import { ImportCards } from './ImportCards';
import { OriginSection } from './OriginSection';
import { useRecipeForm } from '../../context/RecipeFormContext';
import { getDishGenres } from '../../api/dish-genres';
import { getDietaryTags } from '../../api/dietary-tags';
import type { DishGenre } from '../../api/dish-genres';
import type { DietaryTagItem } from '../../api/dietary-tags';

export function CreateBasicInfoScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CreateStackParamList>>();
  const { updateDraft } = useRecipeForm();
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [genreId, setGenreId] = useState<number | null>(null);
  const [varietyId, setVarietyId] = useState<number | null>(null);
  const [servingSize, setServingSize] = useState('');

  // API data
  const [genres, setGenres] = useState<DishGenre[]>([]);
  const [allTags, setAllTags] = useState<DietaryTagItem[]>([]);

  // Build dropdown options from API data
  const genreOptions = genres.map((g) => ({ label: g.name, value: String(g.id) }));
  const selectedGenre = genres.find((g) => g.id === genreId);
  const varietyOptions = selectedGenre
    ? selectedGenre.varieties.map((v) => ({ label: v.name, value: String(v.id) }))
    : [];

  // Build chip options from API data — values are string IDs
  const dietaryChipOptions = allTags
    .filter((t) => t.category === 'dietary')
    .map((t) => ({ label: t.name, value: String(t.id) }));
  const allergenChipOptions = allTags
    .filter((t) => t.category === 'allergen')
    .map((t) => ({ label: t.name, value: String(t.id) }));

  const [selectedDietaryIds, setSelectedDietaryIds] = useState<string[]>([]);
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<string[]>([]);
  const [story, setStory] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getDishGenres().then(setGenres).catch(() => {});
    getDietaryTags().then(setAllTags).catch(() => {});
  }, []);

  const handleGenreChange = (id: string) => {
    setGenreId(Number(id));
    setVarietyId(null);
  };

  const toggleString = (arr: string[], item: string): string[] =>
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
      updateDraft({
        title,
        type: 'COMMUNITY',
        originCountry: country,
        originCity: city,
        originDistrict: district,
        genreId,
        varietyId,
        dietaryTagIds: selectedDietaryIds.map(Number),
        allergenTagIds: selectedAllergenIds.map(Number),
        story,
        servingSize: servingSize ? parseInt(servingSize, 10) : undefined,
      });
      navigation.navigate('CreateIngredientsTools');
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
          value={genreId !== null ? String(genreId) : ''}
          options={genreOptions}
          onSelect={handleGenreChange}
          placeholder="Select genre"
          searchable
        />

        <FormDropdown
          label="Variety"
          value={varietyId !== null ? String(varietyId) : ''}
          options={varietyOptions}
          onSelect={(id) => setVarietyId(Number(id))}
          placeholder={genreId !== null ? 'Select variety' : 'Select a genre first'}
          searchable
        />

        <View style={styles.servingSizeRow}>
          <Text style={styles.servingSizeLabel}>Serving Size</Text>
          <TextInput
            style={styles.servingSizeInput}
            value={servingSize}
            onChangeText={setServingSize}
            placeholder="e.g. 4"
            placeholderTextColor={colors.outline}
            keyboardType="number-pad"
          />
        </View>

        <ChipSelector
          label="Dietary Tags"
          options={dietaryChipOptions}
          selected={selectedDietaryIds}
          onToggle={(id) => setSelectedDietaryIds(toggleString(selectedDietaryIds, id))}
        />

        <ChipSelector
          label="Allergen Tags"
          options={allergenChipOptions}
          selected={selectedAllergenIds}
          onToggle={(id) => setSelectedAllergenIds(toggleString(selectedAllergenIds, id))}
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
  servingSizeRow: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  servingSizeLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  servingSizeInput: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    paddingVertical: spacing.xs,
    width: 80,
  },
});
