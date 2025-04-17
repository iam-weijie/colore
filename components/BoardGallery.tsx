import React, { useEffect, useState  } from "react";
import { useUser } from "@clerk/clerk-expo";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  View,
  Image,
  Text,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { icons } from "@/constants";
import { Board } from "@/types/type";
  
const BoardContainer = ({ item }: { item: Board }): React.ReactElement => {
  
     const router = useRouter();
      const { user } = useUser();

    return (
      <Animated.View
        entering={FadeIn.duration(400).springify().delay(item.id % 10 * 100)}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {

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
          

          }}
          className="relative rounded-[32px] h-[225px] w-[170px] overflow-hidden m-2 shadow-2xl"
          style={{
            backgroundColor: item.color ?? "#ff00f0",
          }}
        >
          {/* Gradient overlay at bottom */}
          <View className="absolute bottom-0 left-0 right-0 h-1/3" />
          
          {/* Optional image placeholder - you could replace this with actual board cover images */}
          {item.imageUrl ? (
            <Image 
              source={{ uri: item.imageUrl }}
              className="absolute w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="absolute w-full h-full " />
          )}
          
          {/* Title and metadata at bottom */}
          <View className="absolute bottom-2 w-full p-3 left-2">
            <Text 
              className="text-white text-[16px] font-JakartaBold  drop-shadow-md"
              numberOfLines={2}
            >
              {item.title}
            </Text>
            
            {/* Additional metadata - you can customize these */}
            <View className="flex-row items-center">
              {item.id > 0 && <Text className="text-white/80 text-[12px] font-JakartaSemiBold ">
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
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const BoardGallery = ({ boards }) => {
    const [allBoards, setAllBoards] = useState<any | null>(null);
  
    useEffect(() => {
      if (allBoards) {
        setAllBoards(boards)
      }
    }, [])

 
    return (
      <FlatList
      className="flex-1"
      data={boards}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      renderItem={({ item }) => <BoardContainer item={item} />}
      contentContainerStyle={{
        paddingHorizontal: 8,
        paddingBottom: 20,
      }}
      columnWrapperStyle={{
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        marginBottom: 16,
      }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
      <View className="flex-1 flex-row items-center justify-center">
        <Text>
          No Boards Yet.
        </Text>
      </View>
      }
      ListFooterComponent={<View className="h-20" />} // Add some bottom padding
      // Optimize performance
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={5}
      removeClippedSubviews={true}
    />
    )
  }

  export default BoardGallery;