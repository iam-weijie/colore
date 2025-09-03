// NotesTab.tsx
import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PostGallery from "@/components/PostGallery";
import ColoreActivityIndicator from "../ColoreActivityIndicator";
import { Post } from "@/types/type";
import { useBackgroundColor, useTextColor, useThemeColors } from "@/hooks/useTheme";

type Props = {
  query: string;
  setQuery: (v: string) => void;
  loading: boolean;
  postsDecrypted: boolean;
  userPosts: Post[];
  currentUserId: string;
  handlePostUpdate: (id: number, isRemove?: boolean) => void;
  loadMorePosts: () => void;
  isLoadingMore: boolean;
  hasMore: boolean;
};

const NotesTab: React.FC<Props> = ({
  query,
  setQuery,
  loading,
  postsDecrypted,
  userPosts,
  currentUserId,
  handlePostUpdate,
  loadMorePosts,
  isLoadingMore,
  hasMore,
}) => {
  const handleClearSearch = () => setQuery("");
  const colors = useThemeColors();
  const backgroundColor = useBackgroundColor()
  const textColor = useTextColor()

  return (
    <View 
    className="relative flex-1 w-full h-full "
    style={{
      backgroundColor: backgroundColor
    }}>
      <View
        className="absolute flex flex-row items-center bg-white rounded-[24px] px-4 h-12 w-[85%] top-6 self-center z-[10] "
        style={{
          backgroundColor: colors.surfaceSecondary,
          boxShadow: "0 0 7px 1px rgba(120,120,120,.1)" }}
      >
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          className="flex-1 pl-2 text-md "
          placeholder="Looking for a note..?"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} className="w-6 h-6 items-center justify-center">
            <Ionicons name="close-circle" size={20} color={colors.textSecondary}  />
          </TouchableOpacity>
        )}
      </View>

      {loading && !postsDecrypted ? (
        <View className="flex-1 items-center justify-center">
          <ColoreActivityIndicator />
        </View>
      ) : (
        <View className="flex-1 h-full w-full px-4 -mt-12">
          <PostGallery
            posts={userPosts}
            profileUserId={currentUserId}
            handleUpdate={handlePostUpdate}
            query={query}
            offsetY={120}
            onLoadMore={loadMorePosts}
            isLoading={isLoadingMore}
            hasMore={hasMore}
          />
        </View>
      )}
    </View>
  );
};

export default NotesTab;
