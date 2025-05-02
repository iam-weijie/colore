import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const LandingPage: React.FC = () => {
    return (
        <View className="flex-1 items-center justify-center bg-white">
            <Text className="text-2xl font-bold text-gray-800">Submission Successful!</Text>
            <Text className="text-lg text-gray-600 mt-4 text-center">
                Thank you for your submission. We have received your information successfully.
            </Text>
            <TouchableOpacity className="mt-6 bg-blue-500 px-6 py-3 rounded-full" onPress={() => {}}>
                <Text className="text-white text-lg font-medium">Go Back to Home</Text>
            </TouchableOpacity>
        </View>
    );
};

export default LandingPage;