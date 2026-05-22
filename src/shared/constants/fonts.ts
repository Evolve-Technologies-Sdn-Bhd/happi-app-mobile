/**
 * Font Constants
 * Zen Maru Gothic font family configuration
 */

// Font family names (must match the loaded font keys)
export const FontFamily = {
  light: 'ZenMaruGothic_300Light',
  regular: 'ZenMaruGothic_400Regular',
  medium: 'ZenMaruGothic_500Medium',
  bold: 'ZenMaruGothic_700Bold',
  black: 'ZenMaruGothic_900Black',
  // Inter – used for numeric accent text (e.g. multiplier circles)
  inter: 'Inter_400Regular',
  inter700: 'Inter_700Bold',
} as const;

// Default font for the app
export const DefaultFont = FontFamily.regular;

// Font styles for common text types
export const FontStyles = {
  // Headings
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 28,
  },
  h4: {
    fontFamily: FontFamily.medium,
    fontSize: 18,
    lineHeight: 26,
  },
  
  // Body text
  bodyLarge: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  
  // Labels and buttons
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  labelSmall: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonSmall: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Caption and helper text
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  helper: {
    fontFamily: FontFamily.light,
    fontSize: 11,
    lineHeight: 14,
  },
} as const;
