import React, { useState } from "react";
import { View, Text } from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useProfileContext } from "@/app/contexts/ProfileContext";
import { useEncryptionContext } from "@/app/contexts/EncryptionContext";
import { useAlert } from "@/notifications/AlertContext";
import { handlePasswordChange, verifyOldPassword } from "@/lib/passwordChange";
import { fetchAPI } from "@/lib/fetch";
import { migratePersonalPostsEncryption } from "@/lib/migratePersonalPosts";
import { deriveKey } from "@/lib/encryption";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";

const ChangePasswordScreen = () => {
  const { user } = useUser();
  const { profile } = useProfileContext();
  const { encryptionKey, setEncryptionKey } = useEncryptionContext();
  const { showAlert } = useAlert();
  const router = useRouter();
  const navigation = useNavigation();
  const { getToken } = useAuth();
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    navigation.setOptions({ title: "Change Password" });
  }, [navigation]);

  const handleSubmit = async () => {
    if (!user || !profile || !encryptionKey) {
      showAlert({
        title: "Error",
        message: "User session not found. Please log in again.",
        type: "ERROR",
        status: "error",
      });
      return;
    }
    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      showAlert({
        title: "Error",
        message: "Please fill in all password fields.",
        type: "ERROR",
        status: "error",
      });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      showAlert({
        title: "Error",
        message: "New passwords do not match.",
        type: "ERROR",
        status: "error",
      });
      return;
    }
    if (form.newPassword.length < 8) {
      showAlert({
        title: "Error",
        message: "New password must be at least 8 characters long.",
        type: "ERROR",
        status: "error",
      });
      return;
    }
    setLoading(true);
    try {
      if (!profile.salt) {
        throw new Error("User salt not found. Please log out and log back in.");
      }
      const isPasswordCorrect = verifyOldPassword(profile, form.oldPassword, profile.salt);
      if (!isPasswordCorrect) {
        console.log("[ChangePassword] Password verification failed before API call");
        showAlert({
          title: "Error",
          message: "Current password is incorrect.",
          type: "ERROR",
          status: "error",
        });
        setLoading(false);
        return;
      }
      const { newSalt, newEncryptedData } = await handlePasswordChange(
        profile,
        form.oldPassword,
        form.newPassword,
        profile.salt
      );
      // Derive old and new keys for post migration
      const oldKey = deriveKey(form.oldPassword, profile.salt);
      const newKey = deriveKey(form.newPassword, newSalt);
      const token = await getToken();
      const response = await fetchAPI("/api/users/changePassword", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clerkId: user.id,
          newSalt,
          newEncryptedData,
          newPassword: form.newPassword, // Send new password to backend
        }),
      });
      if (response.error && response.error.includes('401')) {
        throw new Error("Your session has expired. Please log in again.");
      }
      if (response.error) {
        throw new Error(response.error);
      }
      // Migrate all personal posts to new encryption key
      const migrationResult = await migratePersonalPostsEncryption({
        userId: user.id,
        oldKey,
        newKey,
        getToken,
      });
      let migrationMsg = `Password changed successfully. All personal posts were migrated.`;
      if (migrationResult.failed > 0) {
        migrationMsg = `Password changed. ${migrationResult.migrated} posts migrated, ${migrationResult.failed} failed. Contact support if you notice missing data.`;
      }
      showAlert({
        title: "Success",
        message: migrationMsg + " Please log in again with your new password.",
        type: "SUCCESS",
        status: "success",
      });
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setEncryptionKey(null);
      router.replace("/auth/log-in");
    } catch (error) {
      let errorMessage = "Failed to change password. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "error" in error &&
        typeof (error as any).error === "string"
      ) {
        errorMessage = (error as any).error;
      }
      showAlert({
        title: "Error",
        message: errorMessage,
        type: "ERROR",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-6 justify-center items-center">
      <View className="w-full">
        <InputField
          label="Current Password"
          placeholder="Enter your current password"
          value={form.oldPassword}
          onChangeText={(text) => setForm((prev) => ({ ...prev, oldPassword: text }))}
          secureTextEntry
          containerStyle="mb-4"
        />
        <InputField
          label="New Password"
          placeholder="Enter your new password"
          value={form.newPassword}
          onChangeText={(text) => setForm((prev) => ({ ...prev, newPassword: text }))}
          secureTextEntry
          containerStyle="mb-4"
        />
        <InputField
          label="Confirm New Password"
          placeholder="Confirm your new password"
          value={form.confirmPassword}
          onChangeText={(text) => setForm((prev) => ({ ...prev, confirmPassword: text }))}
          secureTextEntry
          containerStyle="mb-6"
        />
        <View className="flex-row w-full justify-end">
          <CustomButton
            title={loading ? "Changing..." : "Change Password"}
            onPress={handleSubmit}
            className="w-[60%] h-14 rounded-full"
            disabled={loading}
          />
        </View>
        <Text className="text-xs text-gray-500 text-center mt-4">
          You will be signed out after changing your password and will need to log in again.
        </Text>
      </View>
    </View>
  );
};

export default ChangePasswordScreen;
