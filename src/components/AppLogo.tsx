import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

interface AppLogoProps {
  size?: number;
}

export function AppLogo({ size = 64 }: AppLogoProps) {
  const w = size;
  const h = Math.round(size * 1.2);

  return (
    <Svg width={w} height={h} viewBox="0 0 100 120">
      {/* Drop shadow layer */}
      <Path
        d="M12,10 L74,10 L93,31 L93,114 L12,114 Z"
        fill="rgba(0,0,0,0.07)"
      />
      {/* Page body */}
      <Path
        d="M10,8 L72,8 L91,29 L91,112 L10,112 Z"
        fill="#FAF8F5"
        stroke="#D5CFC8"
        strokeWidth="1.5"
      />
      {/* Dog-ear fold fill */}
      <Path
        d="M72,8 L91,29 L72,29 Z"
        fill="#C97B4B"
        opacity="0.85"
      />
      {/* Dog-ear fold inner crease */}
      <Path
        d="M72,8 L91,29"
        stroke="#A85F34"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Text line 1 — title */}
      <Line x1="21" y1="48" x2="81" y2="48" stroke="#C97B4B" strokeWidth="3.5" strokeLinecap="round" />
      {/* Text lines — body */}
      <Line x1="21" y1="63" x2="81" y2="63" stroke="#9B9189" strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="21" y1="76" x2="81" y2="76" stroke="#9B9189" strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="21" y1="89" x2="60" y2="89" stroke="#9B9189" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}
