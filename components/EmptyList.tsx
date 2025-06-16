import React, { useEffect, useState } from "react"
import { Image, View, Text } from "react-native"
import { characters, characterMood } from "@/constants"


interface EmptyListViewProps {
    scale?: number,
    message: string;
    character?: keyof typeof characterMood, 
    mood?: number
}

const EmptyListView: React.FC<EmptyListViewProps> = ({ scale = 1, character = "bob", message, mood = 0}) => {

    const selectedCharacter = characterMood[character][mood] || []

    return (
        <View className="flex-1 flex-col items-center justify-center gap-6 px-6">
            <Image 
            source={selectedCharacter}
            className="w-20 h-20"
            />
            <Text className="text-center text-[14px] font-Jakarta text-gray-800">
                {message}
            </Text>

        </View>
    )
}

export default EmptyListView;