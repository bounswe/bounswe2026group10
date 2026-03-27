import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface SectionHeaderProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  rightElement?: React.ReactNode;
}

export function SectionHeader({
  title,
  children,
  defaultExpanded = true,
  rightElement,
}: SectionHeaderProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggle} style={styles.header} activeOpacity={0.7}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerRight}>
          {rightElement}
          <MaterialCommunityIcons
            name={expanded ? 'chevron-down' : 'chevron-right'}
            size={24}
            color={colors.onSurface}
          />
        </View>
      </TouchableOpacity>
      {expanded && children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.xl,
    color: colors.onSurface,
  },
});
