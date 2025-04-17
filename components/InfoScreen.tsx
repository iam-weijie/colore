import React from 'react';
import { Text, Image, TouchableOpacity, ScrollView, View } from 'react-native';
import { InfoScreenProps } from '@/types/type';
import CustomButton from './CustomButton';

const InfoScreen: React.FC<InfoScreenProps> = ({
  title,
  subtitle,
  image,
  content,
  onAgree,
}) => {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 w-full h-full bg-[#FAFAFA] p-6">
      <View className="items-center justify-center">
        {image && <Image source={image} className="w-44 h-44 mb-6" resizeMode="contain" />}

        <Text className="text-center text-2xl font-bold mb-2">{title}</Text>

        {subtitle && <Text className="text-center text-lg font-semibold mb-4">{subtitle}</Text>}

        <Text className="text-center text-base text-gray-700 leading-relaxed mb-10">
          {content}
        </Text>

        <CustomButton
                className="w-[50%] h-16 rounded-full shadow-none bg-black mb-6"
                fontSize="lg"
                title="Explore"
                padding="0"
                onPress={onAgree}
              />
      </View>
    </ScrollView>
  );
};

export default InfoScreen;
