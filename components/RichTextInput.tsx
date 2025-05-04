import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { TextStyle } from '@/types/type';


interface Format {
  start: number;
  end: number;
  type: TextStyle;
}

const RichTextEditor = ({ style } : {style: TextStyle}) => {
  const [value, setValue] = useState('');
  const [formats, setFormats] = useState<Format[]>([]);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef<TextInput>(null);

  const toggleFormat = (type: TextStyle) => {
    if (selection.start === selection.end) return;

  const newFormats: Format[] = [];
  let isRemoving = false;

  for (const format of formats) {
    const isWithin = selection.start >= format.start && selection.end <= format.end;
    const isSameType = format.type === type;

    // If this format exactly matches the range and type → remove it
    if (isWithin && isSameType) {
      isRemoving = true;
      continue; // skip adding it
    }

    newFormats.push(format);
  }

  if (!isRemoving) {
    // If no existing format was removed, then add it
    newFormats.push({
      start: selection.start,
      end: selection.end,
      type,
    });
  }

  setFormats(newFormats);
  };

  useEffect(() => {
    toggleFormat(style)
  }, [style])
  const getStyleClass = (types: TextStyle[]) => {
    let classNames = 'text-base text-[#FAFAFA] font-JakartaSemiBold text-[24px] leading-[32px]';
    if (types.includes('bold')) classNames += ' font-JakartaExtraBold';
    if (types.includes('italic')) classNames += ' font-JakartaSemiBoldItalic';
    if (types.includes('underline')) classNames += ' underline';
    if (types.includes('h1')) classNames += ' text-3xl font-bold';
    if (types.includes('h2')) classNames += ' text-2xl font-bold';
    if (types.includes('h3')) classNames += ' text-xl font-semibold';
    return classNames;
  };

  const getStylesByChar = (): { [index: number]: TextStyle[] } => {
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
    let prevStyle: string = getStyleClass([]);

    for (let i = 0; i <= value.length; i++) {
      const currentStyle = getStyleClass(charStyles[i] || []);
      const char = value[i] || '';

      if (currentStyle !== prevStyle || i === value.length) {
        if (buffer) {
          chunks.push(
            <Text key={i} className={prevStyle}>
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
    <View className="flex-1 mx-4 pr-12 py-6">
      <View className="relative min-h-[250px] border border-neutral-300 rounded-2xl mb-4">
        {/* Styled Overlay */}
        <Text
          className="absolute top-0 left-0 right-0 p-4 font-JakartaSemiBold  text-transparent"
          pointerEvents="none"
          selectable={false}
        >
          {renderStyledOverlay()}
        </Text>

        {/* Real TextInput */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={setValue}
          multiline
          placeholder='Type here...'
          placeholderTextColor="#E1E1E1"
          onSelectionChange={({ nativeEvent }) => setSelection(nativeEvent.selection)}
          className="font-JakartaSemiBold "
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            color: 'rgba(0,0,0,0)',
            padding: 16,
            fontSize: 24,
            lineHeight: 32,
          }}
          selectionColor="rgba(237, 237, 237, 0.75)"
        />
      </View>

      {/* Formatting Toolbar 
      <View className="flex-row flex-wrap gap-2">
        {['bold', 'italic', 'underline', 'highlight', 'h1', 'h2', 'h3'].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => applyFormat(type as TextStyle)}
            className="px-3 py-2 rounded-xl bg-neutral-100"
          >
            <Text className="text-sm font-semibold text-neutral-700">{type.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      */}
    </View>
  );
};

export default RichTextEditor;
