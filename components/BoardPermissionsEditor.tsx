import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CustomButton from "@/components/CustomButton";
import { Board } from "@/types/type";

interface BoardPermissionsEditorProps {
  boardInfo: Board | undefined;
  onSave: (restrictions: string[]) => Promise<void>;
  onClose: () => void;
}

export const BoardPermissionsEditor: React.FC<BoardPermissionsEditorProps> = ({
  boardInfo,
  onSave,
  onClose,
}) => {
  const [currentRestrictions, setCurrentRestrictions] = useState<string[]>([]);

  // Enable layout animation on Android
  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (boardInfo) {
      setCurrentRestrictions(boardInfo.restrictions || []);
    }
  }, [boardInfo]);

  const handlePermissionChange = (type: string, value: string) => {
    let newRestrictions = [...currentRestrictions];

    switch (type) {
      case "privacy":
        newRestrictions = newRestrictions.filter((r) => !["Private", "Everyone"].includes(r));
        newRestrictions.push(value);
        break;
      case "comments":
        newRestrictions = newRestrictions.filter((r) => !["commentsAllowed", "commentsDisabled"].includes(r));
        newRestrictions.push(value === "Allowed" ? "commentsAllowed" : "commentsDisabled");
        break;
      case "visibility":
        newRestrictions = newRestrictions.filter((r) => !["invite-needed", "public"].includes(r));
        newRestrictions.push(value === "Invite Only" ? "invite-needed" : "public");
        break;
      case "location":
        newRestrictions = newRestrictions.filter((r) => !["location-needed", "no-location"].includes(r));
        newRestrictions.push(value === "Location Required" ? "location-needed" : "no-location");
        break;
    }

    setCurrentRestrictions(newRestrictions);
  };

  const validateBoardRestrictions = (restrictions: string[], boardType: string) => {
    const errors: string[] = [];

    if (boardType === "personal") {
      const hasPrivacy = restrictions.some((r) => ["Private", "Everyone"].includes(r));
      const hasComments = restrictions.some((r) => ["commentsAllowed", "commentsDisabled"].includes(r));

      if (!hasPrivacy) errors.push("Privacy setting is required for personal boards");
      if (!hasComments) errors.push("Comment setting is required for personal boards");
    }

    if (boardType === "community") {
      const hasVisibility = restrictions.some((r) => ["invite-needed", "public"].includes(r));
      const hasLocation = restrictions.some((r) => ["location-needed", "no-location"].includes(r));
      const hasComments = restrictions.some((r) => ["commentsAllowed", "commentsDisabled"].includes(r));

      if (!hasVisibility) errors.push("Visibility setting is required for community boards");
      if (!hasLocation) errors.push("Location setting is required for community boards");
      if (!hasComments) errors.push("Comment setting is required for community boards");
    }

    return errors;
  };

  const handleSavePermissions = async () => {
    if (boardInfo) {
      const validationErrors = validateBoardRestrictions(currentRestrictions, boardInfo.board_type);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join("\n"));
      }
    }
    await onSave(currentRestrictions);
    onClose?.();
  };

  if (!boardInfo) return null;

  const isPersonalBoard = boardInfo.board_type === "personal";

  const privacyOptions = [
    { label: "Private", description: "Only you can see this board" },
    { label: "Everyone", description: "Anyone can see this board" },
  ];

  const commentOptions = [
    { label: "Allowed", description: "Others can comment on posts" },
    { label: "Disabled", description: "No comments allowed" },
  ];

  const visibilityOptions = [
    { label: "Invite Only", description: "Only invited users can join" },
    { label: "Public", description: "Anyone can discover and join" },
  ];

  const locationOptions = [
    { label: "Location Required", description: "Restrict access to specific area" },
    { label: "No Location", description: "Access from anywhere" },
  ];

  // ---- UI helpers (selection labels) ----
  const selectedPrivacy = useMemo(() => {
    if (currentRestrictions.includes("Private")) return "Private";
    if (currentRestrictions.includes("Everyone")) return "Everyone";
    return "Not set";
  }, [currentRestrictions]);

  const selectedComments = useMemo(() => {
    if (currentRestrictions.includes("commentsAllowed")) return "Allowed";
    if (currentRestrictions.includes("commentsDisabled")) return "Disabled";
    return "Not set";
  }, [currentRestrictions]);

  const selectedVisibility = useMemo(() => {
    if (currentRestrictions.includes("invite-needed")) return "Invite Only";
    if (currentRestrictions.includes("public")) return "Public";
    return "Not set";
  }, [currentRestrictions]);

  const selectedLocation = useMemo(() => {
    if (currentRestrictions.includes("location-needed")) return "Location Required";
    if (currentRestrictions.includes("no-location")) return "No Location";
    return "Not set";
  }, [currentRestrictions]);

  // ---- Collapsible state ----
  const [open, setOpen] = useState({
    privacy: true,
    comments: true,
    visibility: true,
    location: true,
  });

  const toggle = (key: keyof typeof open) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((s) => ({ ...s, [key]: !s[key] }));
  };

  // ---- Section header component (UI only) ----
  const SectionHeader: React.FC<{
    title: string;
    rightLabel?: string;
    isOpen: boolean;
    onPress: () => void;
  }> = ({ title, rightLabel, isOpen, onPress }) => (
    <TouchableOpacity
      className="mb-2 px-3 py-5 rounded-[20px] bg-white border-2"
      style={{ borderColor: "#fafafa80", shadowColor: "#63636388", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-JakartaSemiBold text-gray-800">{title}</Text>

        <View className="flex-row items-center">
          {!!rightLabel && (
            <View className="mr-2 px-2.5 py-1 rounded-full border" style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
              <Text className="text-[12px] font-Jakarta text-gray-600">{rightLabel}</Text>
            </View>
          )}
          <MaterialCommunityIcons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={22}
            color="#9ca3af"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Option card styles (unchanged logic, just consistent visuals)
  const optionCard = (active: boolean) =>
    `p-4 rounded-[24px] mb-2 ${active ? "border-2 border-blue-500 bg-blue-50" : "shadow-sm bg-white border-2 border-[#fafafa80]"}`;

  const optionText = (active: boolean) =>
    `font-JakartaSemiBold ${active ? "text-blue-600" : "text-gray-800"}`;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="px-4 py-6">

        {/* Privacy */}
        <SectionHeader
          title="Privacy"
          rightLabel={selectedPrivacy}
          isOpen={open.privacy}
          onPress={() => toggle("privacy")}
        />
        {open.privacy && (
          <View className="mb-6">
            {privacyOptions.map((option) => {
              const active = currentRestrictions.includes(option.label);
              return (
                <TouchableOpacity
                  key={option.label}
                  className={optionCard(active)}
                  onPress={() => handlePermissionChange("privacy", option.label)}
                  activeOpacity={0.9}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className={optionText(active)}>{option.label}</Text>
                    {active && <MaterialCommunityIcons name="check-circle" size={20} color="#3b82f6" />}
                  </View>
                  <Text className="text-sm text-gray-600 mt-1">{option.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Comments */}
        <SectionHeader
          title="Comments"
          rightLabel={selectedComments}
          isOpen={open.comments}
          onPress={() => toggle("comments")}
        />
        {open.comments && (
          <View className="mb-6">
            {commentOptions.map((option) => {
              const key = option.label === "Allowed" ? "commentsAllowed" : "commentsDisabled";
              const active = currentRestrictions.includes(key);
              return (
                <TouchableOpacity
                  key={option.label}
                  className={optionCard(active)}
                  onPress={() => handlePermissionChange("comments", option.label)}
                  activeOpacity={0.9}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className={optionText(active)}>{option.label}</Text>
                    {active && <MaterialCommunityIcons name="check-circle" size={20} color="#3b82f6" />}
                  </View>
                  <Text className="text-sm text-gray-600 mt-1">{option.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Community-only sections */}
        {!isPersonalBoard && (
          <>
            {/* Visibility */}
            <SectionHeader
              title="Visibility"
              rightLabel={selectedVisibility}
              isOpen={open.visibility}
              onPress={() => toggle("visibility")}
            />
            {open.visibility && (
              <View className="mb-6">
                {visibilityOptions.map((option) => {
                  const key = option.label === "Invite Only" ? "invite-needed" : "public";
                  const active = currentRestrictions.includes(key);
                  return (
                    <TouchableOpacity
                      key={option.label}
                      className={optionCard(active)}
                      onPress={() => handlePermissionChange("visibility", option.label)}
                      activeOpacity={0.9}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className={optionText(active)}>{option.label}</Text>
                        {active && <MaterialCommunityIcons name="check-circle" size={20} color="#3b82f6" />}
                      </View>
                      <Text className="text-sm text-gray-600 mt-1">{option.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Location */}
            <SectionHeader
              title="Location Access"
              rightLabel={selectedLocation}
              isOpen={open.location}
              onPress={() => toggle("location")}
            />
            {open.location && (
              <View className="mb-6">
                {locationOptions.map((option) => {
                  const key = option.label === "Location Required" ? "location-needed" : "no-location";
                  const active = currentRestrictions.includes(key);
                  return (
                    <TouchableOpacity
                      key={option.label}
                      className={optionCard(active)}
                      onPress={() => handlePermissionChange("location", option.label)}
                      activeOpacity={0.9}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className={optionText(active)}>{option.label}</Text>
                        {active && <MaterialCommunityIcons name="check-circle" size={20} color="#3b82f6" />}
                      </View>
                      <Text className="text-sm text-gray-600 mt-1">{option.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Save */}
        <View className="mt-6 w-full items-center justify-center">
          <CustomButton
            className="w-full h-14 rounded-full shadow-none bg-blue-500"
            fontSize="lg"
            title="Save"
            padding={4}
            onPress={handleSavePermissions}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default BoardPermissionsEditor;
