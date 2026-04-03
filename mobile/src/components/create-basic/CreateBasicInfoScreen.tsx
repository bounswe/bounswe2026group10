import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
import { validateBasicInfo } from '../../utils/recipeValidation';
import { getDishGenres } from '../../api/dish-genres';
import { getDietaryTags } from '../../api/dietary-tags';
import { uploadImage } from '../../api/images';
import type { DishGenre } from '../../api/dish-genres';
import type { DietaryTagItem } from '../../api/dietary-tags';

interface ImageItem {
  id: string;
  localUri: string;
  cdnUrl: string | null;
  uploading: boolean;
  error?: string;
}

export function CreateBasicInfoScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CreateStackParamList>>();
  const { draft, updateDraft, resetDraft } = useRecipeForm();
  const [title, setTitle] = useState(draft.title);
  const [country, setCountry] = useState(draft.originCountry);
  const [city, setCity] = useState(draft.originCity);
  const [district, setDistrict] = useState(draft.originDistrict);
  const [genreId, setGenreId] = useState<number | null>(draft.genreId);
  const [varietyId, setVarietyId] = useState<number | null>(draft.varietyId);
  const [servingSize, setServingSize] = useState(draft.servingSize ? String(draft.servingSize) : '');
  const [selectedDietaryIds, setSelectedDietaryIds] = useState<string[]>(draft.dietaryTagIds.map(String));
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<string[]>(draft.allergenTagIds.map(String));
  const [story, setStory] = useState(draft.story);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Images — restore already-uploaded ones from draft on back-nav
  const [images, setImages] = useState<ImageItem[]>(
    draft.imageUrls.map((url, i) => ({
      id: `draft-${i}`,
      localUri: url,
      cdnUrl: url,
      uploading: false,
    }))
  );

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

  useEffect(() => {
    getDishGenres()
      .then((data) => {
        console.log('[BasicInfo] dish-genres loaded:', JSON.stringify(data).slice(0, 200));
        setGenres(data);
      })
      .catch((err) => console.error('[BasicInfo] dish-genres error:', err));
    getDietaryTags()
      .then((data) => {
        console.log('[BasicInfo] dietary-tags loaded:', JSON.stringify(data).slice(0, 200));
        setAllTags(data);
      })
      .catch((err) => console.error('[BasicInfo] dietary-tags error:', err));
  }, []);

  const handleGenreChange = (id: string) => {
    setGenreId(Number(id));
    setVarietyId(null);
  };

  const toggleString = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  // ─── Image upload ─────────────────────────────────────────────────────────────

  const handleAddImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as ImagePicker.MediaType[],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;

    const newItems: ImageItem[] = result.assets.map((asset) => ({
      id: `${Date.now()}-${asset.uri}`,
      localUri: asset.uri,
      cdnUrl: null,
      uploading: true,
    }));

    setImages((prev) => [...prev, ...newItems]);

    newItems.forEach((item) => {
      uploadImage(item.localUri)
        .then(({ url }) => {
          setImages((prev) => {
            const updated = prev.map((img) =>
              img.id === item.id ? { ...img, cdnUrl: url, uploading: false } : img
            );
            updateDraft({ imageUrls: updated.filter((img) => img.cdnUrl).map((img) => img.cdnUrl!) });
            return updated;
          });
        })
        .catch(() => {
          setImages((prev) =>
            prev.map((img) =>
              img.id === item.id ? { ...img, uploading: false, error: 'Upload failed' } : img
            )
          );
        });
    });
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      updateDraft({ imageUrls: updated.filter((img) => img.cdnUrl).map((img) => img.cdnUrl!) });
      return updated;
    });
  };

  // ─── Validation & navigation ──────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors = validateBasicInfo(title);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      const dietaryNames = dietaryChipOptions
        .filter((o) => selectedDietaryIds.includes(o.value))
        .map((o) => o.label);
      const allergenNames = allergenChipOptions
        .filter((o) => selectedAllergenIds.includes(o.value))
        .map((o) => o.label);
      updateDraft({
        title,
        type: 'COMMUNITY',
        originCountry: country,
        originCity: city,
        originDistrict: district,
        genreId,
        varietyId,
        dietaryTagIds: selectedDietaryIds.map(Number),
        dietaryTagNames: dietaryNames,
        allergenTagIds: selectedAllergenIds.map(Number),
        allergenTagNames: allergenNames,
        story,
        servingSize: servingSize ? parseInt(servingSize, 10) : undefined,
        imageUrls: images.filter((img) => img.cdnUrl).map((img) => img.cdnUrl!),
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
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          resetDraft();
          navigation.getParent()?.navigate('HomeTab' as never);
        },
      },
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

        {/* ── Recipe Images ── */}
        <View style={styles.imagesSection}>
          <Text style={styles.imagesLabel}>RECIPE IMAGES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageStrip}
            nestedScrollEnabled
          >
            {images.map((img) => (
              <View key={img.id} style={styles.imageThumbnailContainer}>
                <Image
                  source={{ uri: img.cdnUrl ?? img.localUri }}
                  style={styles.imageThumbnail}
                />
                {img.uploading && (
                  <View style={styles.imageOverlay}>
                    <ActivityIndicator color={colors.white} size="small" />
                  </View>
                )}
                {!!img.error && !img.uploading && (
                  <View style={styles.imageOverlay}>
                    <MaterialCommunityIcons name="alert-circle" size={20} color={colors.negative} />
                  </View>
                )}
                {!img.uploading && (
                  <TouchableOpacity
                    style={styles.imageRemoveButton}
                    onPress={() => handleRemoveImage(img.id)}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <MaterialCommunityIcons name="close-circle" size={22} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handleAddImages}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="camera-plus-outline" size={28} color={colors.primary} />
              <Text style={styles.addImageText}>Add{'\n'}Photo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

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
    marginBottom: spacing.xl,
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
  // ── Images ──
  imagesSection: {
    marginTop: spacing.xl,
  },
  imagesLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  imageStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  imageThumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageThumbnail: {
    width: 80,
    height: 80,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
    gap: 2,
  },
  addImageText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.primary,
    textAlign: 'center',
  },
});
