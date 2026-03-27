import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
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
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  return (
    <View style={styles.container}>
      {videoUrl ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          isLooping
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
              setIsLoading(false);
            }
          }}
          onLoadStart={() => setIsLoading(true)}
        />
      ) : (
        <View style={styles.placeholder} />
      )}

      {isLoading && videoUrl && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {!isLoading && !isPlaying && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={togglePlayPause}
          activeOpacity={0.8}
        >
          <View style={styles.playButton}>
            <MaterialCommunityIcons name="play" size={32} color={colors.white} />
          </View>
        </TouchableOpacity>
      )}

      {isPlaying && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={togglePlayPause}
          activeOpacity={1}
        />
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
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
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
