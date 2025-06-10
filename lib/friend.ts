/**
 * Reusable methods that have to do with fetching friends and friend requests.
 * Returns FriendStatus objects (enum) to indicate the status of the friendship.
 *
 * OR returns the requested data.
 */

import { fetchAPI } from "@/lib/fetch";
import { FriendStatus } from "@/lib/enum";

export const acceptFriendRequest = async (
  sender_id: string,
  receiver_id: string
) => {
  try {
    const response = await fetchAPI(`/api/friends/handleFriendRequest`, {
      method: "POST",
      body: JSON.stringify({
        sender_id: sender_id,
        receiver_id: receiver_id,
      }),
    });

    const data = response;
    console.log("data", data);

    if (data.message === "Friend request accepted") {
      // Only delete request if friendship was created
      await fetchAPI(
        `/api/friends/deleteFriendRequest?user_id=${receiver_id}&request_id=${sender_id}`,
        {
          method: "DELETE",
        }
      );
      return FriendStatus.FRIENDS;
    }
  } catch (error) {
    console.error("Failed to accept friend:", error);
    return FriendStatus.UNKNOWN;
  }
};

export const rejectFriendRequest = async (
  sender_id: string,
  receiver_id: string
) => {
  try {
    await fetchAPI(
      `/api/friends/deleteFriendRequest?user_id=${receiver_id}&request_id=${sender_id}`,
      {
        method: "DELETE",
      }
    );
    return FriendStatus.NONE;
  } catch (error) {
    console.error("Failed to reject friend:", error);
    return FriendStatus.UNKNOWN;
  } finally {
    fetchFriends(receiver_id);
  }
};

export const fetchFriendship = async (userId: string, user: { id: string }) => {
  try {
    const response = await fetchAPI(
      `/api/friends/getFriendForUser?user_id=${user.id}&friend_id=${userId}`,
      {
        method: "GET",
      }
    );
    if (response.error) {
      throw new Error(response.error);
    }
    if (response.data.length > 0) {
      return FriendStatus.FRIENDS;
    }
    return FriendStatus.NONE;
  } catch (error) {
    console.error("Failed to fetch friendship:", error);
    return FriendStatus.UNKNOWN;
  }
};

export const unfriend = async (userId: string, friendId: string) => {
  try {
    const response = await fetchAPI(
      `/api/friends/deleteFriendForUser?user_id=${userId}&friend_id=${friendId}`,
      {
        method: "DELETE",
      }
    );
    if (response.error) {
      throw new Error(response.error);
    }
    return FriendStatus.NONE;
  } catch (error) {
    console.error("Failed to delete friendship:", error);
    return FriendStatus.UNKNOWN;
  }
};

export const cancelFriendRequest = async (
  userId: string,
  requestId: string
) => {
  try {
    const response = await fetchAPI(
      `/api/friends/deleteFriendRequest?user_id=${userId}&request_id=${requestId}`,
      {
        method: "DELETE",
      }
    );
    if (response.error) {
      throw new Error(response.error);
    }
    return FriendStatus.NONE;
  } catch (error) {
    console.error("Failed to cancel friend request:", error);
    return FriendStatus.UNKNOWN;
  }
};

export const fetchFriendRequestStatus = async (
  userId: string,
  user: { id: string }
) => {
  try {
    const response = await fetchAPI(
      `/api/friends/getFriendRequestsForUser?user_id=${user.id}&request_id=${userId}`,
      {
        method: "GET",
      }
    );
    if (response.error) {
      throw new Error(response.error);
    }
    if (response.data.length > 0) {
      // check if the requestor is the user or the friend
      // the smaller userId is always UID1
      // if the current user id > userId, then UID2 would indicate
      // that the current user sent the request
      if (response.data[0].requestor === (user.id > userId ? "UID2" : "UID1")) {
        return FriendStatus.SENT;
      } else {
        return FriendStatus.RECEIVED;
      }
    }
    return FriendStatus.NONE;
  } catch (error) {
    console.error("Failed to fetch friendship status:", error);
    return FriendStatus.UNKNOWN;
  }
};

export const fetchFriendStatus = async (
  userId: string,
  user: { id: string }
) => {
  if (user.id === userId) {
    return FriendStatus.UNKNOWN;
  }
  let friendStatus = await fetchFriendship(userId, user);
  if (friendStatus !== FriendStatus.FRIENDS) {
    friendStatus = await fetchFriendRequestStatus(userId, user);
  }
  return friendStatus;
};

export const fetchFriends = async (userId: string) => {
  try {
    const response = await fetchAPI(
      `/api/friends/getFriends?userId=${userId}`,
      {
        method: "GET",
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch friends:", error);
    return [];
  }
};

export const fetchFriendNickname = async (userId: string, friendId: string) => {
  try {
    const response = await fetchAPI(
      `/api/friends/getFriendNickname?userId=${userId}&friendId=${friendId}`,
      {
        method: "GET",
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch friend nickname: ", error);
    return [];
  }
};
