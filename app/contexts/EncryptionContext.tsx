import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";

const ENCRYPTION_KEY_STORAGE = "encryptionKey";

export type EncryptionContextType = {
  encryptionKey: string | null;
  setEncryptionKey: React.Dispatch<React.SetStateAction<string | null>>;
};

const EncryptionContext = createContext<EncryptionContextType | undefined>(
  undefined
);

export const EncryptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [encryptionKey, setEncryptionKeyState] = useState<string | null>(null);
  const { user } = useUser();
  const { signOut } = useAuth();
  const encryptionKeyRef = useRef(encryptionKey);
  encryptionKeyRef.current = encryptionKey;

  // Load key from storage on mount
  useEffect(() => {
    const loadKey = async () => {
      const savedKey = await AsyncStorage.getItem(ENCRYPTION_KEY_STORAGE);
      if (savedKey !== null) {
        console.log("[EncryptionContext] Loaded encryption key from storage");
        setEncryptionKeyState(savedKey);
      }
    };
    loadKey();
  }, []);

  // Persist key on change
  useEffect(() => {
    if (encryptionKey) {
      AsyncStorage.setItem(ENCRYPTION_KEY_STORAGE, encryptionKey).catch((e) =>
        console.error("[EncryptionContext] Failed to save key", e)
      );
    } else if (encryptionKey === null) {
      AsyncStorage.removeItem(ENCRYPTION_KEY_STORAGE).catch((e) =>
        console.error("[EncryptionContext] Failed to remove key", e)
      );
    }
  }, [encryptionKey]);

  // Ensure key exists shortly after login
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        if (!encryptionKeyRef.current) {
          Alert.alert(
            "Security Issue",
            "Your encryption key could not be set up properly. You'll need to log in again.",
            [
              {
                text: "OK",
                onPress: async () => {
                  try {
                    await signOut();
                    router.replace("/auth/log-in");
                  } catch (error) {
                    console.error("[EncryptionContext] Error signing out:", error);
                  }
                },
              },
            ]
          );
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const setEncryptionKey: EncryptionContextType["setEncryptionKey"] = (
    value
  ) => {
    const newValue = typeof value === "function" ? value(encryptionKey) : value;
    setEncryptionKeyState(newValue);
  };

  return (
    <EncryptionContext.Provider value={{ encryptionKey, setEncryptionKey }}>
      {children}
    </EncryptionContext.Provider>
  );
};

export const useEncryptionContext = () => {
  const ctx = useContext(EncryptionContext);
  if (!ctx)
    throw new Error(
      "useEncryptionContext must be used within an EncryptionProvider"
    );
  return ctx;
}; 