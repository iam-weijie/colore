import React, { useEffect, useState } from "react";
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
import { useRouter } from "expo-router";
import { fetchAPI } from "@/lib/fetch";
import AntDesign from "@expo/vector-icons/AntDesign";
import PersonalBoard from "@/components/PersonalBoard";
import { icons, temporaryColors } from "@/constants";
import TabNavigation from "@/components/TabNavigation";
import { Board } from "@/types/type";

const UserPersonalBoard = () => {
  const router = useRouter();
  const { user } = useUser();

  const [loading, setLoading] = useState<boolean>(false);

  const [selectedTab, setSelectedTab] = useState<string>("MyBoards");
  const [selectedBoardTitle, setSelectedBoardTitle] = useState<string>("");
  const [selectedBoardId, setSelectedBoardId] = useState<number>(0);
  const [selectedBoardUserInfo, setSelectedBoardUserInfo] = useState<string>("");
  const [selectedBoard, setSelectedBoard] = useState<any>();
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

  useEffect(() => {
    fetchPersonalBoards()
    fetchDiscoverBoards()
  }, [])


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
      renderItem={BoardContainer}
    />
    )
  }


  const BoardContainer = ({ item }: { item: Board }): React.ReactElement => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          setSelectedBoard(() => <PersonalBoard userId={user!.id} boardId={item.id} />);
          setSelectedBoardTitle(item.title);
          setSelectedBoardUserInfo(item.user_id);
          setSelectedBoardId(item.id);
        }}
        className="flex-1 items-center justify-end rounded-3xl h-[225px] max-w-[170px] p-4 m-4 shadow-lg"
        style={{
          backgroundColor: item.color ?? "#ff00f0",
        }}
      >
        <View className="w-full bg-white/90 rounded-xl p-">
          <Text className="text-[14px] font-JakartaBold text-black text-center drop-shadow-md">
            {item.title}
          </Text>
        </View>
      </TouchableOpacity>
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
      {!!selectedBoard  && <TouchableOpacity onPress={() => {
        setSelectedBoard(null)
        setSelectedBoardTitle("")
        setSelectedBoardUserInfo("")
        setSelectedBoardId(0)
      }}>
                  <AntDesign name="caretleft" size={18} color="0076e3" />
                </TouchableOpacity>}
        <Text className={`text-${!!selectedBoard  ? '[18px]' : '2xl'} font-JakartaBold`}>
          {!!selectedBoard ? selectedBoardTitle : 'Boards'}
          </Text>
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
                              </TouchableOpacity>}
      </View>
      <SignedIn>
        <View className="flex-1">
        {!selectedBoard  && <View className="flex flex-row items-start justify-between mt-4 mx-8 mb-4  ">
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
            </View>}
            {!loading ? (<View className="flex-1 overflow-hidden my-4">
        {!!selectedBoard ? (selectedBoard) 
        : selectedTab === "MyBoards" ? (
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


