import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { TextStyle, Format } from '@/types/type';
import { useDraftPost } from "@/app/contexts/DraftPostContext";
import KeyboardOverlay from './KeyboardOverlay';
import RichTextEditor from './RichTextEditor';



const RichTextInput = ({ refresh, exportText, exportStyling, onFocus, withdrawKeyboard = false }: {
  refresh: number;
  exportText: (value: string) => void;
  exportStyling: (styling: Format[]) => void;
  onFocus: (state: boolean) => void;
  withdrawKeyboard: boolean;
}) => {
  const { draftPost } = useDraftPost();
  const [value, setValue] = useState('');
  const [style, setStyle] = useState<TextStyle | null>(null);
  const [formats, setFormats] = useState<Format[]>([]);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isFocused, setIsFocused] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const isOverlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) => {
    return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
  };

  const splitTextByLines = (text: string) => {
    const lines: { line: string; start: number; end: number }[] = [];
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

      // Add left segment if it remains
      if (format.start < selection.start) {
        newFormats.push({ start: format.start, end: selection.start, type: format.type });
      }

      // Add right segment if it remains
      if (format.end > selection.end) {
        newFormats.push({ start: selection.end, end: format.end, type: format.type });
      }
    }

    if (!removedSomething) {
      newFormats.push({ start: selection.start, end: selection.end, type });
    }

    setFormats(cleanInvalidFormats(value, newFormats));
  };

  useEffect(() => {
    setValue(draftPost?.content ?? '');
    setFormats(cleanInvalidFormats(draftPost?.content ?? '', draftPost?.formatting ?? []));
    setIsFocused(true);
  }, [refresh]);

  useEffect(() => {
    if (style) {
      toggleFormat(style);
      setStyle(null); // Reset style after applying
    }
  }, [style]);

  useEffect(() => {
    exportText(value);
    exportStyling(formats);
  }, [value, formats]);

  useEffect(() => {
    onFocus(isFocused);
  }, [isFocused]);

  const getStyleClass = (types: TextStyle[]) => {
    let classNames = 'text-[#FAFAFA] leading-[32px]';

    if (types.includes('h1')) classNames += ' text-[36px] font-bold';
    else if (types.includes('h2')) classNames += ' text-[32px] font-bold';
    else if (types.includes('h3')) classNames += ' text-[28px] font-semibold';
    else classNames += ' text-[24px]';

    if (types.includes('italic')) classNames += ' font-JakartaSemiBoldItalic';
    else if (types.includes('bold')) classNames += ' font-JakartaBold';
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

      const lineStyles = [];
      for (let i = start; i < start + line.length; i++) {
        if (charStyles[i]) {
          lineStyles.push(...charStyles[i]);
        }
      }

      const hasUnordered = lineStyles.includes('unordered');
      const hasOrdered = lineStyles.includes('ordered');

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
            autoFocus
            placeholder="Type here..."
            placeholderTextColor="#F1F1F1"
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
            <Text className="font-JakartaSemiBold text-[#FAFAFA]">
              {renderStyledOverlay()}
            </Text>

            {!value.length && <View className='absolute top-0 left-0 right-0 p-4'>
              <Text className='font-JakartaSemiBold text-2xl  text-[#EEEEEE]'>
                Tap to start writing a notes...
              </Text>
            </View>}
          </TouchableOpacity>
        )}
      </View>
      {isFocused && (
        <KeyboardOverlay keyboardAlreadyVisible={true} onFocus={isFocused} withdraw={withdrawKeyboard}>
          <RichTextEditor handleApplyStyle={(styling: TextStyle) => setStyle(styling)} />
        </KeyboardOverlay>
      )}
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
