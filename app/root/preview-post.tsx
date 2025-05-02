import CustomButton from "@/components/CustomButton";
import PostModal from "@/components/PostModal";
import { temporaryColors } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { Post, PostItColor } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAlert } from '@/notifications/AlertContext';
import * as Haptics from 'expo-haptics';
import { useGlobalContext } from "../globalcontext";
import { handleSubmitPost } from "@/lib/post";
import { useHaptics } from "@/hooks/useHaptics";
 

const PreviewPost = () => {
  const { user } = useUser();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const { showAlert } = useAlert();
  const { triggerHaptic } = useHaptics();
  const { setDraftPost, draftPost } = useGlobalContext();
  const [isPosting, setIsPosting] = useState(false);


  const handleCloseModal = () => {
    setIsVisible(false);
    router.back(); // Single back; assumed this goes to NewPost
  };



  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1">
        <PostModal
          isVisible={isVisible}
          selectedPosts={[draftPost]} // Always a valid Post object
          handleCloseModal={handleCloseModal}
          isPreview={true}
          header={
          
              <View className="flex-1 absolute flex items-center w-full bottom-[10%]">
            <CustomButton
              className="w-[50%] h-16 rounded-full shadow-none bg-black"
              fontSize="lg"
              title="submit"
              padding="0"
              onPress={() => {
                console.log("supposed to submit")
                handleSubmitPost(user!.id, draftPost)}}
              //disabled={!postContent || isPosting}
            />
               <TouchableOpacity
                  onPress={handleCloseModal}
                  className="mt-4"
                >
                  <Text 
                  className="text-white font-JakartaBold text-[16px]"
                  style={{
                    borderBottomWidth: 2,
                    borderBottomColor: "#fff"
                  }}>
                    Go back
                  </Text>
                </TouchableOpacity>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default PreviewPost;
