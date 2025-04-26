import React, { useEffect, useState  } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useGlobalContext } from "@/app/globalcontext";
import {
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
        className="relative rounded-[32px] h-[225px] w-[170px] overflow-hidden m-2 shadow-sm border-2"
        style={{
          borderRadius: 28,
          backgroundColor: item.color,
          borderColor: "#ffffff80",
          height: 225,
          width: 170,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
        }}
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
        className="flex-1"
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
    const { isIpad } = useGlobalContext();
  
    useEffect(() => {
      if (allBoards) {
        setAllBoards(boards)
      }
    }, [])

 
    return (
      <FlatList
  className="flex-1 pt-4"
  data={boards}
  keyExtractor={(item) => item.id.toString()}
  numColumns={isIpad ? 6 : 2}
  renderItem={({ item }) => <BoardContainer item={item} />}
  contentContainerStyle={{
    paddingHorizontal: isIpad ? 16 : 8, // More padding on iPad
    paddingBottom: 20,
  }}
  columnWrapperStyle={isIpad ? {
    justifyContent: 'flex-start', // Align items from left
    gap: 12, // Consistent gap between items
    marginBottom: 16,
  } : {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  }}
  showsVerticalScrollIndicator={false}
  ListEmptyComponent={
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-gray-500">
        No Boards Yet.
      </Text>
    </View>
  }
  ListFooterComponent={<View className="h-20" />}
  // Performance optimizations
  initialNumToRender={isIpad ? 16 : 4} // Render 2 full rows initially on iPad
  maxToRenderPerBatch={isIpad ? 16 : 4}
  windowSize={isIpad ? 10 : 5} // Larger window for iPad
  removeClippedSubviews={true}
/>
    )
  }

  export default BoardGallery;