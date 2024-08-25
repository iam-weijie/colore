import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View } from "react-native";
import BackGround from "./components/BackGround";

const Beach = require("./assets/images/beach.gif");

export default function App() {
  return (
    <View style={styles.container}>
      <View>
        <BackGround placeholderImageSource={Beach} />
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
});
