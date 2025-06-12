"use strict";
/**
 * Reusable methods that have to do with fetching friends and friend requests.
 * Returns FriendStatus objects (enum) to indicate the status of the friendship.
 *
 * OR returns the requested data.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFriendNickname = exports.fetchFriends = exports.fetchFriendStatus = exports.fetchFriendRequestStatus = exports.cancelFriendRequest = exports.unfriend = exports.fetchFriendship = exports.rejectFriendRequest = exports.acceptFriendRequest = void 0;
const fetch_1 = require("@/lib/fetch");
const enum_1 = require("@/lib/enum");
const acceptFriendRequest = async (sender_id, receiver_id) => {
    try {
        const response = await (0, fetch_1.fetchAPI)(`/api/friends/handleFriendRequest`, {
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
            await (0, fetch_1.fetchAPI)(`/api/friends/deleteFriendRequest?user_id=${receiver_id}&request_id=${sender_id}`, {
                method: "DELETE",
            });
            return enum_1.FriendStatus.FRIENDS;
        }
    }
    catch (error) {
        console.error("Failed to accept friend:", error);
        return enum_1.FriendStatus.UNKNOWN;
    }
};
exports.acceptFriendRequest = acceptFriendRequest;
const rejectFriendRequest = async (sender_id, receiver_id) => {
    try {
        await (0, fetch_1.fetchAPI)(`/api/friends/deleteFriendRequest?user_id=${receiver_id}&request_id=${sender_id}`, {
            method: "DELETE",
        });
        return enum_1.FriendStatus.NONE;
    }
    catch (error) {
        console.error("Failed to reject friend:", error);
        return enum_1.FriendStatus.UNKNOWN;
    }
    finally {
        (0, exports.fetchFriends)(receiver_id);
    }
};
exports.rejectFriendRequest = rejectFriendRequest;
const fetchFriendship = async (userId, user) => {
    try {
        const response = await (0, fetch_1.fetchAPI)(`/api/friends/getFriendForUser?user_id=${user.id}&friend_id=${userId}`, {
            method: "GET",
        });
        if (response.error) {
            throw new Error(response.error);
        }
        if (response.data.length > 0) {
            return enum_1.FriendStatus.FRIENDS;
        }
        return enum_1.FriendStatus.NONE;
    }
    catch (error) {
        console.error("Failed to fetch friendship:", error);
        return enum_1.FriendStatus.UNKNOWN;
    }
};
exports.fetchFriendship = fetchFriendship;
const unfriend = async (userId, friendId) => {
    try {
        const response = await (0, fetch_1.fetchAPI)(`/api/friends/deleteFriendForUser?user_id=${userId}&friend_id=${friendId}`, {
            method: "DELETE",
        });
        if (response.error) {
            throw new Error(response.error);
        }
        return enum_1.FriendStatus.NONE;
    }
    catch (error) {
        console.error("Failed to delete friendship:", error);
        return enum_1.FriendStatus.UNKNOWN;
    }
};
exports.unfriend = unfriend;
const cancelFriendRequest = async (userId, requestId) => {
    try {
        const response = await (0, fetch_1.fetchAPI)(`/api/friends/deleteFriendRequest?user_id=${userId}&request_id=${requestId}`, {
            method: "DELETE",
        });
        if (response.error) {
            throw new Error(response.error);
        }
        return enum_1.FriendStatus.NONE;
    }
    catch (error) {
        console.error("Failed to cancel friend request:", error);
        return enum_1.FriendStatus.UNKNOWN;
    }
};
exports.cancelFriendRequest = cancelFriendRequest;
const fetchFriendRequestStatus = async (userId, user) => {
    try {
        const response = await (0, fetch_1.fetchAPI)(`/api/friends/getFriendRequestsForUser?user_id=${user.id}&request_id=${userId}`, {
            method: "GET",
        });
        if (response.error) {
            throw new Error(response.error);
        }
        if (response.data.length > 0) {
            // check if the requestor is the user or the friend
            // the smaller userId is always UID1
            // if the current user id > userId, then UID2 would indicate
            // that the current user sent the request
            if (response.data[0].requestor === (user.id > userId ? "UID2" : "UID1")) {
                return enum_1.FriendStatus.SENT;
            }
            else {
                return enum_1.FriendStatus.RECEIVED;
            }
        }
        return enum_1.FriendStatus.NONE;
    }
    catch (error) {
        console.error("Failed to fetch friendship status:", error);
        return enum_1.FriendStatus.UNKNOWN;
    }
};
exports.fetchFriendRequestStatus = fetchFriendRequestStatus;
const fetchFriendStatus = async (userId, user) => {
    if (user.id === userId) {
        return enum_1.FriendStatus.UNKNOWN;
    }
    let friendStatus = await (0, exports.fetchFriendship)(userId, user);
    if (friendStatus !== enum_1.FriendStatus.FRIENDS) {
        friendStatus = await (0, exports.fetchFriendRequestStatus)(userId, user);
    }
    return friendStatus;
};
exports.fetchFriendStatus = fetchFriendStatus;
const fetchFriends = async (userId) => {
    try {
        const response = await (0, fetch_1.fetchAPI)(`/api/friends/getFriends?userId=${userId}`, {
            method: "GET",
        });
        return response.data;
    }
    catch (error) {
        console.error("Failed to fetch friends:", error);
        return [];
    }
};
exports.fetchFriends = fetchFriends;
const fetchFriendNickname = async (userId, friendId) => {
    try {
        const response = await (0, fetch_1.fetchAPI)(`/api/friends/getFriendNickname?userId=${userId}&friendId=${friendId}`, {
            method: "GET",
        });
        return response.data;
    }
    catch (error) {
        console.error("Failed to fetch friend nickname: ", error);
        return [];
    }
};
exports.fetchFriendNickname = fetchFriendNickname;
