import React from 'react';
import {
  IconBooks, IconStar, IconHeart, IconBookmark, IconArchive,
  IconCode, IconCamera, IconMusic, IconGlobe, IconLeaf,
  IconHome, IconCoffee, IconPencil, IconRocket, IconTrophy,
  IconMovie, IconPlane, IconBriefcase, IconPalette, IconFlask,
} from '@tabler/icons-react-native';

type IconComponent = React.ComponentType<{
  size: number;
  color: string;
  strokeWidth?: number;
}>;

export const SHELF_ICONS: Array<{ key: string; Icon: IconComponent }> = [
  { key: 'books',     Icon: IconBooks },
  { key: 'star',      Icon: IconStar },
  { key: 'heart',     Icon: IconHeart },
  { key: 'bookmark',  Icon: IconBookmark },
  { key: 'archive',   Icon: IconArchive },
  { key: 'code',      Icon: IconCode },
  { key: 'camera',    Icon: IconCamera },
  { key: 'music',     Icon: IconMusic },
  { key: 'globe',     Icon: IconGlobe },
  { key: 'leaf',      Icon: IconLeaf },
  { key: 'home',      Icon: IconHome },
  { key: 'coffee',    Icon: IconCoffee },
  { key: 'pencil',    Icon: IconPencil },
  { key: 'rocket',    Icon: IconRocket },
  { key: 'trophy',    Icon: IconTrophy },
  { key: 'film',      Icon: IconMovie },
  { key: 'plane',     Icon: IconPlane },
  { key: 'briefcase', Icon: IconBriefcase },
  { key: 'palette',   Icon: IconPalette },
  { key: 'flask',     Icon: IconFlask },
];

const ICON_MAP: Record<string, IconComponent> = Object.fromEntries(
  SHELF_ICONS.map(({ key, Icon }) => [key, Icon])
);

interface ShelfIconProps {
  iconKey: string;
  size: number;
  color: string;
  strokeWidth?: number;
}

export function ShelfIcon({ iconKey, size, color, strokeWidth = 1.5 }: ShelfIconProps) {
  const IconComp = ICON_MAP[iconKey] ?? IconBooks;
  return <IconComp size={size} color={color} strokeWidth={strokeWidth} />;
}
