import React from 'react';
import { View } from 'react-native';

const PostIt = () => {
  return (
    <View className="relative items-center">
      <View className="w-40 h-40"> 
        {/* Top Half with Folded Corner */}
        <View
          className="bg-yellow-300 rounded-t-2xl w-full h-[50%] z-10">
          {/* Folded Corner Triangle */}
          <View
            className="absolute right-0 top-0 w-0 h-0 border-t-[35px] border-l-[35px] border-t-[#f2f2f2] border-l-yellow-200 border-r-transparent" 
          />
        </View>

        {/* Bottom Half with Shadow */}
        <View 
          className="bg-yellow-300 rounded-b-2xl w-full h-[50%] shadow-md shadow-elevation " 
          style={{ elevation: 5,
            shadowOffset: {
              width: 0,
              height: 3,
            },
            shadowColor: "#000",
           }}
        />
      </View>
    </View>
  );
};

export default PostIt;
