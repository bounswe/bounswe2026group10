import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface VideoPlayerProps {
  videoUrl?: string;
  stepNumber: number;
  stepDescription: string;
}

export function VideoPlayer({
  videoUrl,
  stepNumber,
  stepDescription,
}: VideoPlayerProps) {
  console.log('[VideoPlayer] videoUrl:', videoUrl);
  const player = useVideoPlayer(videoUrl ?? null, (p) => {
    p.loop = true;
  });

  return (
    <View style={styles.container}>
      {videoUrl ? (
        <VideoView
          player={player}
          style={styles.video}
          allowsFullscreen
          allowsPictureInPicture={false}
          nativeControls
        />
      ) : (
        <View style={styles.placeholder}>
          <MaterialCommunityIcons name="video-off-outline" size={48} color={colors.onSurfaceVariant} />
          <Text style={styles.placeholderText}>No video available</Text>
        </View>
      )}

      <View style={styles.stepInfo}>
        <View style={styles.stepNumberCircle}>
          <Text style={styles.stepNumberText}>{stepNumber}</Text>
        </View>
        <Text style={styles.stepDescription} numberOfLines={2}>
          {stepDescription}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  placeholderText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },
  stepInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stepNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  stepNumberText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.md,
    color: colors.white,
  },
  stepDescription: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.lg,
    color: colors.white,
    lineHeight: 22,
  },
});
