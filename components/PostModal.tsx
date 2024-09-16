import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface PostModalProps {
  visible: boolean;
  onClose: () => void;
  post: Post;
}

interface Post {
  id: number;
  content: string;
  first_name: string;
  last_name: string;
  city: string;
  state: string;
  country: string;
  likes_count: number;
  comments_count: number;
}

const PostModal: React.FC<PostModalProps> = ({ visible, onClose, post }) => {
  const firstNameLetter = post.first_name ? post.first_name.charAt(0) : "";
  if (!post) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={onClose}>
            <Text>Close</Text>
          </TouchableOpacity>
          <Text>{post.content}</Text>
          <Text>
            Posted by: {firstNameLetter}
            {"\n"}
            {post.city}, {post.state}, {post.country}
          </Text>
          <View>
            <Text>Likes: {post.likes_count}</Text>
            <Text>Comments: {post.comments_count}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// TEMPORARY SO IT DOESN'T LOOK HORRIFIC
const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff", // Solid white background for the modal
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
  },
});

export default PostModal;
