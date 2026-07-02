/**
 * Global Text
 * Drop-in replacement for RN's Text that defaults to Zen Maru Gothic,
 * matching the customer app's global `body { font-family }` rule.
 * Any fontFamily set by the caller's style still wins (merged last).
 */

import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { FontFamily } from '../constants/fonts';

export const Text: React.FC<TextProps> = ({ style, ...props }) => (
  <RNText style={[{ fontFamily: FontFamily.regular }, style]} {...props} />
);
