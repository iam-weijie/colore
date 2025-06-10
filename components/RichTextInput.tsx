import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { TextStyle, Format } from '@/types/type';
import { useGlobalContext } from '@/app/globalcontext';

const getMarkdownTags = (type: TextStyle) => {
  switch (type) {
    case 'bold': return ['**', '**'];
    case 'italic': return ['*', '*'];
    case 'h1': return ['# ', ''];
    case 'h2': return ['## ', ''];
    case 'h3': return ['### ', ''];
    case 'underline': return ['<u>', '</u>'];
    case 'ordered': return ['1. ', ''];
    case 'unordered': return ['- ', ''];
    default: return ['', ''];
  }
};

const getMarkdownOffset = (formats: Format[], selection: { start: number; end: number }) => {
  let offsetStart = 0;
  let offsetEnd = 0;

  formats.forEach(({ start, end, type }) => {
    const [prefix, suffix] = getMarkdownTags(type);
    const prefixLength = prefix.length;
    const suffixLength = suffix.length;

    if (start <= selection.start) offsetStart += prefixLength;
    if (start <= selection.end) offsetEnd += prefixLength;
    if (end <= selection.start) offsetStart += suffixLength;
    if (end <= selection.end) offsetEnd += suffixLength;
  });

  return {
    start: selection.start - offsetStart,
    end: selection.end - offsetEnd,
  };
};

const applyMarkdown = (text: string, formats: Format[]) => {
  const sortedFormats = [...formats].sort((a, b) => b.start - a.start);

  for (const format of sortedFormats) {
    const [prefix, suffix] = getMarkdownTags(format.type);
    const { start, end } = format;

    const before = text.slice(0, start);
    const inside = text.slice(start, end);
    const after = text.slice(end);

    text = before + prefix + inside + suffix + after;
  }

  return text;
};

export const stripMarkdown = (text: string) => {
  return text
    .replace(/^###\s/gm, '')
    .replace(/^##\s/gm, '')
    .replace(/^#\s/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/<u>(.*?)<\/u>/g, '$1')
    .replace(/^1\.\s/gm, '')
    .replace(/^-\s?/gm, '');
};

const RichTextInput = ({ refresh, style, exportText, exportStyling, onFocus }: {
  refresh: number;
  style: TextStyle;
  exportText: (value: string) => void;
  exportStyling: (styling: Format[]) => void;
  onFocus: (state: boolean) => void;
}) => {
  const { draftPost } = useGlobalContext();
  const [value, setValue] = useState('');
  const [formats, setFormats] = useState<Format[]>([]);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isFocused, setIsFocused] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const isOverlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) => {
    return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
  };

  const splitTextByLines = (text: string) => {
    const lines = [];
    let index = 0;

    text.split('\n').forEach((lineText) => {
      const lineLength = lineText.length + 1;
      lines.push({ line: lineText, start: index, end: index + lineText.length });
      index += lineLength;
    });

    return lines;
  };

  const cleanInvalidFormats = (text: string, inputFormats: Format[]) => {
    return inputFormats.filter(({ start, end }) => end <= text.length);
  };

  const correctMarkdownFromFormats = (rawText: string, cleanFormats: Format[]) => {
    const noMdText = stripMarkdown(rawText);
    return applyMarkdown(noMdText, cleanFormats);
  };

const toggleFormat = (type: TextStyle) => {
  if (selection.start === selection.end) return;

  const newFormats: Format[] = [];
  let removedSomething = false;
  const correctedSelection = getMarkdownOffset(formats, selection);

  for (const format of formats) {
    const overlap = isOverlap(correctedSelection.start, correctedSelection.end, format.start, format.end);
    const sameType = format.type === type;

    if (!overlap || !sameType) {
      newFormats.push(format);
      continue;
    }

    removedSomething = true;

    // Add left segment if it remains
    if (format.start < correctedSelection.start) {
      newFormats.push({ start: format.start, end: correctedSelection.start, type: format.type });
    }

    // Add right segment if it remains
    if (format.end > correctedSelection.end) {
      newFormats.push({ start: correctedSelection.end, end: format.end, type: format.type });
    }
  }

  if (!removedSomething) {
    newFormats.push({ start: correctedSelection.start, end: correctedSelection.end, type });
  }

  setFormats(cleanInvalidFormats(value, newFormats));
};


  useEffect(() => {
    setValue(draftPost.content ?? '');
    setFormats(cleanInvalidFormats(draftPost.content ?? '', draftPost.formatting ?? []));
    setIsFocused(true);
  }, [refresh]);

  useEffect(() => {
    toggleFormat(style);
  }, [style, refresh]);

  useEffect(() => {
    exportText(value);
    exportStyling(formats);
  }, [value, formats]);

  const getStyleClass = (types: TextStyle[]) => {
    let classNames = 'text-[#FAFAFA] leading-[32px]';

    if (types.includes('h1')) classNames += ' text-[36px] font-bold';
    else if (types.includes('h2')) classNames += ' text-[32px] font-bold';
    else if (types.includes('h3')) classNames += ' text-[28px] font-semibold';
    else classNames += ' text-[24px]';

    if (types.includes('italic')) classNames += ' font-JakartaSemiBoldItalic';
    else if (types.includes('bold')) classNames += ' font-JakartaExtraBold';
    else classNames += ' font-JakartaSemiBold';

    if (types.includes('underline')) classNames += ' underline';
    if (types.includes('unordered') || types.includes('ordered')) classNames += ' pl-6';

    return classNames;
  };

  const getStylesByChar = () => {
    const charMap: { [index: number]: TextStyle[] } = {};
    formats.forEach(({ start, end, type }) => {
      for (let i = start; i < end; i++) {
        if (!charMap[i]) charMap[i] = [];
        charMap[i].push(type);
      }
    });
    return charMap;
  };

  const renderStyledOverlay = () => {
    const charStyles = getStylesByChar();
    const lines = splitTextByLines(value);
    const chunks: JSX.Element[] = [];
    let orderedCount = 1;

    lines.forEach(({ line, start }, lineIdx) => {
      const lineChunks: JSX.Element[] = [];
      let buffer = '';
      let prevStyle = getStyleClass([]);

      for (let i = 0; i <= line.length; i++) {
        const charIndex = start + i;
        const currentStyle = getStyleClass(charStyles[charIndex] || []);
        const char = line[i] || '';

        if (currentStyle !== prevStyle || i === line.length) {
          if (buffer) {
            lineChunks.push(
              <Text key={`line-${lineIdx}-chunk-${i}`} className={prevStyle}>
                {buffer}
              </Text>
            );
            buffer = '';
          }
          prevStyle = currentStyle;
        }

        buffer += char;
      }

      const stylesInLine = Object.values(charStyles)
        .flat()
        .filter((s) => s === 'unordered' || s === 'ordered');

      const hasUnordered = stylesInLine.includes('unordered');
      const hasOrdered = stylesInLine.includes('ordered');

      let prefix = '';
      if (hasUnordered) prefix = '• ';
      if (hasOrdered) prefix = `${orderedCount++}. `;

      chunks.push(
        <Text key={`line-${lineIdx}`} className="flex-row flex-wrap text-[24px] text-[#FAFAFA] font-JakartaSemiBold pl-2">
          {prefix && <Text className="text-[#FAFAFA] font-JakartaSemiBold">{prefix}</Text>}
          {lineChunks}
          {'\n'}
        </Text>
      );
    });

    return chunks;
  };

  return (
    <View className="flex-1 mx-4 pr-12 py-8">
      <View className="relative min-h-[250px] mb-4">
        {isFocused ? (
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={(newText) => {
              const cleanedFormats = cleanInvalidFormats(newText, formats);
              setValue(newText);
              setFormats(cleanedFormats);
            }}
            multiline
            placeholder="Type here..."
            placeholderTextColor="#F1F1F1"
            onSelectionChange={({ nativeEvent }) => setSelection(nativeEvent.selection)}
            onFocus={() => {
              const corrected = correctMarkdownFromFormats(value, formats);
              setValue(corrected);
              setIsFocused(true);
              onFocus(isFocused)
            }}
            onBlur={() => {
              const plainText = stripMarkdown(value);
              setValue(plainText);
              onFocus(!isFocused)
              setIsFocused(false);
            }}
            className="font-JakartaSemiBold"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              color: '#FAFAFA',
              padding: 16,
              fontSize: 24,
              lineHeight: 32,
            }}
            selectionColor="rgba(237, 237, 237, 0.75)"
          />
        ) : (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setIsFocused(true);
              setTimeout(() => inputRef.current?.focus(), 10);
            }}
            className="absolute top-0 left-0 right-0 p-4"
          >
            <Text className="font-JakartaSemiBold text-[#FAFAFA]">
              {renderStyledOverlay()}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};



