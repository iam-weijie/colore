"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLikeStatus = exports.handleSubmitPost = exports.isOnlyEmoji = exports.fetchCountryEmoji = exports.distanceBetweenPosts = exports.handleSavePost = exports.handleShare = exports.handlePin = exports.handleReadComments = exports.handleEditing = exports.handleReportPress = void 0;
const Linking = __importStar(require("expo-linking"));
const expo_router_1 = require("expo-router");
const fetch_1 = require("@/lib/fetch");
const FileSystem = __importStar(require("expo-file-system"));
const react_native_1 = require("react-native");
const Haptics = __importStar(require("expo-haptics"));
const date_fns_1 = require("date-fns");
const encryption_1 = require("@/lib/encryption");
const handleReportPress = () => {
    Linking.openURL("mailto:support@colore.ca");
};
exports.handleReportPress = handleReportPress;
const handleEditing = (post) => {
    setTimeout(() => {
        expo_router_1.router.push({
            pathname: "/root/new-post",
            params: {
                postId: post.id,
                content: post.content,
                color: post.color,
                emoji: post.emoji,
            },
        });
    }, 750);
};
exports.handleEditing = handleEditing;
const handleReadComments = async (post, userId) => {
    if (post.user_id === userId) {
        try {
            console.log("Patching comments");
            await (0, fetch_1.fetchAPI)(`/api/posts/updateUnreadComments`, {
                method: "PATCH",
                body: JSON.stringify({
                    clerkId: userId,
                    postId: post === null || post === void 0 ? void 0 : post.id,
                    postUserId: post.user_id,
                }),
            });
        }
        catch (error) {
            console.error("Failed to update unread comments:", error);
        }
    }
};
exports.handleReadComments = handleReadComments;
const handlePin = async (post, isPinned, userId) => {
    try {
        await (0, fetch_1.fetchAPI)(`/api/posts/updatePinnedPost`, {
            method: "PATCH",
            body: JSON.stringify({
                userId: userId,
                postId: post === null || post === void 0 ? void 0 : post.id,
                pinnedStatus: !isPinned,
            }),
        });
    }
    catch (error) {
        console.error("Failed to update handlepin message:", error);
    }
};
exports.handlePin = handlePin;
const handleShare = async (imageUri, post) => {
    var _a, _b;
    if (!imageUri) {
        console.warn("No image to share. Please capture first.");
        return;
    }
    try {
        let imageToShare = imageUri;
        if (react_native_1.Platform.OS === "ios") {
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            imageToShare = `data:image/png;base64,${base64}`;
        }
        const result = await react_native_1.Share.share({
            message: `${(_b = ((_a = post === null || post === void 0 ? void 0 : post.content) !== null && _a !== void 0 ? _a : "")) === null || _b === void 0 ? void 0 : _b.trim()} \n\nDownload Coloré here:https://apps.apple.com/ca/app/coloré/id6738930845`,
            url: imageToShare, // Share the captured image (uri or base64)
        });
        if (result.action === react_native_1.Share.sharedAction) {
            console.log("Shared successfully");
        }
        else if (result.action === react_native_1.Share.dismissedAction) {
            console.log("Share dismissed");
        }
    }
    catch (error) {
        console.error("Error sharing:", error);
    }
};
exports.handleShare = handleShare;
const handleSavePost = async (postId, isSaved, userId) => {
    try {
        await (0, fetch_1.fetchAPI)(`/api/users/updateUserSavedPosts`, {
            method: "PATCH",
            body: JSON.stringify({
                clerkId: userId,
                postId: postId,
                isSaved: isSaved,
            }),
        });
    }
    catch (error) {
        console.error("Failed to update unread message:", error);
    }
};
exports.handleSavePost = handleSavePost;
const distanceBetweenPosts = (x_ref, y_ref, x, y) => {
    const x_diff = x_ref - x;
    const y_diff = y_ref - y;
    const distance = Math.sqrt(x_diff ** 2 + y_diff ** 2);
    return distance;
};
exports.distanceBetweenPosts = distanceBetweenPosts;
const fetchCountryEmoji = async (countryName) => {
    var _a;
    try {
        const response = await fetch(`https://restcountries.com/v3.1/name/${countryName}`);
        const data = await response.json();
        if (!response.ok || !data || data.length === 0) {
            //setError("Country not found.");
            return;
        }
        const countryCode = ((_a = data[0]) === null || _a === void 0 ? void 0 : _a.cca2) || ""; // ISO 3166-1 alpha-2 country code
        const flagEmoji = (countryCode === null || countryCode === void 0 ? void 0 : countryCode.toUpperCase().split("").map((char) => String.fromCodePoint(127397 + char.charCodeAt(0))).join("")) || "📍";
        return flagEmoji;
    }
    catch (err) {
        console.log("Failed fetching country emoji", err);
    }
};
exports.fetchCountryEmoji = fetchCountryEmoji;
const isOnlyEmoji = (message) => {
    // Remove any whitespace
    const trimmed = (message !== null && message !== void 0 ? message : "").trim();
    // Regex to match emojis (including compound ones like flags and skin tones)
    const emojiRegex = /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|\p{Emoji_Presentation}|\p{Emoji_Modifier_Base}|\p{Emoji_Modifier})+$/u;
    // Check that the string is not only digits
    const numberOnlyRegex = /^\d+$/;
    return emojiRegex.test(trimmed) && !numberOnlyRegex.test(trimmed);
};
exports.isOnlyEmoji = isOnlyEmoji;
const handleSubmitPost = async (userId, draftPost, encryptionKey) => {
    if (!draftPost || draftPost.content.trim() === "") {
        console.log("ended up in an error");
        const status = "error";
        return status;
    }
    const stripMarkdown = (text) => {
        return text
            .replace(/^###\s/gm, "")
            .replace(/^##\s/gm, "")
            .replace(/^#\s/gm, "")
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .replace(/\*(.*?)\*/g, "$1")
            .replace(/<u>(.*?)<\/u>/g, "$1")
            .replace(/^1\.\s/gm, "")
            .replace(/^-\s?/gm, "");
    };
    let cleanContent = stripMarkdown(draftPost.content);
    const shouldEncrypt = Boolean(draftPost.recipient_user_id);
    if (shouldEncrypt && encryptionKey) {
        cleanContent = (0, encryption_1.encryptText)(cleanContent, encryptionKey);
    }
    const isUpdate = Boolean(draftPost.id);
    const isPersonal = Boolean(draftPost.recipient_user_id);
    const isPrompt = Boolean(draftPost.prompt_id);
    try {
        if (isUpdate) {
            await (0, fetch_1.fetchAPI)("/api/posts/updatePost", {
                method: "PATCH",
                body: JSON.stringify({
                    postId: draftPost.id,
                    content: draftPost.content,
                    color: draftPost.color,
                    emoji: draftPost.emoji,
                }),
            });
            expo_router_1.router.back();
        }
        else {
            const body = {
                content: cleanContent,
                clerkId: userId,
                color: draftPost.color,
                emoji: draftPost.emoji,
                ...(isPersonal && {
                    recipientId: draftPost.recipient_user_id,
                    boardId: draftPost.board_id,
                    postType: "personal",
                }),
                ...(isPrompt && {
                    promptId: draftPost.prompt_id,
                }),
                expires_at: draftPost.expires_at
                    ? draftPost.expires_at
                    : (0, date_fns_1.addDays)(new Date(), 365).toISOString(),
                available_at: draftPost.available_at
                    ? draftPost.available_at
                    : new Date().toISOString(),
                static_emoji: draftPost.static_emoji,
                reply_to: draftPost.reply_to,
                formatting: shouldEncrypt && encryptionKey
                    ? (0, encryption_1.encryptText)(JSON.stringify(draftPost.formatting), encryptionKey)
                    : draftPost.formatting,
            };
            const response = await (0, fetch_1.fetchAPI)("/api/posts/newPost", {
                method: "POST",
                body: JSON.stringify(body),
            });
            expo_router_1.router.back(); // slight delay for safe stack unwinding
            return response.status === 201 ? "success" : "error";
        }
    }
    catch (error) {
        console.error("Error submitting post:", error);
    }
    finally {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
};
exports.handleSubmitPost = handleSubmitPost;
const fetchLikeStatus = async (post, userId) => {
    var _a, _b;
    try {
        const response = await (0, fetch_1.fetchAPI)(`/api/posts/updateLikeCount?postId=${post}&userId=${userId}`, { method: "GET" });
        if (response.error)
            return;
        const isLiked = (_a = response.data) === null || _a === void 0 ? void 0 : _a.liked;
        const likeCount = (_b = response.data) === null || _b === void 0 ? void 0 : _b.likeCount;
        return { isLiked: isLiked !== null && isLiked !== void 0 ? isLiked : false, likeCount: likeCount !== null && likeCount !== void 0 ? likeCount : 0 };
    }
    catch (error) {
        console.error("Failed to fetch like status:", error);
    }
};
exports.fetchLikeStatus = fetchLikeStatus;
