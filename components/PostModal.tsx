import React from "react";
import { ScrollView, Text, TouchableOpacity, View, Image } from "react-native";
import ReactNativeModal from "react-native-modal";
import { icons } from "@/constants/index";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Post } from "@/types/type";
import { useState } from "react";

interface PostModalProps {
  isVisible: boolean;
  post: Post | null;
  handleCloseModal: () => void;
}

const PostModal: React.FC<PostModalProps> = ({ isVisible, post, handleCloseModal, }) => {
  const [likedPost, setLikedPost] = useState<boolean>(false);

  return (
    <ReactNativeModal isVisible={isVisible}>
      <View className="bg-white px-6 py-4 rounded-2xl min-h-[200px] max-h-[70%] w-[90%] mx-auto"> 
        <TouchableOpacity onPress={handleCloseModal}>
          <Image className="w-6 h-6" source={icons.close} style={{alignSelf: "flex-end"}}/>
        </TouchableOpacity>
        <ScrollView>
          {post && (
            <Text className="text-[16px] mb-2 font-Jakarta">{post.content}</Text>
          )}
        </ScrollView>
        <View className="my-2">
          <TouchableOpacity onPress={() => setLikedPost(!likedPost)}>
            <MaterialCommunityIcons
              name={likedPost ? "heart" : "heart-outline"}
              size={32}
              color={likedPost ? "red" : "black"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </ReactNativeModal>
  );
};

export default PostModal;
