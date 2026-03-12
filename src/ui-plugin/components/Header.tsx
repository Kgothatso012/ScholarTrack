import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../theme';
import { IconButton } from './IconButton';

type HeaderVariant = 'transparent' | 'elevated' | 'filled';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  variant?: HeaderVariant;
  backgroundColor?: string;
  safeArea?: boolean;
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  centerComponent?: React.ReactNode;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  variant = 'elevated',
  backgroundColor,
  safeArea = true,
  rightComponent,
  leftComponent,
  centerComponent,
  style,
}) => {
  const insets = useSafeAreaInsets();

  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;

    switch (variant) {
      case 'transparent':
        return 'transparent';
      case 'filled':
        return colors.primary;
      default:
        return colors.surface;
    }
  };

  const getTitleColor = () => {
    if (variant === 'filled') return colors.textInverse;
    return colors.text;
  };

  const getSubtitleColor = () => {
    if (variant === 'filled') return colors.textInverse;
    return colors.textSecondary;
  };

  const getIconColor = () => {
    if (variant === 'filled') return colors.textInverse;
    return colors.text;
  };

  return (
    <View
      style={[
        styles.container,
        safeArea && { paddingTop: insets.top },
        {
          backgroundColor: getBackgroundColor(),
        },
        variant === 'elevated' && shadows.sm,
        style,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {leftComponent || (leftIcon && (
            <IconButton
              icon={leftIcon}
              onPress={onLeftPress || (() => {})}
              variant="ghost"
              accessibilityLabel="Go back"
            />
          ))}
        </View>

        <View style={styles.centerSection}>
          {centerComponent || (
            <>
              {title && (
                <Text
                  style={[styles.title, { color: getTitleColor() }]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text
                  style={[styles.subtitle, { color: getSubtitleColor() }]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.rightSection}>
          {rightComponent || (rightIcon && (
            <IconButton
              icon={rightIcon}
              onPress={onRightPress || (() => {})}
              variant="ghost"
              accessibilityLabel="Menu"
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 3,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default Header;
