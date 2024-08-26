import { StatusBar } from "expo-status-bar";
import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import BackGround from "../../components/BackGround";

const Beach = require("../../assets/images/beach.gif");

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View>
        <BackGround placeholderImageSource={Beach} />
        <Pressable onPress={() => console.log("Home")}>
          <Image
            source={require("../../assets/images/empty_bottle.png")}
            style={styles.image}
          ></Image>
        </Pressable>
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
    height: 60,
    width: 60,
    position: "absolute",
    right: 0,
    bottom: 120,
    transform: [{ rotate: "40deg" }],
  },
});
