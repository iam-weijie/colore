import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const HAPTICS_ENABLED_KEY = "hapticsEnabled";
const SOUND_EFFECTS_ENABLED_KEY = "soundEffectsEnabled";

export type SettingsContextType = {
  hapticsEnabled: boolean;
  setHapticsEnabled: (
    value: boolean | ((prevState: boolean) => boolean)
  ) => void;
  soundEffectsEnabled: boolean;
  setSoundEffectsEnabled: (
    value: boolean | ((prevState: boolean) => boolean)
  ) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const [soundEffectsEnabled, setSoundEffectsEnabledState] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const hapticsSetting = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY);
        const soundSetting = await AsyncStorage.getItem(
          SOUND_EFFECTS_ENABLED_KEY
        );
        if (hapticsSetting !== null)
          setHapticsEnabledState(JSON.parse(hapticsSetting));
        if (soundSetting !== null)
          setSoundEffectsEnabledState(JSON.parse(soundSetting));
      } catch (e) {
        console.error("[SettingsContext] Failed to load settings", e);
      }
    };
    loadSettings();
  }, []);

  // Wrapped setters that also persist to storage
  const setHapticsEnabled: SettingsContextType["setHapticsEnabled"] = (
    value
  ) => {
    const newVal = typeof value === "function" ? value(hapticsEnabled) : value;
    setHapticsEnabledState(newVal);
    AsyncStorage.setItem(HAPTICS_ENABLED_KEY, JSON.stringify(newVal)).catch(
      (e) => console.error("[SettingsContext] Failed to save haptics setting", e)
    );
  };

  const setSoundEffectsEnabled: SettingsContextType["setSoundEffectsEnabled"] = (
    value
  ) => {
    const newVal =
      typeof value === "function" ? value(soundEffectsEnabled) : value;
    setSoundEffectsEnabledState(newVal);
    AsyncStorage.setItem(SOUND_EFFECTS_ENABLED_KEY, JSON.stringify(newVal)).catch(
      (e) =>
        console.error("[SettingsContext] Failed to save sound setting", e)
    );
  };

  return (
    <SettingsContext.Provider
      value={{
        hapticsEnabled,
        setHapticsEnabled,
        soundEffectsEnabled,
        setSoundEffectsEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettingsContext must be used within a SettingsProvider");
  return ctx;
}; 