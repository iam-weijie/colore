import { Animated, Image, ImageSourcePropType, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { BlurView } from "expo-blur";
import ItemContainer from "./ItemContainer";

type MenuItem = {
  label: string;
  source: ImageSourcePropType;
  color?: string;
  onPress: () => void;
};

type DropdownMenuProps = {
  icon?: ImageSourcePropType;
  menuItems: MenuItem[];
  customMenuWidth?: number;
};

const DropdownMenu: React.FC<DropdownMenuProps> = ({ icon, menuItems, customMenuWidth }) => {
  const [visible, setVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<View>(null);
  const menuWidth = customMenuWidth ? customMenuWidth : 100;
  const isMounted = useRef(true);
  const isMounted = useRef(true);

  const slideAnim = useRef(new Animated.Value(300)).current; // Slide down animation
  const opacityAnim = useRef(new Animated.Value(0)).current; // Background fade animation

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handlePress = () => {
    if (triggerRef.current) {
      triggerRef.current.measure((fx, fy, width, height, pageX, pageY) => {
        if (isMounted.current) {
          setMenuPosition({ top: pageY + height, left: pageX + width - menuWidth });
          setVisible(true);
        }
      });
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300, // Slide down
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0, // Fade out background
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (isMounted.current) {
        setVisible(false);
      }
    }); // Hide modal after animation
  };

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300); // Reset before opening
      opacityAnim.setValue(0); // Reset opacity before opening

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0, // Slide into view
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.2, // Fade in background
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <View className="relative">
      {icon ? (
        <TouchableOpacity onPress={handlePress} ref={triggerRef}>
        <Image source={icon} className="w-6 h-6" />
        </TouchableOpacity>
      ) : 
      <TouchableOpacity onPress={handlePress} ref={triggerRef}>
        <View className="flex flex-row justify-center items-center h-6 w-6">
          <View className="w-1 h-1 bg-gray-600 rounded-full mr-1" />
          <View className="w-1 h-1 bg-gray-600 rounded-full mr-1" />
          <View className="w-1 h-1 bg-gray-600 rounded-full" />
        </View>
      </TouchableOpacity>}

      <Modal transparent visible={visible} onRequestClose={handleClose}>
        {/* Background Overlay */}
        <Pressable className="flex-1 " onPress={handleClose}>
          <Animated.View
            style={{ backgroundColor: "black", opacity: opacityAnim }}
            className="flex-1 absolute top-0 left-0 right-0 bottom-0"
          />
        </Pressable>

        {/* Dropdown Menu */}
        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
          className="absolute w-[90%] bottom-0 left-[50%] -ml-[45%] right-0 bg-white rounded-[48px] shadow-lg py-4 px-2  mb-7 overflow-hidden"
        >

          {menuItems.map((item, index) => (
          <View 
          className="-my-2"
          style={{
            transform: "scale(0.9)"
          }}>
            <ItemContainer 
            label={item.label} 
            icon={item.source} 
            colors={[item.color , item.color]} 
            onPress={() => {if (item.label === "Share" || item.label === "Pin" || item.label === "Unpin") {
                  item.onPress();
                  handleClose();
                } else {
                  // For other items, close the menu first
                  handleClose();
                  // Use setTimeout to ensure the menu is closed before executing onPress
                  setTimeout(() => {
                    item.onPress();
                  }, 200);
                }
              }}            />
              </View>
            
          ))}
        </Animated.View>
      </Modal>
    </View>
  );
};

export default DropdownMenu;
