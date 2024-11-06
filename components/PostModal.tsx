import { icons } from "@/constants/index";
import { fetchAPI } from "@/lib/fetch";
import { PostModalProps, UserNicknamePair } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  const [nickname, setNickname] = useState<string>("");

  function findUserNickname(
    userArray: UserNicknamePair[],
    userId: string
  ): number {
    const index = userArray.findIndex((pair) => pair[0] === userId);
    return index;
  }

  const fetchCurrentNickname = async () => {
    try {
      // console.log("user: ", user!.id);
      const response = await fetchAPI(
        `/(api)/(users)/getUserInfo?id=${user!.id}`,
        {
          method: "GET",
        }
      );
      if (response.error) {
        console.log("Error fetching user data");
        console.log("response data: ", response.data);
        console.log("response status: ", response.status);
        // console.log("response: ", response);
        throw new Error(response.error);
      }
      // console.log("response: ", response.data[0].nicknames);
      const nicknames = response.data[0].nicknames || [];
      return findUserNickname(nicknames, post!.clerk_id) === -1
        ? ""
        : nicknames[findUserNickname(nicknames, post!.clerk_id)][1];
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };
  useEffect(() => {
    const getData = async () => {
      const data = await fetchCurrentNickname();
      setNickname(data);
    };
    getData();
  }, [user]);

  const handleDeletePress = async () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel" },
      { text: "Delete", onPress: handleDelete },
    ]);
  };

  const handleDelete = async () => {
    await fetchAPI(`/(api)/(posts)/deletePostComments?id=${post!.id}`, {
      method: "DELETE",
    });

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

  const handleCommentsPress = () => {
    handleCloseModal();
    router.push({
      pathname: "/(root)/(post)/[id]",
      // send through params to avoid doing another API call for post
      params: {
        id: post!.id,
        clerk_id: post!.clerk_id,
        content: post!.content,
        nickname: nickname,
        firstname: post!.firstname,
        like_count: post!.like_count,
        report_count: post!.report_count,
        created_at: post!.created_at,
      },
    });
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
            <Text className="text-[16px] mb-2 font-Jakarta font-bold">
              {nickname ? nickname : `${post?.firstname?.charAt(0)}.`}
            </Text>
          </TouchableOpacity>
        )}
        <ScrollView>
          <Text className="text-[16px] mb-2 font-Jakarta">{post!.content}</Text>
        </ScrollView>
        <View className="my-2 flex-row justify-between items-center">
          <View className="flex flex-row items-center">
            <TouchableOpacity onPress={handleCommentsPress}>
              <Image source={icons.comment} className="w-8 h-8" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLikedPost(!likedPost)}
              className="ml-2"
            >
              <MaterialCommunityIcons
                name={likedPost ? "heart" : "heart-outline"}
                size={32}
                color={likedPost ? "red" : "black"}
              />
            </TouchableOpacity>
          </View>
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
