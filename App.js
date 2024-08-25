import { StatusBar } from "expo-status-bar";
import React from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import BackGround from "./components/BackGround";

const Beach = require("./assets/images/beach.gif");
const { width, height } = Dimensions.get("window");

export default function App() {
  return (
    <View style={styles.container}>
      <View>
        <BackGround placeholderImageSource={Beach} />
        <Image
          source={require("./assets/images/empty_bottle.png")}
          style={styles.image}
        ></Image>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    width: 80,
    height: 80,
    position: "absolute",
    right: 0,
    bottom: 100,
    transform: [{ rotate: "0deg" }],
  },
});