export const RichText = ({
  formatStyling,
  content,
}: {
  formatStyling: Format[];
  content: string;
}) => {
  const [value, setValue] = useState("");
  const [formats, setFormats] = useState<Format[]>([]);

  useEffect(() => {
    setValue(content);
    setFormats(formatStyling);
  }, [content, formatStyling]);

  const getStyleClass = (types: TextStyle[]) => {
    let classNames = 'text-black';

    if (types.includes('h1')) classNames += ' text-[24px] font-JakartaBold';
    else if (types.includes('h2')) classNames += ' text-[20px] font-JakartaBold';
    else if (types.includes('h3')) classNames += ' text-[18px] font-JakartaSemiBold';
    else classNames += ' text-[16px]';

    if (types.includes('italic')) classNames += ' font-JakartaSemiBoldItalic';
    else if (types.includes('bold')) classNames += ' font-JakartaBold';
    else classNames += ' font-Jakarta';

    if (types.includes('underline')) classNames += ' underline';
    if (types.includes('unordered') || types.includes('ordered')) classNames += ' pl-6';

    return classNames;
  };

  const getStylesByChar = () => {
    const charMap: { [index: number]: TextStyle[] } = {};
    formats.forEach(({ start, end, type }) => {
      for (let i = start; i < end; i++) {
        if (!charMap[i]) charMap[i] = [];
        charMap[i].push(type);
      }
    });
    return charMap;
  };

  const renderStyledOverlay = () => {
    const charStyles = getStylesByChar();
    const chunks: JSX.Element[] = [];
    let buffer = '';
    let prevStyle = getStyleClass([]);

    for (let i = 0; i <= value.length; i++) {
      const currentStyle = getStyleClass(charStyles[i] || []);
      const char = value[i] || '';

      if (currentStyle !== prevStyle || i === value.length) {
        if (buffer) {
          chunks.push(
            <Text key={`chunk-${i}`} className={prevStyle}>
              {buffer}
            </Text>
          );
          buffer = '';
        }
        prevStyle = currentStyle;
      }

      buffer += char;
    }

    return chunks;
  };

  return (
    <View className="flex-1">
      <Text className="font-Jakarta text-black my-4 p-1">
        {renderStyledOverlay()}
      </Text>
    </View>
  );
};

export default RichTextInput;
