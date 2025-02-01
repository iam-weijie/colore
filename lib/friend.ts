/**
 * Reusable methods that have to do with fetching friends and friend requests.
 * Returns FriendStatus objects (enum) to indicate the status of the friendship.
 */

import { fetchAPI } from "@/lib/fetch";
import { FriendStatus } from "@/lib/enum";

export const acceptFriendRequest = async (
  userId: string,
  user: { id: string }
) => {
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
    console.error("Failed to accept friend:", error);
    return FriendStatus.UNKNOWN;
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
    console.error("Failed to fetch user data:", error);
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
      if (response.data[0].requestor === user.id) {
        return FriendStatus.SENT;
      } else {
        return FriendStatus.RECEIVED;
      }
    }
    return FriendStatus.NONE;
  } catch (error) {
    console.error("Failed to fetch user data:", error);
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
