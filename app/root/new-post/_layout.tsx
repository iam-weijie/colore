import { Stack } from "expo-router";
import React from "react";

export default function NewPostLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="personal"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="temporary"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="global"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="prompt"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

