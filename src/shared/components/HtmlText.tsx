/**
 * HtmlText – renders HTML using react-native-render-html.
 * Handles proper bullet/list alignment, spacing, bold, italic, headings, etc.
 */

import React from 'react';
import { TextStyle, useWindowDimensions } from 'react-native';
import RenderHtml, { MixedStyleDeclaration } from 'react-native-render-html';
import { FontFamily } from '../constants/fonts';

interface HtmlTextProps {
  html: string;
  baseStyle?: TextStyle | TextStyle[];
}

export const HtmlText: React.FC<HtmlTextProps> = ({ html, baseStyle }) => {
  const { width } = useWindowDimensions();
  if (!html) return null;

  // Flatten array of styles into a single object; caller-provided fontFamily wins
  const flatBase: MixedStyleDeclaration = {
    fontFamily: FontFamily.regular,
    ...(Array.isArray(baseStyle) ? Object.assign({}, ...baseStyle) : baseStyle ?? {}),
  };

  return (
    <RenderHtml
      contentWidth={width}
      source={{ html }}
      baseStyle={flatBase}
      tagsStyles={{
        p:   { marginTop: 0, marginBottom: 6 },
        ul:  { marginTop: 0, marginBottom: 6, paddingLeft: 0 },
        ol:  { marginTop: 0, marginBottom: 6, paddingLeft: 0 },
        li:  { marginBottom: 4 },
        h1:  { fontFamily: FontFamily.bold, fontSize: 20, fontWeight: '700', marginBottom: 8 },
        h2:  { fontFamily: FontFamily.bold, fontSize: 18, fontWeight: '700', marginBottom: 6 },
        h3:  { fontFamily: FontFamily.bold, fontSize: 16, fontWeight: '700', marginBottom: 4 },
        h4:  { fontFamily: FontFamily.bold, fontSize: 15, fontWeight: '700', marginBottom: 4 },
        h5:  { fontFamily: FontFamily.bold, fontSize: 14, fontWeight: '700', marginBottom: 4 },
        h6:  { fontFamily: FontFamily.bold, fontSize: 13, fontWeight: '700', marginBottom: 4 },
      }}
      enableExperimentalMarginCollapsing
    />
  );
};
