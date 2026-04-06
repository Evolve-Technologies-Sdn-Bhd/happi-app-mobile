/**
 * HtmlText – renders HTML as native React Native Text.
 * No external packages. Handles common tags from rich text editors:
 * strong/b, em/i, u, h1-h6, br, p, div, li, ul, ol, span, and HTML entities.
 */

import React from 'react';
import { Text, TextStyle } from 'react-native';

interface Seg {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  headingLevel: number; // 0 = normal, 1-6 = h1–h6
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/gs, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function htmlToSegments(html: string): Seg[] {
  const segs: Seg[] = [];
  let bold = false;
  let italic = false;
  let underline = false;
  let headingLevel = 0;

  const push = (raw: string) => {
    const text = decodeEntities(raw);
    if (text) segs.push({ text, bold, italic, underline, headingLevel });
  };

  // Strip style/script blocks first
  const cleaned = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Tokenise: either a tag or plain text
  const TOKEN = /(<[^>]+>|[^<]+)/g;
  let m: RegExpExecArray | null;

  while ((m = TOKEN.exec(cleaned)) !== null) {
    const token = m[0];

    if (!token.startsWith('<')) {
      push(token);
      continue;
    }

    const closing = token.startsWith('</');
    // strip <, </, > and attributes to get tag name
    const tag = token.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/, '$1').toLowerCase();

    switch (tag) {
      case 'br':
        segs.push({ text: '\n', bold, italic, underline, headingLevel });
        break;
      case 'strong':
      case 'b':
        bold = !closing;
        break;
      case 'em':
      case 'i':
        italic = !closing;
        break;
      case 'u':
        underline = !closing;
        break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        if (!closing) {
          if (segs.length > 0) segs.push({ text: '\n', bold: false, italic: false, underline: false, headingLevel: 0 });
          headingLevel = parseInt(tag[1], 10);
        } else {
          headingLevel = 0;
          segs.push({ text: '\n', bold: false, italic: false, underline: false, headingLevel: 0 });
        }
        break;
      case 'li':
        if (!closing) {
          if (segs.length > 0) segs.push({ text: '\n', bold: false, italic: false, underline: false, headingLevel: 0 });
          push('• ');
        }
        break;
      case 'p':
      case 'div':
      case 'section':
      case 'article':
      case 'blockquote':
      case 'tr':
      case 'ol':
      case 'ul':
        if (!closing && segs.length > 0) {
          segs.push({ text: '\n', bold: false, italic: false, underline: false, headingLevel: 0 });
        } else if (closing) {
          segs.push({ text: '\n', bold: false, italic: false, underline: false, headingLevel: 0 });
        }
        break;
      case 'img':
        // skip — cannot render images inside Text
        break;
      case 'span':
      case 'a':
      case 'label':
      case 'font':
        // inline flow — no structural break, ignore tag itself
        break;
      default:
        break;
    }
  }

  // Collapse consecutive newlines to at most 2
  const collapsed: Seg[] = [];
  let newlineCount = 0;
  for (const seg of segs) {
    if (seg.text === '\n') {
      newlineCount++;
      if (newlineCount <= 2) collapsed.push(seg);
    } else {
      newlineCount = 0;
      collapsed.push(seg);
    }
  }

  // Trim leading/trailing newlines
  while (collapsed.length > 0 && collapsed[0].text.trim() === '') collapsed.shift();
  while (collapsed.length > 0 && collapsed[collapsed.length - 1].text.trim() === '') collapsed.pop();

  return collapsed;
}

interface HtmlTextProps {
  html: string;
  baseStyle?: TextStyle | TextStyle[];
}

export const HtmlText: React.FC<HtmlTextProps> = ({ html, baseStyle }) => {
  if (!html) return null;

  const segs = htmlToSegments(html);

  // If no segments parsed (e.g. input had no text content), render raw stripped
  if (segs.length === 0) {
    const raw = html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (!raw) return null;
    return <Text style={baseStyle}>{raw}</Text>;
  }

  return (
    <Text style={baseStyle}>
      {segs.map((seg, i) => {
        const headingSize = seg.headingLevel
          ? Math.max(14, 22 - (seg.headingLevel - 1) * 2)
          : undefined;

        return (
          <Text
            key={i}
            style={[
              seg.bold || seg.headingLevel > 0 ? ({ fontWeight: '700' } as TextStyle) : undefined,
              seg.italic ? ({ fontStyle: 'italic' } as TextStyle) : undefined,
              seg.underline ? ({ textDecorationLine: 'underline' } as TextStyle) : undefined,
              headingSize ? ({ fontSize: headingSize } as TextStyle) : undefined,
            ]}
          >
            {seg.text}
          </Text>
        );
      })}
    </Text>
  );
};
