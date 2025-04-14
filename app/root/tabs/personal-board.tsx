import React, { useEffect, useState, useCallback } from "react";
import { SignedIn, useUser } from "@clerk/clerk-expo";
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
import { useRouter, useFocusEffect } from "expo-router";
import { fetchAPI } from "@/lib/fetch";
import AntDesign from "@expo/vector-icons/AntDesign";
import PersonalBoard from "@/components/PersonalBoard";
import { icons, temporaryColors } from "@/constants";
import TabNavigation from "@/components/TabNavigation";
import ModalSheet from "@/components/Modal";
import { Board } from "@/types/type";
import InteractionButton from "@/components/InteractionButton";

const UserPersonalBoard = () => {
  const router = useRouter();
  const { user } = useUser();

  const [loading, setLoading] = useState<boolean>(false);

  const [selectedTab, setSelectedTab] = useState<string>("MyBoards");
  const [selectedBoardTitle, setSelectedBoardTitle] = useState<string>("");
  const [selectedBoardId, setSelectedBoardId] = useState<number>(0);
  const [selectedBoardUserInfo, setSelectedBoardUserInfo] = useState<string>("");
  const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
  const [myBoards, setMyBoards] = useState<any>();
  const [discoverBoards, setDiscoverBoards] = useState<any>();

  const handleNewPost = () => {
    router.push({
      pathname: "/root/new-personal-post",
      params: {
        recipient_id: user!.id,
        source: "board"
      },
    });
  };

  const fetchPersonalBoards = async () => {
    try {
      setLoading(true)
      const response = await fetchAPI(`/api/boards/getBoards?user_id=${user!.id}`,
          {
            method: "GET",
          }
      )
      if (response.error) {
        throw new Error(response.error);
      }

      const personalBoard =  {
        id: 0,
        title: "Personal Board",
        user_id: user!.id,
        description: "Your window to the world!",
        members_id: [user!.id],
        board_type: 'personal',
        restrictions: ['personal', 'commentsAllowed', '5'],
        created_at: Date.now(),
        color: "#93c5fd"
      }

        if (response.data) {
          const boardsWithColor = response.data.map((board: any, index: number) => ({
            ...board,
            color: temporaryColors[Math.floor(Math.random() * 4)].hex, // only assign if not already set
          }));
        
          setMyBoards([...boardsWithColor, personalBoard]);
        } else {
         
          setMyBoards(personalBoard)
        }

    } catch (error) {
      console.error("Failed to fetch board data:", error);
    } finally {
      setLoading(false)
    }
  }

  const fetchDiscoverBoards = async () => {
    try {
      setLoading(true)
      const response = await fetchAPI(`/api/boards/getDiscoverBoards`,
          {
            method: "GET",
          }
      )
      if (response.error) {
        throw new Error(response.error);
      }

        if (response.data) {
          const boardsWithColor = response.data.map((board: any, index: number) => ({
            ...board,
            color: temporaryColors[Math.floor(Math.random() * 4)].hex, // only assign if not already set
          }));
        
          setDiscoverBoards([...boardsWithColor]);
        }

    } catch (error) {
      console.error("Failed to fetch board data:", error);
    } finally {
      setLoading(false)
    }
  }


    useFocusEffect(
      useCallback(() => {
        fetchPersonalBoards()
        fetchDiscoverBoards()
        //setShouldRefresh((prev) => prev + 1); // Increment refresh counter
      }, [])
    );
  


  // ITEM RENDER --START

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
      ListFooterComponent={<View className="h-20" />} // Add some bottom padding
      // Optimize performance
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={5}
      removeClippedSubviews={true}
    />
    )
  }


  const BoardContainer = ({ item }: { item: Board }): React.ReactElement => {
  
    
    return (
      <Animated.View
        entering={FadeIn.duration(400).springify().delay(item.id % 10 * 100)}r
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            setSelectedBoard(() => <PersonalBoard userId={user!.id} boardId={item.id} />);
            setSelectedBoardTitle(item.title);
            setSelectedBoardUserInfo(item.user_id);
            setSelectedBoardId(item.id);
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
              <Text className="text-white/80 text-[12px] font-JakartaSemiBold ">
                {item.pins?.length || 0} notes
              </Text>r
              {item.isPrivate && (
                <View className="bg-black/30 rounded-full p-1">
                  <LockClosedIcon size={12} color="white" />
                </View>
              )}
            </View>
          </View>
          
          {/* Optional "New" badge */}
          {item.isNew && (
            <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-full">
              <Text className="text-white text-[10px] font-JakartaBold">NEW</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };
  

  // ITEM RENDER --END


  // USE EFFECTS
  useEffect(() => {
    console.log("selected", selectedBoard, !!selectedBoard)
  }, [selectedBoard])

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-row justify-between items-center mx-7 mt-3 ">

        <Text className={`text-2xl font-JakartaBold`}>
          Boards
          </Text>
        
      </View>
      <SignedIn>
        <View className="flex-1">
        <View className="flex flex-row items-start justify-between mt-4 mx-8 mb-4  ">
              <TabNavigation
                name={"Mine"}
                focused={selectedTab === "MyBoards"}
                onPress={() => {
                  setSelectedTab("MyBoards")
                }}
                notifications={0}
                color={"#CFB1FB"}/>
                <TabNavigation
                name={"Discover"}
                focused={selectedTab === "Discover"}
                onPress={() => {
                  setSelectedTab("Discover")
                }}
                notifications={0}
                color={"#93c5fd"}/>
            </View>
            {!loading ? (<View className="flex-1 overflow-hidden my-4">
        {!!selectedBoard &&
          <ModalSheet 
            isVisible={!!selectedBoard}
            title={selectedBoardTitle}
            onClose={() => {
              
              setSelectedBoard(null)
            }}
            >
              {selectedBoard}
              </ModalSheet>
}
        {selectedTab === "MyBoards" ? (
        <View className="flex-1">
          <BoardGallery
            boards={myBoards}
            />
          </View>) : (
        <View className="flex-1">
          <BoardGallery
          boards={discoverBoards}
          />
        </View>)}
        </View>) : (
          <View className="flex-1 flex-row items-center justify-center">
            <ActivityIndicator
            size={"small"}
            color={"#888"}
            />
          </View>
        )}
       
        </View>
       
      </SignedIn>
    </SafeAreaView>
  );
};

export default UserPersonalBoard;


/*

  {!!selectedBoard  && <TouchableOpacity onPress={() => {
        setSelectedBoard(null)
        setSelectedBoardTitle("")
        setSelectedBoardUserInfo("")
        setSelectedBoardId(0)
      }}>
                  <AntDesign name="caretleft" size={18} color="0076e3" />
                </TouchableOpacity>}

  {!!selectedBoard  && <TouchableOpacity
                              onPress={() => {
                                 router.push({
                                                pathname: "root/new-post",
                                                params: {
                                                  recipient_id: user!.id,
                                                  boardId: selectedBoardId,
                                                  username: "Yourself"
                                                }
                                              });
                              }
                                }>
                              <Image
                              source={icons.plus}
                              className="w-5 h-5"
                              tintColor={"#000"} />
                              </TouchableOpacity>}*/