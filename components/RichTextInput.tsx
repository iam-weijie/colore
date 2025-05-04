import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { TextStyle, Format } from '@/types/type';
import { useGlobalContext } from '@/app/globalcontext';

const RichTextInput = ({
  refresh,
  style,
  exportText,
  exportStyling,
}: {
  refresh: number;
  style: TextStyle;
  exportText: (value: string) => void;
  exportStyling: (styling: Format[]) => void;
}) => {
  const { draftPost } = useGlobalContext();
  const [value, setValue] = useState('');
  const [formats, setFormats] = useState<Format[]>([]);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isFocused, setIsFocused] = useState(false);
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

  const loadFormatting = (formatting: Format[]) => {
    for (const format in formatting) {
      toggleFormat
    }
  }
  const toggleFormat = (type: TextStyle) => {
    if (selection.start === selection.end) return;

    const newFormats: Format[] = [];
    let removedSomething = false;

    for (const format of formats) {
      const overlap = isOverlap(selection.start, selection.end, format.start, format.end);
      const sameType = format.type === type;

      if (!overlap || !sameType) {
        newFormats.push(format);
        continue;
      }

      removedSomething = true;

      if (format.start < selection.start) {
        newFormats.push({ start: format.start, end: selection.start, type: format.type });
      }

      if (format.end > selection.end) {
        newFormats.push({ start: selection.end, end: format.end, type: format.type });
      }
    }

    if (!removedSomething) {
      newFormats.push({ start: selection.start, end: selection.end, type });
    }

    setFormats(newFormats);
  };

  useEffect(() => {
    setValue(draftPost.content ?? '');
    setFormats(draftPost.formatting ?? [])




    console.log("formatting: ", draftPost.formatting, formats)
  }, []);

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
        <Text key={`line-${lineIdx}`} className="flex-row flex-wrap text-base text-neutral-800 pl-2">
          {prefix && <Text className="text-neutral-500 font-semibold">{prefix}</Text>}
          {lineChunks}
          {'\n'}
        </Text>
      );
    });

    return chunks;
  };

  return (
    <View className="flex-1 mx-4 pr-12 py-6">
      <View className="relative min-h-[250px] mb-4">
        {isFocused ? (
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={setValue}
            multiline
            placeholder="Type here..."
            placeholderTextColor="#E1E1E1"
            onSelectionChange={({ nativeEvent }) => setSelection(nativeEvent.selection)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
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
            <Text className="font-JakartaSemiBold">
              {renderStyledOverlay()}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default RichTextInput;
