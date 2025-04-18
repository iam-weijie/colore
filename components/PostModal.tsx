import { useGlobalContext } from "@/app/globalcontext";
import { useSoundEffects, SoundType } from "@/hooks/useSoundEffects"; // Import sound hook
import { icons, temporaryColors } from "@/constants/index";
import { fetchAPI } from "@/lib/fetch";
import { convertToLocal, formatDateTruncatedMonth, getRelativeTime } from "@/lib/utils";
import {
  PostModalProps,
} from "@/types/type";

import { View } from "react-native";

import React from "react";

import ReactNativeModal from "react-native-modal";

import PostContainer from "./PostContainer";

const PostModal: React.FC<PostModalProps> = ({
  isVisible,
  selectedPost,
  handleCloseModal,
  handleUpdate,
  invertedColors = false,
  header,
  isPreview = false,
  infiniteScroll = false,
  scrollToLoad
}) => {
  

  return (
    <ReactNativeModal
    isVisible={isVisible}
    backdropColor={"rgba(0,0,0,0)"}
    backdropOpacity={0}
    onBackdropPress={() => console.log("touched the background")}
  >
    
    <PostContainer 
    selectedPosts={[selectedPost]} 
    handleCloseModal={handleCloseModal} 
    handleUpdate={handleUpdate} 
    invertedColors={invertedColors} 
    isPreview={isPreview}
    header={header}
    infiniteScroll={infiniteScroll}
    scrollToLoad={scrollToLoad} />
    </ReactNativeModal>

  )
}


export default PostModal;
