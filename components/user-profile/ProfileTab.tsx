// ProfileTab.tsx
import React from "react";
import { View } from "react-native";
import PostContainer from "../post-container/PostContainer";
import EmptyPostsView from "./EmptyPostsView";
import { Post } from "@/types/type";

type Props = {
  isOwnProfile: boolean;
  userId: string;
  personalPosts: Post[];
  profileLoading: boolean;
  disableInteractions: boolean;
};

const ProfileTab: React.FC<Props> = ({
  isOwnProfile,
  userId,
  personalPosts,
  profileLoading,
  disableInteractions,
}) => {
  return (
    <View className="flex-1">
      <View className={`absolute -top-[20%]`}>
        {!profileLoading && personalPosts.length > 0 ? (
          <PostContainer
            selectedPosts={personalPosts}
            handleCloseModal={() => {}}
            isPreview={disableInteractions}
          />
        ) : (
          <EmptyPostsView isOwnProfile={isOwnProfile} userId={userId} />
        )}
      </View>
    </View>
  );
};

export default ProfileTab;
