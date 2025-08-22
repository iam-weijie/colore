import { allColors } from '@/constants';
import { PostWithPosition } from '@/types/type';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface PositionMarker {
  top: number; // Absolute position in the scrollable content
  left: number; // Absolute position in the scrollable content
  color: string;
  size?: number;
}

interface ScrollMapProps {
  scrollOffset: { x: number; y: number };
  scrollableDimensions: { width: number; height: number };
  posts?: PostWithPosition[];
  zoomScale?: number;
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
  zoomScale = 1,
  indicator = {},
  style = {},
}) => {
  const [postMarkers, setPostMarkers] = useState<PositionMarker[]>([]);
  
  // Map size (keep relatively stable, slight adjustment for zoom)
  const baseMapSize = style.size || 60;
  const dynamicMapSize = Math.round(baseMapSize * (0.9 + zoomScale * 0.1));
  
  // Indicator size
  const indicatorSize = indicator.size || 10;
  const availableSpace = dynamicMapSize - indicatorSize;
  
  // Key fix: Calculate the actual content dimensions when zoomed
  const zoomedContentWidth = scrollableDimensions.width * zoomScale;
  const zoomedContentHeight = scrollableDimensions.height * zoomScale;
  
  // Calculate position percentages using zoomed dimensions
  const calculatePosition = (offset: number, zoomedDimension: number) => {
    return Math.min(Math.max(offset / zoomedDimension, 0), 1);
  };
  
  // Main indicator position using zoomed content dimensions
  const indicatorX = calculatePosition(scrollOffset.x, zoomedContentWidth) * availableSpace;
  const indicatorY = calculatePosition(scrollOffset.y, zoomedContentHeight) * availableSpace;
  
  useEffect(() => {
    const markers = posts.map((p) => ({
      top: p.position?.top ?? 0,
      left: p.position?.left ?? 0,
      color: allColors.find((c) => c.id == p.color)?.hex ?? "#FFFF00"
    }));
    setPostMarkers(markers);
  }, [posts]);
  
  // Show markers logic
  const showMarkers = posts.length < 25;
  
  return (
    <Animated.View 
      entering={FadeIn.duration(200)} 
      exiting={FadeOut.duration(250)} 
      className="absolute self-center z-[9999]" 
      style={{ top: 20 }}
    >
      <View
        className="rounded-full shadow-md"
        style={{
          width: dynamicMapSize,
          height: dynamicMapSize,
          backgroundColor: style.backgroundColor || 'white',
          position: 'relative',
        }}
      >
        {/* Position markers */}
        {showMarkers && postMarkers.map((marker, index) => {
          // Key fix: Scale marker positions by zoom and then calculate percentage
          const scaledMarkerLeft = marker.left * zoomScale;
          const scaledMarkerTop = marker.top * zoomScale;
          
          const markerX = calculatePosition(scaledMarkerLeft, zoomedContentWidth) * availableSpace;
          const markerY = calculatePosition(scaledMarkerTop, zoomedContentHeight) * availableSpace;
          
          // Marker size
          const markerSize = Math.max(4, Math.min(12, indicatorSize * 0.6));
          
          return (
            <View
              key={`marker-${index}`}
              className="rounded-full absolute"
              style={{
                width: marker.size || markerSize,
                height: marker.size || markerSize,
                left: markerX,
                top: markerY,
                backgroundColor: marker.color,
                opacity: 0.8,
              }}
            />
          );
        })}
        
        {/* Main scroll indicator */}
        <View
          className="rounded-full absolute border-2"
          style={{
            width: indicatorSize,
            height: indicatorSize,
            left: indicatorX,
            top: indicatorY,
            backgroundColor: indicator.color || 'rgba(59, 130, 246, 0.8)',
            borderColor: 'white',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 3,
          }}
        />
        
        {/* Debug zoom level indicator */}
        {zoomScale !== 1 && (
          <View
            className="absolute bottom-1 right-1"
            style={{
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: 8,
              paddingHorizontal: 4,
              paddingVertical: 1,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 8,
                fontWeight: '500',
              }}
            >
              {zoomScale.toFixed(1)}x
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export default ScrollMap;