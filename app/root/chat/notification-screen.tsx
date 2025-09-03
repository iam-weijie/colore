import { useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, Text, View } from "react-native";
import { useAlert } from "@/notifications/AlertContext";
import TabNavigation from "@/components/TabNavigation";
import ItemContainer from "@/components/ItemContainer";
import EmptyListView from "@/components/EmptyList";
import { useNotificationsContext } from "@/app/contexts/NotificationsContext";
import { allColors, icons } from "@/constants/index";
import { fetchAPI } from "@/lib/fetch";
import { Post, PostComment, PostLike } from "@/types/type";

const screenHeight = Dimensions.get("window").height;

declare interface NotificationScreenProps {}

export const NotificationScreen: React.FC<NotificationScreenProps> = () => {
  const { user } = useUser();
  const { showAlert } = useAlert();
  const { storedNotifications, unreadComments, unreadPersonalPosts } =
    useNotificationsContext();

  // Notifications
  const [commentsNotif, setCommentsNotif] = useState<PostComment[]>();
  const [postsNotif, setPostsNotif] = useState<Post[]>();
  const [likesNotif, setLikesNotif] = useState<PostLike[]>();

  // User experience
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteIcon, setShowDeleteIcon] = useState<boolean>(false);

  //Navigation
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [selectedTab, setSelectedTab] = useState<string>(tab ? tab : "Posts");

  const tabs = [
    { name: "Posts", key: "Posts", color: "#CFB1FB", notifications: 0 },
    { name: "Likes", key: "Likes", color: "#CFB1FB" },
    { name: "Comments", key: "Comments", color: "#93c5fd", notifications: 0 },
  ];

  const handleTabChange = (tabKey: string) => {
    console.log("Tab changed to:", tabKey);
    setSelectedTab(tabKey);
    // You can add additional logic here when tabs change
  };

  const removeNotification = (id: string) => {};

  // RENDER LISTS ------ START

  const NotificationItem = ({ item, loading, setShowDeleteIcon }: { 
    item: any; 
    loading: boolean; 
    setShowDeleteIcon: (show: boolean) => void; 
  }) => {
    // Find post info for comments
    let post: { id: any };
    if (item.commenter_username) {
      post = storedNotifications.find((n) =>
        n.comments?.some((comment: any) => comment.id === item.id)
      );
    }

    let label = "";
    let colors: [string, string] = ["#93c5fd", "#93c5fd"];
    let baseColor = "";

    if (item.commenter_username) {
      label = `${item.commenter_username} commented a post`;
      colors = ["#93c5fd", "#FBB1F5"];
    } else if (item.username) {
      if (item.color) { baseColor = allColors.find((c) => c.id == item.color)?.hex ?? "93c5fd"}
      label = `${item.username} sent you a post`;
      colors = [baseColor, "#1FD1F5"];
    } else if (item.liker_username) {
      label = `${item.liker_username} liked your ${item.comment_id ? "comment" : "post"}`;
      colors = ["#FF0000", "#FBB1F5"];
    }

    const fetchPosts = async (id: string) => {
      try {
        const response = await fetchAPI(`/api/posts/getPostsById?ids=${id}`);
        const post = response.data[0];

        if (!post || post.length === 0) {
          return null;
        }

        return post;
      } catch (error) {
        return null;
      }
    };
    console.log("notifItem: ", item)

    return (
      <ItemContainer
        label={label}
        caption={`${item.comment_content ?? item.content ?? item.post_content}`}
        colors={colors}
        icon={
          item.commenter_username
            ? icons.comment
            : item.content
              ? icons.pencil
              : icons.star
        }
        actionIcon={icons.chevron}
        iconColor="#000"
        onPress={() => {
          if (item.recipient_user_id) {
            router.push({
              pathname: "/root/user-board/[id]",
              params: {
                id: `${user!.id}`,
                username: `Personal board`,
                boardId: -1,
                postId: item.id,
              },
            });
          } else if (item.liker_username) {
            fetchPosts(item.post_id).then((post) => {
              router.push({
                pathname: "/root/tabs/profile",
                params: {
                  post: JSON.stringify(post),
                  tab: "Notes",
                },
              });
            });
          } else {
            router.push({
              pathname: "/root/tabs/profile",
              params: {
                post: JSON.stringify(post),
                commentId: item.id,
                tab: "Notes",
              },
            });
          }
        }}
      />
    );
  };

  const renderNotif = ({ item }: { item: any }) => (
    <NotificationItem
      item={item}
      loading={loading}
      setShowDeleteIcon={setShowDeleteIcon}
    />
  );

  // RENDER LIST ------ END

  // USE EFFECT ------- START

  useEffect(() => {
    const commentsArray: PostComment[] = [];
    const postsArray: Post[] = [];
    const likesArray: PostLike[] = [];

    storedNotifications.forEach((notif) => {
      if (notif.comments) {
        commentsArray.push(...notif.comments);
      }
      if (notif.recipient_user_id) {
        postsArray.push(notif);
      }
      if (notif.liker_username) {
        likesArray.push(notif);
      }
    });

    setCommentsNotif(commentsArray);
    setPostsNotif(postsArray);
    setLikesNotif(likesArray);
  }, [storedNotifications]);

  return (
    <View className="flex-1 max-h-[450px] px-6">
      <View className="flex-row items-start justify-between mx-2">
        <TabNavigation
          name="Comments"
          focused={selectedTab === "Comments"}
          onPress={() => setSelectedTab("Comments")}
          notifications={commentsNotif?.length ?? 0}
          color={"#93c5fd"}
        />
        <TabNavigation
          name="Posts"
          focused={selectedTab === "Posts"}
          onPress={() => setSelectedTab("Posts")}
          notifications={postsNotif?.length ?? 0}
          color={"#1FD1F5"}
        />
        <TabNavigation
          name="Likes"
          focused={selectedTab === "Likes"}
          onPress={() => setSelectedTab("Likes")}
          notifications={likesNotif?.length ?? 0}
          color={"#FBB1F5"}
        />
      </View>

      {selectedTab === "Comments" && (
        <FlatList
          className="rounded-[16px]"
          data={commentsNotif}
          contentContainerStyle={{
            paddingBottom: 40,
            minHeight: screenHeight * 0.46,
          }}
          renderItem={renderNotif}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
                  <EmptyListView message={"Damn, it's dead around here? Wanna make a post?"} character="bob" mood={2} />
                }
          showsVerticalScrollIndicator={false}
        />
      )}
      {selectedTab === "Posts" && (
        <FlatList
          className="rounded-[16px]"
          data={postsNotif}
          contentContainerStyle={{
            paddingBottom: 40,
            minHeight: screenHeight * 0.46,
          }}
          renderItem={renderNotif}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
                  <EmptyListView message={"It's drier than the Sahara here... Try making a post, gosh."} character="rosie" mood={1} />
                }
          showsVerticalScrollIndicator={false}
        />
      )}
      {selectedTab === "Likes" && (
        <FlatList
          className="rounded-[16px] "
          data={likesNotif}
          contentContainerStyle={{
            paddingBottom: 40,
            minHeight: screenHeight * 0.46,
          }}
          renderItem={renderNotif}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
                  <EmptyListView message={"No likes? There must be something wrong. Maybe you?"} character="steve" mood={2} scale={1.15} />
                }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default NotificationScreen;
