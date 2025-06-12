import React from 'react';
import { View, Text } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Polygon,
  Line,
  Path,
  G,
  Text as SvgText,
} from 'react-native-svg';

interface RadarChartProps {
  size?: number;
  blueProgress: number;   // 0 to 100
  yellowProgress: number; // 0 to 100
  pinkProgress: number;   // 0 to 100
}

const RadarChart: React.FC<RadarChartProps> = ({
  size = 240,
  blueProgress,
  yellowProgress,
  pinkProgress,
}) => {
  const center = size / 2;
  const radius = size * 0.35;

  const normalize = (value: number) => Math.max(0, Math.min(1, value / 100));

  const getPoint = (value: number, angleDeg: number) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const scaled = radius * normalize(value);
    return {
      x: center + scaled * Math.cos(angleRad),
      y: center - scaled * Math.sin(angleRad),
    };
  };

  const getGridPoints = (percentage: number) => {
    return [
      getPoint(percentage, 90),
      getPoint(percentage, 210),
      getPoint(percentage, 330),
    ];
  };

  const buildPolygonPoints = (pts: any[]) =>
    pts.map((p) => `${p.x},${p.y}`).join(" ");

  const p1 = getPoint(blueProgress, 90);
  const p2 = getPoint(yellowProgress, 210);
  const p3 = getPoint(pinkProgress, 330);

  const curve = (pA: any, pB: any, pC: any) => {
    return `
      M ${pA.x} ${pA.y}
      Q ${(pA.x + pB.x) / 2} ${(pA.y + pB.y) / 2}, ${pB.x} ${pB.y}
      Q ${(pB.x + pC.x) / 2} ${(pB.y + pC.y) / 2}, ${pC.x} ${pC.y}
      Q ${(pC.x + pA.x) / 2} ${(pC.y + pA.y) / 2}, ${pA.x} ${pA.y}
      Z
    `;
  };

  // Calculate dynamic RGB fill color
  const r = Math.round(normalize(pinkProgress) * 255);   // Pink = Red
  const g = Math.round(normalize(yellowProgress) * 255); // Yellow = Green
  const b = Math.round(normalize(blueProgress) * 255);   // Blue = Blue
  const fillColor = `rgba(${r}, ${g}, ${b}, 0.5)`;

  return (
    <View className="items-center justify-center">
      <Svg width={size} height={size}>

        <G>

          {/* Grid lines */}
          {[33, 66].map((val) => (
            <Polygon
              key={val}
              points={buildPolygonPoints(getGridPoints(val))}
              stroke="#e5e7eb"
              strokeWidth="1"
              fill="none"
            />
          ))}

          {/* Axes */}
          <Line x1={center} y1={center} x2={getPoint(100, 90).x} y2={getPoint(100, 90).y} stroke="#d1d5db" />
          <Line x1={center} y1={center} x2={getPoint(100, 210).x} y2={getPoint(100, 210).y} stroke="#d1d5db" />
          <Line x1={center} y1={center} x2={getPoint(100, 330).x} y2={getPoint(100, 330).y} stroke="#d1d5db" />

          {/* Outer triangle border - black and 20% thinner */}
          <Polygon
            points={buildPolygonPoints(getGridPoints(100))}
            stroke="#00000088"
            strokeWidth="1"
            fill="none"
          />

          {/* Rounded filled shape with dynamic RGB color */}
          <Path
            d={curve(p1, p2, p3)}
            fill={fillColor}
            stroke={fillColor}
            strokeWidth="4"
          />

          {/* Axis labels */}
          <SvgText
            x={getPoint(100, 90).x}
            y={getPoint(100, 90).y - 8}
            fontSize="12"
            fontWeight="bold"
            fill="#60a5fa"
            textAnchor="middle"
          >
            S
          </SvgText>
          <SvgText
            x={getPoint(100, 210).x - 4}
            y={getPoint(100, 210).y + 14}
            fontSize="12"
            fontWeight="bold"
            fill="#facc15"
            textAnchor="middle"
          >
            B
          </SvgText>
          <SvgText
            x={getPoint(100, 330).x + 4}
            y={getPoint(100, 330).y + 14}
            fontSize="12"
            fontWeight="bold"
            fill="#f472c1"
            textAnchor="middle"
          >
            R
          </SvgText>
        </G>
      </Svg>
    </View>
  );
};

export default RadarChart;
