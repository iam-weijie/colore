import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import { useDevice } from "@/app/contexts/DeviceContext";
import {
  FlatList,
  TouchableOpacity,
  View,
  Image,
  Text,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { icons } from "@/constants";
import { Board } from "@/types/type";
import { useHaptics } from "@/hooks/useHaptics";
import * as Haptics from 'expo-haptics';
import { useDecrypt } from "@/hooks/useDecrypt";
import EmptyListView from "./EmptyList";
  
const BoardContainer = React.memo(({ item }: { item: Board }): React.ReactElement => {
  const { encryptionKey } = useEncryptionContext();
  const isPrivate = useMemo(() => item.restrictions?.includes("Private"), [item.restrictions]);
  
  const decrypt = useDecrypt();
  const displayTitle = useMemo(() => {
    let title = item.title;
    if (isPrivate && encryptionKey) {
      try {
        title = decrypt(item.title) ?? "";
      } catch {}
    }
    return title ?? "";
  }, [item.title, isPrivate, encryptionKey, decrypt]);
  
  const router = useRouter();
  const { user } = useUser();
  const { triggerHaptic } = useHaptics();

  const handlePress = useCallback(() => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Soft);
    if (item.id == 0 && item.user_id === user!.id) {
      router.push({
        pathname: "/root/user-board/[id]",
        params: { id: `${user!.id}`, username: "Personal board" },
      });
    } else {
      router.push({
        pathname: "/root/user-board/[id]",
        params: { id: `${item.user_id}`, username: item.title, boardId: item.id },
      });
    }
  }, [item, user, router, triggerHaptic]);

  // Memoize the animation style to prevent recalculation
  const animationStyle = useMemo(() => 
    FadeIn.duration(400).springify().delay(item.id % 10 * 100)
  , [item.id]);

  return (
    <Animated.View
      entering={animationStyle}
      className="overflow-hidden m-2 border-2 rounded-[36px] shadow-md"
      style={{
        backgroundColor: item.color,
        borderColor: '#ffffff80',
        height: 225,
        width: 170,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        className="flex-1"
      >
        {/* Gradient overlay at bottom */}
        <View className="absolute bottom-0 left-0 right-0 h-1/3" />
        
        {/* Title and metadata at bottom */}
        <View className="w-full h-full flex-col items-center justify-center p-3 z-[10]">
          <Text 
            className="text-white text-center text-[16px] font-JakartaBold shadow-md"
            numberOfLines={2}
          >
            {displayTitle}
          </Text>
          
          {/* Additional metadata - you can customize these */}
          <View className="flex-row items-center">
            {item.id > 0 && <Text className="text-white/90 text-[12px] font-JakartaSemiBold drop-shadow-md ">
              {item.count || 0} notes
            </Text>}
            {item.isPrivate && (
              <View className="">
                <Image
                source={icons.lock}
                tintColor={"white"}
                className="w-4 h-4"
                />
              </View>
            )}
          </View>
        </View>
        
        {/* Optional "New" badge */}
        {item.isNew && (
          <View className="absolute top-4 left-4 bg-red-500 px-2 py-1 rounded-full">
            <Text className="text-white text-[10px] font-JakartaBold">NEW</Text>
          </View>
        )}

        {/* Optional image placeholder - you could replace this with actual board cover images */}
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }}
            className="absolute w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="absolute self-center w-[97%] h-[97%]  top-[50%] -mt-[48.5%] border-2 border-white rounded-[32px] bg-white/20 z-[-1] " />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const BoardGallery = React.memo(({ boards, offsetY }: {boards: Board[], offsetY?: number}) => {
  const { isIpad } = useDevice();

  // Memoize the performance settings
  const performanceSettings = useMemo(() => ({
    initialNumToRender: isIpad ? 16 : 4,
    maxToRenderPerBatch: isIpad ? 16 : 4,
    windowSize: isIpad ? 10 : 5,
    removeClippedSubviews: true,
  }), [isIpad]);

  // Memoize the key extractor function
  const keyExtractor = useCallback((item: Board) => item.id.toString(), []);

  // Memoize the render item function
  const renderItem = useCallback(({ item }: { item: Board }) => 
    <BoardContainer item={item} />
  , []);

  // Memoize the empty component
  const ListEmptyComponent = useMemo(() => (
    <View className="flex-1 items-center justify-center">
      <EmptyListView character="rosie" mood={1} message="No boards? Don't you have any hobbies?"/>
    </View>
  ), []);

  // Memoize the footer component
  const ListFooterComponent = useMemo(() => <View className="h-20" />, []);

  return (
    <FlatList
      className="flex-1 pt-4"
      data={boards}
      keyExtractor={keyExtractor}
      numColumns={isIpad ? 6 : 2}
      renderItem={renderItem}
      contentContainerStyle={{
        paddingHorizontal: isIpad ? 16 : 4,
        paddingBottom: 20,
        paddingTop: offsetY ?? 0,
      }}
      columnWrapperStyle={isIpad
        ? { justifyContent: 'flex-start', gap: 12, marginBottom: 16 }
        : { justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 16 }
      }
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      // Performance optimizations
      {...performanceSettings}
    />
  );
});

export default BoardGallery;