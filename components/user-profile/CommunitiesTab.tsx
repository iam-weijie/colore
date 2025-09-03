// CommunitiesTab.tsx
import React from "react";
import { View } from "react-native";
import BoardGallery from "../BoardGallery";
import { Board } from "@/types/type";

type Props = {
  boards: Board[];
  offsetY?: number;
};

const CommunitiesTab: React.FC<Props> = ({ boards, offsetY = 0 }) => {
  return (
    <View className="flex-1 pt-4">
      <BoardGallery boards={boards} offsetY={offsetY} />
    </View>
  );
};

export default CommunitiesTab;
