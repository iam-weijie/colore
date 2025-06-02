import React from 'react';
import { View } from 'react-native';

type ProgressBarProps = {
  progress: number; // percentage (0-100)
  height?: number; // height of the progress bar in pixels
  backgroundColor?: string; // background color of the track
  progressColor?: string; // color of the progress indicator
  borderRadius?: number; // border radius for rounded corners
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 3,
  backgroundColor = '#E5E7EB', // default gray-200
  progressColor = '#FBB1F5', // default pink
  borderRadius = 999, // fully rounded
}) => {
  return (
    <View 
      style={{ 
        height,
        borderRadius,
        backgroundColor,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <View
        style={{
          width: `${Math.min(Math.max(progress, 0), 100)}%`, // Clamp between 0-100
          backgroundColor: progressColor,
          height: '100%',
          borderRadius,
        }}
      />
    </View>
  );
};

export default ProgressBar;