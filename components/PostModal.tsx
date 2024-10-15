import { icons } from "@/constants/index";
import { PostModalProps } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, Href } from "expo-router";
import { useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View, Alert } from "react-native";
import ReactNativeModal from "react-native-modal";
import { fetchAPI } from "@/lib/fetch";

const PostModal: React.FC<PostModalProps> = ({
  isVisible,
  post,
  handleCloseModal,
  handleUpdate,
}) => {
  const [likedPost, setLikedPost] = useState<boolean>(false);
  const { user } = useUser();
  const router = useRouter();
  const route = useRoute();

  const handleDeletePress = async () => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel" },
        { text: "Delete", onPress: handleDelete },
      ]
    );
  }

  const handleDelete = async () => {
    await fetchAPI(`/(api)/(posts)/deletePost?id=${post!.id}`, {
      method: "DELETE"
    });

    Alert.alert("Post deleted successfully.");
    handleCloseModal();
    handleUpdate();
  }

  return (
    <ReactNativeModal isVisible={isVisible}>
      <View className="bg-white px-6 py-4 rounded-2xl min-h-[200px] max-h-[70%] w-[90%] mx-auto">
        <TouchableOpacity onPress={handleCloseModal}>
          <Image className="w-6 h-6 self-end left-3" source={icons.close} />
        </TouchableOpacity>
        {post && post.firstname && user!.id != post.clerk_id && (
          <TouchableOpacity
            onPress={() => {
              handleCloseModal();
              router.push({
                pathname: "/(root)/(profile)/[id]",
                params: { id: post!.clerk_id },
              });
            }}
          >
            <Text>{post.firstname.charAt(0)}</Text>
          </TouchableOpacity>
        )}
        <ScrollView>
          {post && (
            <Text className="text-[16px] mb-2 font-Jakarta">
              {post.content}
            </Text>
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
        {post && post.clerk_id == user?.id && (
          <TouchableOpacity onPress={handleDeletePress}>
            <Text>delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </ReactNativeModal>
  );
};

export default PostModal;
