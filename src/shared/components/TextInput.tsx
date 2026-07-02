/**
 * Global TextInput
 * Drop-in replacement for RN's TextInput that defaults to Zen Maru Gothic,
 * matching the customer app's global `body { font-family }` rule.
 * Any fontFamily set by the caller's style still wins (merged last).
 *
 * Not used by screens that need `TextInput` as a ref-instance type
 * (e.g. `useRef<TextInput>`/`forwardRef<TextInput, ...>`) — those keep
 * importing the real RN TextInput and set fontFamily on their own styles.
 */

import React, { forwardRef } from 'react';
import { TextInput as RNTextInput, TextInputProps } from 'react-native';
import { FontFamily } from '../constants/fonts';

export const TextInput = forwardRef<RNTextInput, TextInputProps>(({ style, ...props }, ref) => (
  <RNTextInput ref={ref} style={[{ fontFamily: FontFamily.regular }, style]} {...props} />
));

TextInput.displayName = 'TextInput';
