/*import React from "react";
import ActionSheet, {
  SheetProps,
  registerSheet,
  SheetManager,
} from "react-native-actions-sheet";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CreatePromptSheet = (props: SheetProps) => {
  const insets = useSafeAreaInsets();

  return (
    <ActionSheet
      id={props.sheetId}
      safeAreaInsets={insets}
      isModal={true}
      snapPoints={[0, "80%"]}
      initialSnapIndex={1}
      backgroundInteractionEnabled={true}
      containerStyle={{
        backgroundColor: "white",
        padding: 16,
      }}
    >
      <TouchableOpacity
        onPress={() => SheetManager.hide("create-prompt-sheet")}
        style={{
          height: 40,
          width: "100%",
          backgroundColor: "blue",
        }}
      >
        <Text style={{ fontSize: 24, color: "black" }}>✕</Text>
      </TouchableOpacity>
    </ActionSheet>
  );
};

registerSheet("create-prompt-sheet", CreatePromptSheet, "global");
declare module "react-native-actions-sheet" {
  interface Sheets {
    "create-prompt-sheet": React.ComponentType<any>;
  }
}

export {};
*/