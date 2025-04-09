import { SignedIn, useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import EmojiSelector from "react-native-emoji-selector";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import CustomButton from "@/components/CustomButton";
import { icons, temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { PostItColor } from "@/types/type";
import { useNavigationContext } from "@/components/NavigationContext";
import { useAlert } from '@/notifications/AlertContext';
import TabNavigation from "@/components/TabNavigation";
import ItemContainer from "@/components/ItemContainer";
import ModalSheet from "@/components/Modal";
import { UniqueSelection, NumberSelection } from "@/components/Selector";

const NewPost = () => {
  const { user } = useUser();
  const { type } = useLocalSearchParams();
  const { showAlert } = useAlert();
  
  const [boardTitle, setBoardTitle] = useState("");

  const [boardDescription, setBoardDescription] = useState("");
  const [boardRestriction, setBoardRestriction] = useState<string[]>([]);
  const [boardMaxPosts, setBoardMaxPosts] = useState<number>(4);
  const [boardComplete, setBoardComplete] = useState<boolean>(false);

  const [selectedModal, setSelectedModal] = useState<any>();
  const [selectedModalTitle, setSelectedModalTitle] = useState<string>("");
  const [inputHeight, setInputHeight] = useState(40);
  const [navigationIndex, setNavigationIndex] = useState<number>(0)
  const maxTitleCharacters = 20;
  const maxDescriptionCharacters = 300;
  const [selectedColor, setSelectedColor] = useState<PostItColor>(
    temporaryColors[Math.floor(Math.random() * 4)]
  );
  const [isPosting, setIsPosting] = useState(false);


  // need to get user's screen size to set a min height
  const screenHeight = Dimensions.get("screen").height;

  const tabs = ["Title", "Description", "Restrictions"]

  const allRestricitons = [
    {
      restriction: "privacy",
      description: `Choose Everyone to make your board public—anyone can view and post on it.
Select Private to keep it visible only to you.
Great for sharing or keeping things personal.`,
      options: [
        {
          label: "Private"
        },
        {
          label: "Everyone"
        },
      ]
    },
    {
      restriction: "comments",
      description: ` Enable Comments to let others reply and engage with your board.
Disable them to keep your board read-only.
Perfect for open discussions or quiet sharing.`,
      options: [
        {
          label: "commentsAllowed"
        },
        {
          label: "commentsDisabled"
        }
      ]
    }
  ]

  const restrictionsPersonalBoard = [
    {
      label: "Preying eyes",
      caption: "Choose who can see you board.",
      icon: icons.hide,
      iconColor: "#FAFAFA",
      onPress: () => {
        const restric = allRestricitons.find((r) => r.restriction === "privacy")
        if (!restric) {
          return
        }
        setSelectedModal(<UniqueSelection options={restric.options} description={restric.description} onSelect={handleSelectedRectriction} />)
        setSelectedModalTitle("Privacy")
      }
    },
    {
      label: "Allow Comments",
      caption: "Can you receive comments?",
      icon: icons.comment,
      iconColor: "#FAFAFA",
      onPress: () => {
        const restric = allRestricitons.find((r) => r.restriction === "comments")
        if (!restric) {
          return
        }
        const cleanedOptions = restric.options.map(option => {
          return {
            label: option.label === "commentsDisabled" ? "Disabled" : "Allowed"
          };
        });
        setSelectedModal(<UniqueSelection options={cleanedOptions} description={restric.description} onSelect={handleSelectedRectriction} />)
        setSelectedModalTitle("Comments")
      }
    },
    {
      label: "# Notes",
      caption: "Select how many notes can be displayed!",
      icon: icons.globe,
      iconColor: "#FAFAFA",
      onPress: () => {
        setSelectedModal(<NumberSelection minNum={4} maxNum={8} onSelect={handleMaxPost} />)
        setSelectedModalTitle("Maximum number of notes")
      }
    }
    
  ]

  const restrictionsCommunityBoard = [
    {
      label: "On invite only",
      caption: "Choose who can see you board.",
      icon: icons.lock,
      iconColor: "#FAFAFA",
      onPress: () => {}
    },
    {
      label: "Location based",
      caption: "Can you receive comments?",
      icon: icons.globe,
      iconColor: "#FAFAFA",
      onPress: () => {}
    },
    {
      label: "Show notes",
      caption: "Select how many notes can be displayed!",
      icon: icons.album,
      iconColor: "#FAFAFA",
      onPress: () => {}
    },
    {
      label: "Allow Anonymous Comments",
      caption: "Can you receive comments?",
      icon: icons.comment,
      iconColor: "#FAFAFA",
      onPress: () => {}
    },
    
  ]

  const handleSelectedRectriction = (option: string) => {
    if (!boardRestriction.find((r) => r === option)) {

      if (option === "Everyone" || option === "Private") {
        setBoardRestriction((prev) => prev.filter((r) => r !== "Everyone"))
        setBoardRestriction((prev) => prev.filter((r) => r !== "Private"))
        setBoardRestriction((prev) => [...prev, option])
      }

      if (option === "Allowed" || option === "Disabled") {
        setBoardRestriction((prev) => prev.filter((r) => r !== "commentsAllowed"))
        setBoardRestriction((prev) => prev.filter((r) => r !== "commentsDisabled"))
        setBoardRestriction((prev) => [...prev, option])
      }
     
    }
  }

  useEffect(() => {
console.log("restriction", boardRestriction)
  }, [boardRestriction])
  const handleContentSizeChange = (event: any) => {
    setInputHeight(event.nativeEvent.contentSize.height);
  };

  const handleMaxPost = (max: number) => {
    console.log("Selected max:", max, "Current boardMaxPosts:", boardMaxPosts);
  
    if (max !== boardMaxPosts) {
      // Remove the old max from restrictions and add the new one
      setBoardRestriction((prev) => [
        ...prev.filter((r) => r !== `${boardMaxPosts}`),
        `${max}`,
      ]);
  
      // Update max posts
      setBoardMaxPosts(max);
  
      // Log separately, since boardMaxPosts won't update right away
      console.log("Updating max to:", max);
    } else {
      console.log("Max is already selected:", max);
    }
  };
  



  const handleChangeText = (text: string) => {
    if (text.length <= maxTitleCharacters && text.length <= maxDescriptionCharacters) {
      
      if (navigationIndex == 0) {
        setBoardTitle(text);}
      else {setBoardDescription(text);}
      
    } else {
      if (navigationIndex == 0) {
      setBoardTitle(text.substring(0, maxTitleCharacters));
      } else { setBoardDescription(text.substring(0, maxDescriptionCharacters));}
      showAlert({
        title: 'Limit Reached',
        message: `You can only enter up to ${navigationIndex == 0 ? maxTitleCharacters : maxDescriptionCharacters} characters.`,
        type: 'ERROR',
        status: 'error',
      });

    }
  };

  const alertFieldEmpty = () => {
 
      showAlert({
        title: 'Title cannot be empty',
        message: 'Please give a title to the board',
        type: 'ERROR',
        status: 'error'
      })

}

useEffect(() => {
setSelectedColor(temporaryColors[Math.floor(Math.random() * 4)])
}, [navigationIndex])

  return (
    <SafeAreaView className="flex-1" >
      <SignedIn>
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          onPressIn={() => Keyboard.dismiss()}
         
        >
          <View className="flex-1" >
            <View className="flex flex-row justify-between items-center mt-6 mx-8">
            <View className="flex flex-row w-full justify-between items-center ">
                <TouchableOpacity onPress={() => router.back()} className="mr-2">
                  <AntDesign name="caretleft" size={18} color="black" />
                </TouchableOpacity>
                  <View className="">
                              <Text className="  text-center text-xl font-JakartaBold text-black">
                                New Board
                              </Text>
                              </View>
 <TouchableOpacity
                  onPress={() => {}}>
                  <Image
                  source={icons.addUser}
                  className="w-6 h-6"
                  tintColor={"#000"} />
                  </TouchableOpacity>
              
            </View>
           
            {/* !!type ? (
                  <TouchableOpacity>
                  <Image
                  source={icons.addUser}
                  className="w-6 h-6"
                  tintColor={selectedColor.fontColor} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                  onPress={() => {
                    const currentIndex = expirationDate.indexOf(selectExpirationDate);
                    if (currentIndex < expirationDate.length - 1) {
                      setSelectExpirationDate(expirationDate[currentIndex + 1])
                    } else {
                      setSelectExpirationDate(expirationDate[0])
                    }
                  }}>
                   <Text className="  text-center text-[14px] font-JakartaBold" style={{
                    color: selectedColor.fontColor
                   }}>
                   Expire in : {selectExpirationDate}
                 </Text>
                 </TouchableOpacity>
                )
                */}
            </View>
            <View className="flex flex-row items-start justify-between mt-4 mx-8">
              <TabNavigation
                name={tabs[0]}
                focused={navigationIndex === 0}
                onPress={() => {
                  setNavigationIndex(0)
                }}
                notifications={0}/>
                <TabNavigation
                name={tabs[1]}
                focused={navigationIndex === 1}
                onPress={() => {
                  if (boardTitle === "") {
                  alertFieldEmpty()
                  return
                  }
                  setNavigationIndex(1)
                }}
                notifications={0}/>
                <TabNavigation
                name={tabs[2]}
                focused={navigationIndex === 2}
                onPress={() => {
                  if (boardTitle === "") {
                    alertFieldEmpty()
                    return
                    }
                  setNavigationIndex(2)
                }}
                notifications={0}/>
            </View>

           <View className="flex-1 m-6 rounded-[48px]" style={{backgroundColor: selectedColor.hex}}>
            {navigationIndex < 2 ? (<View className="flex-1"><KeyboardAvoidingView behavior="padding" className="flex-1 flex w-full">
          <View className="flex-1 flex-column justify-center items-center ">
            <View className="flex w-full mx-3">
              
                <View>
                <TextInput
                  className="text-[20px] text-center text-white p-5 rounded-[24px] font-JakartaBold mx-10 "
                  placeholder={navigationIndex === 0 ? "Choose a name..." : "Add a description... "}
                  value={navigationIndex === 0 ? boardTitle : boardDescription}
                  onChangeText={handleChangeText}
                  onContentSizeChange={handleContentSizeChange}
                  autoFocus
                  scrollEnabled
                  multiline={navigationIndex != 0}
                  style={{
                    paddingTop: 10,
                    paddingBottom: 0,
                    minHeight: screenHeight * 0.2,
                    maxHeight: screenHeight * 0.5,
                    textAlignVertical: "top",
                  }}
                />
                </View>
              
            </View>
    
           
             
              </View>
              
              </KeyboardAvoidingView>
              {boardTitle &&
              <View className="flex-1 absolute m-6 top-2 items-start py-5 px-6 bg-[#FAFAFA] rounded-[24px]" >
                <Text className="text-[14px] font-JakartaBold text-center text-black">{boardTitle ? `Title: ${boardTitle}` : ''}</Text>
                {boardDescription && <Text 
                className="text-[14px] font-JakartaBold text-center text-black"
                numberOfLines={1}
                ellipsizeMode='tail'>
                  {boardDescription ? `Description: ${boardDescription.slice(0, 20)}` : ''}</Text>}
              </View>}
              </View>) : (
                <ScrollView className="flex-1 mt-4 mx-6 py-6">
                {restrictionsPersonalBoard.map((item) => (
                  <ItemContainer 
                    label={item.label}
                    caption={item.caption}
                    icon={item.icon}
                    colors={['#fbb1d6', selectedColor.hex] as [string, string]}
                    iconColor={item.iconColor}
                    onPress={item.onPress}
                    />
                ))}
                
                </ScrollView>
              )}
              </View>
              <View className="flex-1 absolute flex items-center w-full bottom-[10%]">
            <CustomButton
              className="w-[50%] h-16 rounded-full shadow-none bg-black"
              fontSize="lg"
              title={navigationIndex === 2 ? 'submit' : 'next'}
              padding="0"
              onPress={() => {
               if(navigationIndex < tabs.length - 1) {
                setNavigationIndex((prev) => prev + 1)
               } else {
                if (!boardComplete) {
                  showAlert({
                    title: 'Incomplete Board',
                    message: 'Please complete all required fields before submitting.',
                    type: 'ERROR',
                    status: 'error',
                  })
                  return
                }

               }
              }}
              //disabled={}//navigationIndex < (type === 'community' ? tabs.length - 1 : tabs.length - 2)}
            />
            </View>
       
          </View>
        </TouchableWithoutFeedback>
        {!!selectedModal &&
        <ModalSheet
        title={selectedModalTitle}
        isVisible={!!selectedModal}
         onClose={() => {
          setSelectedModal(null)
          setSelectedModalTitle("")
        }
          }>
          {selectedModal}
          </ModalSheet>}
      </SignedIn>
      </SafeAreaView>
  );
};


export default NewPost;
