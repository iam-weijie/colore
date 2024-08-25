import React from "react";
import { Dimensions, Image, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

export default function BackGround({ placeholderImageSource }) {
  return <Image source={placeholderImageSource} style={styles.image} />;
}

const styles = StyleSheet.create({
  image: {
    width: width,
    height: height,
  },
});
