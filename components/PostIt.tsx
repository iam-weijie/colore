import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import ReactNativeModal from "react-native-modal";
import { icons } from "@/constants/index";

interface PostItProps {
  content: string;
  firstname: string; 
  likes_count: number;
  created_at: string;
  report_count: number;
}

const PostIt = ({ content, firstname, likes_count, report_count }: PostItProps) => {
  const [isModalVisible, setModalVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  return (
    <View style={{ marginBottom: 10, marginHorizontal: 5 }}>
      <TouchableOpacity onPress={toggleModal}>
        <View>
          {/* Bottom Half with Shadow */}
          <View className="bg-yellow-300 rounded-b-2xl w-40 h-32 absolute bottom-0 shadow-lg" />

          {/* Top Half without Shadow */}
          <View className="bg-yellow-300 rounded-2xl w-40 h-40" />

          {/* Folded Corner */}
          <View className="absolute right-0 top-0 w-0 h-0 border-t-[36px] border-l-[36px] rounded-bl-md border-t-[#f2f2f2] border-l-yellow-200 border-r-transparent" />
        </View>
      </TouchableOpacity>

      <ReactNativeModal isVisible={isModalVisible}>
      <View className="bg-yellow-300 px-8 py-10 rounded-2xl min-w-[300px] min-h-[400px] max-w-[90%] mx-auto">
          <TouchableOpacity 
            onPress={toggleModal} 
            style={{ position: 'absolute', top: 10, right: 10 }} // Close button positioning
          >
            <Image source={icons.close} className="w-8 h-8"/>
          </TouchableOpacity>
          
        
        <Text className="text-base mb-4">{content}</Text> 
        <Text className="text-lg mb-2">{firstname}</Text> 

        <View>
          <Text>Likes: {likes_count}</Text>
          <Text>Reports: {report_count}</Text>
        </View>
        <TouchableOpacity onPress={toggleModal} className="mt-4"> 

        </TouchableOpacity>
      </View>
    </ReactNativeModal>

    </View>
  );
};

export default PostIt;
