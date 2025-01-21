import { icons, temporaryColors } from "@/constants/index";
import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth } from "@/lib/utils";
import { PostItColor, PostModalProps, UserNicknamePair } from "@/types/type";
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
import DropdownMenu from "./DropdownMenu";

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
  const [likeCount, setLikeCount] = useState<number>(post?.like_count || 0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLoadingLike, setIsLoadingLike] = useState<boolean>(false);
  const dateCreated = convertToLocal(new Date(post!.created_at));
  const formattedDate = formatDateTruncatedMonth(dateCreated);
  const postColor = temporaryColors.find(
    (color) => color.name === post.color
  ) as PostItColor;

  // Fetch initial like status when modal opens
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!post?.id || !user?.id) return;

      try {
        const response = await fetchAPI(
          `/api/posts/updateLikeCount?postId=${post.id}&userId=${user.id}`,
          { method: "GET" }
        );

        if (response.error) {
          console.error("Error fetching like status:", response.error);
          return;
        }

        setIsLiked(response.data.liked);
        setLikeCount(response.data.likeCount);
      } catch (error) {
        console.error("Failed to fetch like status:", error);
      }
    };

    fetchLikeStatus();
  }, [post?.id, user?.id]);

  // Handle like/unlike action
  const handleLikePress = async () => {
    if (!post?.id || !user?.id || isLoadingLike) return;

    try {
      setIsLoadingLike(true);
      const increment = !isLiked;

      // Optimistically update UI
      setIsLiked(!isLiked);
      setLikeCount((prev) => (increment ? prev + 1 : prev - 1));

      const response = await fetchAPI(`/api/posts/updateLikeCount`, {
        method: "PATCH",
        body: JSON.stringify({
          postId: post.id,
          userId: user.id,
          increment,
        }),
      });

      if (response.error) {
        // Revert optimistic update if failed
        setIsLiked(isLiked);
        setLikeCount((prev) => (increment ? prev - 1 : prev + 1));

        Alert.alert("Error", "Unable to update like status. Please try again.");
        return;
      }

      // Update with actual server values
      setLikeCount(response.data.likeCount);
      setIsLiked(response.data.liked);
    } catch (error) {
      console.error("Failed to update like status:", error);
      // Revert optimistic update
      setIsLiked(isLiked);
      setLikeCount((prev) => (!isLiked ? prev - 1 : prev + 1));

      Alert.alert(
        "Error",
        "Unable to update like status. Please check your connection."
      );
    } finally {
      setIsLoadingLike(false);
    }
  };

  function findUserNickname(
    userArray: UserNicknamePair[],
    userId: string
  ): number {
    const index = userArray.findIndex((pair) => pair[0] === userId);
    return index;
  }

  const fetchCurrentNickname = async () => {
    try {
      // //console.log("user: ", user!.id);
      const response = await fetchAPI(`/api/users/getUserInfo?id=${user!.id}`, {
        method: "GET",
      });
      if (response.error) {
        //console.log("Error fetching user data");
        ////console.log("response data: ", response.data);
        //console.log("response status: ", response.status);
        // //console.log("response: ", response);
        throw new Error(response.error);
      }
      // //console.log("response: ", response.data[0].nicknames);
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
    try {
      const response = await fetchAPI(`/api/posts/deletePost?id=${post!.id}`, {
        method: "DELETE",
      });

      if (response.error) {
        throw new Error(response.error);
      }

      Alert.alert("Post deleted successfully");
      handleCloseModal();

      if (typeof handleUpdate === "function") {
        // call only if defined (aka refresh needed after deleting post)
        await handleUpdate();
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      Alert.alert("Error", "Failed to delete post. Please try again.");
    }
  };

  const handleCommentsPress = () => {
    handleCloseModal();
    router.push({
      pathname: "/root/post/[id]",
      // send through params to avoid doing another API call for post
      params: {
        id: post!.id,
        clerk_id: post!.clerk_id,
        content: post!.content,
        nickname: nickname,
        firstname: post!.firstname,
        username: post!.username,
        like_count: post!.like_count,
        report_count: post!.report_count,
        created_at: post!.created_at,
        unread_comments: post!.unread_comments,
      },
    });
  };

  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const response = await fetchAPI(
          `/api/posts/updateLikeCount?postId=${post!.id}&userId=${user!.id}`,
          { method: "GET" }
        );

        if (response.error) {
          console.error("Error fetching like status:", response.error);
          return;
        }

        setLikedPost(response.data.liked);
        setLikeCount(response.data.likeCount);
      } catch (error) {
        console.error("Failed to fetch like status:", error);
      }
    };

    if (post && user) {
      fetchLikeStatus();
    }
  }, [post, user]);

  return (
    <ReactNativeModal
      isVisible={isVisible}
      backdropColor={postColor.hex || "rgba(0,0,0,0.5)"}
      backdropOpacity={1}
      onBackdropPress={handleCloseModal}
    >
      <View className="bg-white px-6 py-4 rounded-2xl min-h-[200px] max-h-[70%] w-[90%] mx-auto">
        <TouchableOpacity onPress={handleCloseModal}>
          <Image className="w-6 h-6 self-end left-3" source={icons.close} />
        </TouchableOpacity>

        {/* User info section */}

        {post && post.firstname && user!.id !== post.clerk_id && (
          <TouchableOpacity
            onPress={() => {
              handleCloseModal();
              router.push({
                pathname: "/root/profile/[id]",
                params: { id: post!.clerk_id },
              });
            }}
          >
            {/* <Text className="text-[16px] font-Jakarta font-bold ">
              {nickname
                ? nickname
                : post?.username
                  ? `${post?.username}`
                  : `${post?.firstname?.charAt(0)}.`}
            </Text> */}
          </TouchableOpacity>
        )}
        {/* <Text className="text-[16xp] text-gray-500 font-Jakarta">
          {formattedDate}
        </Text> */}

        <ScrollView>
          <Text className="text-[16px] p-1 my-4 font-Jakarta">
            {post!.content}
          </Text>
        </ScrollView>
        <View className="my-2 flex-row justify-between items-center">
          <View className="flex flex-row items-center">
            <TouchableOpacity onPress={handleCommentsPress}>
              <Image source={icons.comment} className="w-8 h-8" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLikePress}
              disabled={isLoadingLike}
              className="ml-2"
            >
              <MaterialCommunityIcons
                name={isLiked ? "heart" : "heart-outline"}
                size={32}
                color={isLiked ? "red" : "black"}
              />
            </TouchableOpacity>
            {/* Show like count only to post creator */}
            {post && post.clerk_id === user?.id && (
              <Text className="ml-1 text-gray-600">{likeCount}</Text>
            )}
          </View>
          {/* Delete button for post owner */}
          {post && post.clerk_id === user?.id && (
            <DropdownMenu 
              menuItems={[ {label: "Delete", onPress: handleDeletePress} ]}
            />
          )}
        </View>
      </View>
    </ReactNativeModal>
  );
};

export default PostModal;
