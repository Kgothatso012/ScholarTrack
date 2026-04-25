import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, typography, spacing } from '../theme';
import { getTheme } from '../theme';

type AvatarSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
type AvatarShape = 'circle' | 'rounded' | 'square';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  backgroundColor?: string;
  textColor?: string;
  badge?: boolean;
  badgeColor?: string;
  style?: ViewStyle;
  testID?: string;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getSizeValue = (size: AvatarSize): number => {
  switch (size) {
    case 'xsmall':
      return 28;
    case 'small':
      return 36;
    case 'medium':
      return 48;
    case 'large':
      return 64;
    case 'xlarge':
      return 96;
    default:
      return 48;
  }
};

const getFontSize = (size: AvatarSize): number => {
  switch (size) {
    case 'xsmall':
      return 10;
    case 'small':
      return 12;
    case 'medium':
      return 16;
    case 'large':
      return 22;
    case 'xlarge':
      return 32;
    default:
      return 16;
  }
};

const getShapeRadius = (shape: AvatarShape): number => {
  switch (shape) {
    case 'circle':
      return 9999;
    case 'rounded':
      return borderRadius.lg;
    default:
      return borderRadius.sm;
  }
};

const stringToColor = (str: string): string => {
  const C = getTheme('dark').colors;
  const palette = [
    C.primary,
    C.accent,
    C.secondary,
    C.success,
    C.warning,
    C.error,
    C.cyan,
    C.info,
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return palette[Math.abs(hash) % palette.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = '',
  size = 'medium',
  shape = 'circle',
  backgroundColor,
  textColor,
  badge = false,
  badgeColor = colors.success,
  style,
  testID,
}) => {
  const sizeValue = getSizeValue(size);
  const fontSize = getFontSize(size);
  const borderRadiusValue = getShapeRadius(shape);
  const bgColor = backgroundColor || stringToColor(name || 'User');
  const txtColor = textColor || colors.textInverse;

  const content = uri ? (
    <Image
      source={{ uri }}
      style={[
        styles(colors).image,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: borderRadiusValue,
        },
      ]}
    />
  ) : (
    <View
      style={[
        styles(colors).placeholder,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: borderRadiusValue,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text style={[styles(colors).initials, { fontSize, color: txtColor }]}>
        {getInitials(name || 'U')}
      </Text>
    </View>
  );

  return (
    <View
      style={[styles(colors).container, { width: sizeValue, height: sizeValue }, style]}
      testID={testID}
    >
      {content}
      {badge && (
        <View
          style={[
            styles(colors).badge,
            {
              backgroundColor: badgeColor,
              width: sizeValue * 0.28,
              height: sizeValue * 0.28,
              borderRadius: sizeValue * 0.14,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = (colors: typeof import('../theme').colors) => StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: colors.card,
  },
});

export default Avatar;
