import { icons } from "@/constants/index";
import { fetchAPI } from "@/lib/fetch";
import { PostModalProps } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReactNativeModal from "react-native-modal";

const PostModal: React.FC<PostModalProps> = ({
  isVisible,
  post,
  handleCloseModal,
  handleUpdate,
}) => {
  const [likedPost, setLikedPost] = useState<boolean>(false);
  const { user } = useUser();
  const router = useRouter();

  const handleDeletePress = async () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel" },
      { text: "Delete", onPress: handleDelete },
    ]);
  };

  const handleDelete = async () => {
    await fetchAPI(`/(api)/(posts)/deletePost?id=${post!.id}`, {
      method: "DELETE",
    });

    Alert.alert("Post deleted.");
    handleCloseModal();
    // call only if defined (aka refresh needed after deleting post)
    if (typeof handleUpdate === "function") {
      await handleUpdate();
    }
  };

  return (
    <ReactNativeModal isVisible={isVisible}>
      <View className="bg-white px-6 py-4 rounded-2xl min-h-[200px] max-h-[70%] w-[90%] mx-auto">
        <TouchableOpacity onPress={handleCloseModal}>
          <Image className="w-6 h-6 self-end left-3" source={icons.close} />
        </TouchableOpacity>
        {post && post.firstname && user!.id !== post.clerk_id && (
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
          <Text className="text-[16px] mb-2 font-Jakarta">{post!.content}</Text>
        </ScrollView>
        <View className="my-2 flex-row justify-between items-center">
          <TouchableOpacity onPress={() => setLikedPost(!likedPost)}>
            <MaterialCommunityIcons
              name={likedPost ? "heart" : "heart-outline"}
              size={32}
              color={likedPost ? "red" : "black"}
            />
          </TouchableOpacity>
          {post && post.clerk_id === user?.id && (
            <TouchableOpacity onPress={handleDeletePress}>
              <Image source={icons.trash} className="w-7 h-7" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ReactNativeModal>
  );
};

export default PostModal;
