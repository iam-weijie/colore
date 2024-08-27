import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import BackGround from "../../components/BackGround";

const { width, height } = Dimensions.get("window");
const Beach = require("../../assets/images/beach.gif");
const empty_bottle = require("../../assets/images/empty_bottle.png");
const new_parchment = require("../../assets/images/new_parchment.jpg");

export default function HomeScreen() {
  const [showTextInput, setShowTextInput] = useState(false);
  const [text, setText] = useState("");

  const handlePress = () => {
    setShowTextInput(true);
  };

  return (
    <View style={styles.container}>
      <View>
        <BackGround placeholderImageSource={Beach} />
        <Pressable onPress={handlePress}>
          <Image source={empty_bottle} style={styles.emptyBottle}></Image>
        </Pressable>
        {showTextInput && (
          <ImageBackground style={styles.parchment} source={new_parchment}>
            <TextInput
              style={styles.textInput}
              multiline={true}
              placeholder="Type here..."
              onChangeText={setText}
              value={text}
            ></TextInput>
            <Pressable onPress={() => setShowTextInput(false)}>
              <Text style={styles.cancelBtn}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.postBtn,
                text.length === 0 && styles.postBtnDisable,
              ]}
              disabled={text.length === 0}
            >
              <Text style={styles.postBtnText}>Post</Text>
            </Pressable>
          </ImageBackground>
        )}
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

  emptyBottle: {
    height: 60,
    width: 60,
    position: "absolute",
    right: 0,
    bottom: 120,
    transform: [{ rotate: "40deg" }],
  },

  textInput: {
    height: height - 200,
    width: width - 60,
    fontSize: 16,
    position: "absolute",
    top: 150,
    left: 30,
  },

  parchment: {
    height: height,
    width: width,
    position: "absolute",
  },

  cancelBtn: {
    fontSize: 16,
    position: "absolute",
    top: 105,
    left: 16,
  },

  postBtn: {
    backgroundColor: "#007aff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    fontSize: 16,
    position: "absolute",
    top: 99,
    right: 10,
  },

  postBtnText: {
    color: "white",
  },

  postBtnDisable: {
    backgroundColor: "#d3d3d3",
  },
});
