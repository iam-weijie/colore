import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, View, StyleSheet, PanResponder, Text } from "react-native";
import Circle from "./Circle";
import { PostItColor } from "@/types/type";

// Constant (I don't know where else to put it)
const handleMargin = 6;

interface ColorPickerSliderProps {
  colors: PostItColor[];
  selectedColor: PostItColor;
  onColorSelect: (color: PostItColor) => void;
  height?: number;
  handleSize?: number;
}

// TODO: using `(position as any)._offset` feels hacky. Feel free to fix this.
//  Or simply remove this comment if that's not an issue.

// TODO: Upon color change (while dragging), there is a noticeable lag. It occurs on iPhone SE.
//  It might not necessarily be caused by this component but rather by components that use it,
//  e.g. app/root/new-post.tsx

/**
 * Color picker slider component.
 */
const ColorPickerSlider: React.FC<ColorPickerSliderProps> = ({
  colors,
  selectedColor,
  onColorSelect,
  height = 168,
  handleSize = 30,
}) => {
  const position = useRef(new Animated.Value(0)).current; // Y position relative to top
  const [isDragging, setIsDragging] = useState(false); // Whether the slider is being dragged

  useEffect(() => {
    // If the slider is being dragged, don't update position programmatically
    if (isDragging) return;

    // Check if selected color is valid
    if (!selectedColor || !colors.includes(selectedColor)) {
      throw new Error(`Invalid selected color: ${selectedColor}`);
    }

    // Animate to correct position based on selected color
    const colorPosition =
      ((colors.indexOf(selectedColor) + 0.5) / colors.length) * height;
    Animated.timing(position, {
      toValue: colorPosition - (position as any)._offset,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selectedColor, isDragging]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        position.extractOffset(); // Store current position as offset
        setIsDragging(true);
      },
      onPanResponderMove: (event, gestureState) => {
        let dy = gestureState.dy; // Y displacement since touch start
        let newY = dy + (position as any)._offset; // New Y position

        // Clamp dy and newY to slider bounds
        if (newY < 0) {
          dy = -(position as any)._offset;
          newY = 0;
        } else if (newY > height) {
          dy = height - (position as any)._offset;
          newY = height;
        }

        // Update Y position of the handle (based on y displacement)
        position.setValue(dy);

        // Update selected color (based on new Y position)
        let colorIndex = Math.floor((newY / height) * colors.length);
        if (colorIndex === colors.length) colorIndex = colors.length - 1;
        const newSelectedColor = colors[colorIndex];
        onColorSelect(newSelectedColor);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
    })
  ).current;

  // Generate background from the color array
  const renderColorSegments = () => {
    const segmentHeight = 100 / colors.length;
    return colors.map((color, index) => (
      <View
        key={color.id}
        style={[
          styles.colorSegment,
          {
            backgroundColor: color.hex,
            height: `${segmentHeight}%`,
            top: `${index * segmentHeight}%`,
          },
        ]}
      />
    ));
  };
  const colorSegments = useMemo(() => renderColorSegments(), [colors]);

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.sliderTrack}>{colorSegments}</View>
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateY: position }],
          position: "relative",
          top: -(handleSize / 2) - handleMargin, // Small vertical offset to center the handle
          left: 0,
        }}
      >
        <Circle
          color={selectedColor.hex}
          size={handleSize}
          selected={isDragging}
          style={styles.handle}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    width: 12,
    borderRadius: 6,
    margin: 14,
  },
  sliderTrack: {
    width: "100%",
    height: "100%",
    borderRadius: 5,
    overflow: "hidden",
    position: "absolute",
    top: 0,
    left: 0,
    flexDirection: "column",
    borderWidth: 2,
    borderColor: "white",
  },
  colorSegment: {
    width: "100%",
    position: "absolute",
    left: 0,
  },
  handle: {
    margin: handleMargin,
  },
});

export default ColorPickerSlider;
