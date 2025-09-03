import { router } from "expo-router";

export interface PostNavigationParams {
  postId?: string;
  content?: string;
  color?: string;
  emoji?: string;
  recipientId?: string;
  username?: string;
  expiration?: string;
  prompt?: string;
  promptId?: string;
  boardId?: string;
}

export const navigateToPost = (params: PostNavigationParams) => {
  // Determine the appropriate route based on parameters
  let route = "/root/new-post";
  
  if (params.postId) {
    route = "/root/new-post/edit";
  } else if (params.prompt) {
    route = "/root/new-post/prompt";
  } else if (params.recipientId) {
    route = "/root/new-post/personal";
  } else if (params.expiration) {
    route = "/root/new-post/temporary";
  } else {
    route = "/root/new-post/global";
  }
  
  router.push({
    pathname: route,
    params,
  });
};

export const navigateToNewPost = (params: PostNavigationParams = {}) => {
  router.push({
    pathname: "/root/new-post",
    params,
  });
};

export const navigateToEditPost = (params: PostNavigationParams) => {
  router.push({
    pathname: "/root/new-post/edit",
    params,
  });
};

export const navigateToPersonalPost = (params: PostNavigationParams) => {
  router.push({
    pathname: "/root/new-post/personal",
    params,
  });
};

export const navigateToTemporaryPost = (params: PostNavigationParams) => {
  router.push({
    pathname: "/root/new-post/temporary",
    params,
  });
};

export const navigateToGlobalPost = (params: PostNavigationParams = {}) => {
  router.push({
    pathname: "/root/new-post/global",
    params,
  });
};

export const navigateToPromptPost = (params: PostNavigationParams) => {
  router.push({
    pathname: "/root/new-post/prompt",
    params,
  });
};

