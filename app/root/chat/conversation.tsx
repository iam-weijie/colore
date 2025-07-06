import CustomButton from "@/components/CustomButton";
import { fetchAPI } from "@/lib/fetch";
import { Message } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import { PanGestureHandlerGestureEvent, GestureHandlerRootView, PanGestureHandler  } from "react-native-gesture-handler";
import { useFocusEffect} from "@react-navigation/native";
import React, { useEffect, useRef, useState,  useCallback } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  FadeInUp,
  FadeOutDown,
  runOnJS
} from "react-native-reanimated";

import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ColoreActivityIndicator from "@/components/ColoreActivityIndicator";

import { useSettingsContext } from "@/app/contexts/SettingsContext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects";
import { useSoundGesture } from "@/hooks/useSoundGesture";

interface GestureContext {
  startX: number;
  startY: number;
}

const MessageItem: React.FC<Message> = ({
  id,
  senderId,
  content,
  timestamp,
  unread,
  notified
}) => {
  const { user } = useUser();
  const [showTime, setShowTime] = useState(false);

  const translateX = useSharedValue(0);
  const timeOpacity = useSharedValue(0);

  // Maximum swipe distance
  const maxSwipe = 55; // Adjust as needed
  const minSwipe = -55; // Adjust as needed

  const { soundEffectsEnabled } = useSettingsContext();
  const { playSoundEffect } = useSoundEffects();
  const { handlePanGestureStateChange } = useSoundGesture(SoundType.Swipe);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
    onStart: (_, context) => {
      context.startX = translateX.value;
      // Add sound effect on gesture start
      runOnJS(handlePanGestureStateChange)({ nativeEvent: { state: 1 } } as any);
    },
    onActive: (event, context) => {
      const translationX = event.translationX;
      // Calculate the translation, limit swipe range
      translateX.value = Math.max(Math.min(translationX + context.startX, maxSwipe), minSwipe);
      // Show time while active swipe
      runOnJS(setShowTime)(true);
    },
    onEnd: () => {
      // Hide time after swipe ends
      runOnJS(setShowTime)(false);
      translateX.value = withTiming(0, { duration: 300 }); // Use `withTiming` to reset smoothly
      // Add sound effect on gesture end
      runOnJS(handlePanGestureStateChange)({ nativeEvent: { state: 5 } } as any);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(translateX.value, { damping: 20, stiffness: 300 }) }],
  }));

  return (
    <GestureHandlerRootView style={{ justifyContent: "center", alignItems: "center" }}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          className="p-3 my-2 rounded-2xl max-w-[70%]"
          style={[
            animatedStyle, // Apply animated style here
            {
              backgroundColor: senderId === user?.id ? 'black' : '#e5e7eb',
              alignSelf: senderId === user?.id ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          <Text className="text-[14px] font-600" style={{ color: senderId === user?.id ? 'white' : 'black' }}>
            {content}
          </Text>

          {showTime && (
            <View style={{
              alignSelf: senderId == user?.id ? 'flex-end' : 'flex-start',
              [senderId === user?.id ? 'right' : 'left']: -55, 
              bottom: 0

            }} className="absolute">
              <Text className="text-xs text-gray-500 mt-1">
                {timestamp
                  ? new Date(timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    })
                  : ''}
              </Text>
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};
const Conversation = () => {
  const { conversationId, otherClerkId, otherName } = useLocalSearchParams();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const flatListRef = useRef<FlatList<Message>>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const updateActiveUser = async (activity: boolean) => {
    
    try {
      const response = await fetchAPI(`/api/users/updateActiveUser`,  {
        method: "PATCH",
        body: JSON.stringify({
          clerkId: user?.id,
          conversationId: conversationId,
          activity: activity
        }),
      });

      if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error("Failed to update user last connection:", error);
    }
};

const checkNumberOfParticipants = async (activity: boolean) => {
    
  try {
    const response = await fetchAPI(`/api/users/updateActiveUser`,  {
      method: "PATCH",
      body: JSON.stringify({
        clerkId: user?.id,
        conversationId: conversationId,
        activity: activity
      }),
    });

    const number_of_participants = response.data.active_participants.length;
    return number_of_participants

  } catch (error) {
    console.error("Failed to check number of participants", error);
  }

};

  const fetchMessages = async () => {
    const response = await fetchAPI(
      `/api/chat/getMessages?id=${conversationId}`,
      {
        method: "GET",
      }
    );
    setMessages(response.data);
    flatListRef.current?.scrollToEnd({ animated: true });
    //console.log("Messages:", response.data);
  };
  const fetchMessagesFirst = async () => {
    setLoading(true);
    try {
      await fetchMessages();
    } catch (error) {
      //console.log("Error fetching messages", error);
    } finally {
      setLoading(false);
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    updateActiveUser(true);
  }, [conversationId]); 

  useFocusEffect(
    useCallback(() => {
      return () => {
        updateActiveUser(false)};
    }, [user, conversationId])
  );
  useEffect(() => {
    fetchMessagesFirst();
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [conversationId]);

  useEffect(() => {
    setLoading(true)
    const unread_messages = messages.filter((msg) => msg.unread == true && msg.senderId != user!.id)
    unread_messages.map((msg) => {
      handleUpdateUnreadMessages(msg.id)
    })
    setLoading(false)
  }, [messages])
  const updateMessages = async (messageContent: string) => {
    const active_participants = await checkNumberOfParticipants(true)

    await fetchAPI(`/api/chat/newMessage`, {
      method: "POST",
      body: JSON.stringify({
        conversationId: conversationId,
        message: messageContent,
        senderId: user!.id,
        timestamp: new Date(),
        unread: active_participants == 2 ? false : true,
        notified: active_participants == 2 ? true : false
      }),
    });
  };
  const patchConversation = async (messageContent: string) => {
    await fetchAPI(`/api/chat/patchConversations`, {
      method: "PATCH",
      body: JSON.stringify({
        conversationId: conversationId,
        message: messageContent,
        timestamp: new Date(),
      }),
    });
  };
  const handleSendMessage = (): void => {
    if (newMessage.trim().length === 0) return;

    const newMessageObj: Message = {
      id: messages.length + 1,
      content: newMessage,
      senderId: user!.id,
      timestamp: new Date(),
      unread: false,
      notified: false,
    };

    // Update the state to include the new message
    setMessages((prevMessages) => [...prevMessages, newMessageObj]);
    flatListRef.current?.scrollToEnd({ animated: true });
    updateMessages(newMessage);
    flatListRef.current?.scrollToEnd({ animated: true });
    patchConversation(newMessage);
    flatListRef.current?.scrollToEnd({ animated: true });
    setNewMessage("");
  };
  const handleUpdateUnreadMessages = async (messageId: number) => {
      setLoading(true)
      try {
          const updateUnreadMessages = await fetchAPI(`/api/notifications/updateUnreadMessages`, {
            method: "PATCH",
            body: JSON.stringify({
              clerkId: user?.id,
              messageId: messageId,
            })
          })
      }
      catch {
        console.error("Failed to update unread message:", error);
      } finally {
        setLoading(false)
      }
    }
  const renderMessageItem = ({
    item,
  }: {
    item: Message;
  }): React.ReactElement => (
    <MessageItem 
    id={item.id}
    senderId={item.senderId}
    content={item.content}
    timestamp={item.timestamp}
    unread={item.unread}
    notified={item.notified}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      <View
        className="flex flex-row items-center justify-between px-4 pt-2 pr-9"
        style={{ height: 50 }}
      >
          <View className="mr-2">
            <TouchableOpacity onPress={() => router.back()}>
              <AntDesign name="caretleft" size={18} color="0076e3" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="flex-1"
            onPress={() => {
              router.push({
                pathname: "/root/profile/[id]",
                params: { id: otherClerkId },
              })
            }
            }
          >
            <Text className={`text-xl font-JakartaBold flex-1 text-center`}>
              {otherName}
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 bg-gray-100 ">
          {loading ? (
             <View className="flex-1 items-center justify-center">
             <ColoreActivityIndicator text="Summoning Bob..." />
             </View>
          ) : messages.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-lg text-gray-400">No messages yet</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item.id as unknown as string}
              contentContainerStyle={{ padding: 16 }}
              style={{ flexGrow: 1 }}
              extraData={messages}
              onContentSizeChange={() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }}
            />
          )}
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          >
            <View className="flex-row items-center p-4 border-t border-gray-200 bg-white" style={{ marginBottom: 20, paddingBottom: 20 }}>
              <TextInput
                className="flex-1 border-[1px] border-gray-300 rounded-[20px] px-4 py-3"
                placeholder="Type a message..."
                value={newMessage}
                multiline
                onChangeText={(text) => setNewMessage(text)}
              />
              <CustomButton
                title="Send"
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
                className="ml-3 w-14 h-10 rounded-full shadow-none"
                fontSize="sm"
                padding={4}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
    </View>
  );
};

export default Conversation;