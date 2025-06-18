import { allColors } from '@/constants';
import { PostWithPosition } from '@/types/type';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface PositionMarker {
  top: number;  // Absolute position in the scrollable content
  left: number; // Absolute position in the scrollable content
  color: string;
  size?: number;
}

interface ScrollMapProps {
  scrollOffset: { x: number; y: number };
  scrollableDimensions: { width: number; height: number };
  posts?: PostWithPosition[];
  indicator?: {
    color?: string;
    size?: number;
  };
  style?: {
    size?: number;
    backgroundColor?: string;
    borderColor?: string;
  };
}

const ScrollMap: React.FC<ScrollMapProps> = ({
  scrollOffset,
  scrollableDimensions,
  posts = [],
  indicator = {},
  style = {},
}) => {
      const [postMarkers, setPostMarkers] = useState<PositionMarker[]>([]);
      
  // Default values
  const mapSize = style.size || 60;
  const indicatorSize = indicator.size || 10;
  const availableSpace = mapSize - indicatorSize;

  // Calculate position percentages (0-1)
  const calculatePosition = (offset: number, dimension: number) => {
    return Math.min(Math.max(offset / dimension, 0), 1);
  };

  // Main indicator position
  const indicatorX = calculatePosition(scrollOffset.x, scrollableDimensions.width) * availableSpace;
  const indicatorY = calculatePosition(scrollOffset.y, scrollableDimensions.height) * availableSpace;

  useEffect(() => {
  const markers = posts.map((p) => ({
            top: p.position?.top ?? 0,
            left: p.position?.left ?? 0,
            color: allColors.find((c) => c.id == p.color)?.hex ?? "#FFFF00"
          }));

        setPostMarkers(markers)
  }, [posts])

  const showMarkers = posts.length < 25;

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(250)} className="absolute self-center z-[9999]" style={{ top: 20 }}>
      <View 
        className="rounded-full shadow-md"
        style={{
          width: mapSize,
          height: mapSize,
          backgroundColor: 'white',
          position: 'relative',
        }}
      >
        {/* Position markers */}
        {showMarkers && postMarkers.map((marker, index) => {
          const markerX = calculatePosition(marker.left, scrollableDimensions.width) * availableSpace;
          const markerY = calculatePosition(marker.top, scrollableDimensions.height) * availableSpace;
          
          
          return (
            <View
              key={`marker-${index}`}
              className={`rounded-full absolute`}
              style={{
                width: marker.size || indicatorSize * 0.6,
                height: marker.size || indicatorSize * 0.6,
                left: markerX,
                top: markerY,
                backgroundColor: marker.color
              }}
            />
          );
        })}

        {/* Main scroll indicator */}
        <View
          className={`rounded-full absolute border-2 border-white`}
          style={{
            width: indicatorSize,
            height: indicatorSize,
            left: indicatorX,
            top: indicatorY,
            backgroundColor: indicator.color
          }}
        />
      </View>


    </Animated.View>
  );
};

export default ScrollMap;