import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Ellipse, Circle } from 'react-native-svg';

interface PinIconProps {
  size?: number;
}

const PinIcon: React.FC<PinIconProps> = ({ size = 200 }) => {
  const width = size;
  const height = (654 / 510) * size;

  return (
    <Svg
      viewBox="0 0 510 654"
      width={width}
      height={height}
      fill="none"
    >
      <Defs>
        {/* Head Gradient */}
        <LinearGradient id="headGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#B5A7FF" />
          <Stop offset="100%" stopColor="#745AFF" />
        </LinearGradient>

        {/* Foot Gradient */}
        <LinearGradient id="footGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#7C69E5" />
          <Stop offset="100%" stopColor="#5C3EFF" />
        </LinearGradient>
      </Defs>

      {/* FOOT - Shadow Ellipse */}
      <Ellipse
        cx="255"
        cy="410"
        rx="199" // decreased 8%
        ry="177"
        fill="#7C69E5"
        opacity={0.6}
      />

      {/* FOOT - Main Ellipse */}
      <Ellipse
        cx="255"
        cy="380"
        rx="199" // decreased 8%
        ry="177"
        fill="url(#footGradient)"
      />

      {/* BODY - Link Circle */}
      <Circle
        cx="255"
        cy="320"
        r="25"
        fill="#5C3EFF"
      />

      {/* HEAD - Shadow Ellipse */}
      <Ellipse
        cx="255"
        cy="255"
        rx="160"
        ry="132"
        fill="#4A35AA"
        opacity={0.8}
      />

      {/* HEAD - Main Ellipse */}
      <Ellipse
        cx="255"
        cy="210"
        rx="160"
        ry="132"
        fill="url(#headGradient)"
      />
    </Svg>
  );
};

export default PinIcon;
