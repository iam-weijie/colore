import React, { createContext, useContext, useEffect, useState } from "react";
import { Dimensions } from "react-native";

export type DeviceContextType = {
  isIpad: boolean;
};

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const calc = () => Dimensions.get("screen").width > 500;
  const [isIpad, setIsIpad] = useState<boolean>(calc);

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", () => setIsIpad(calc()));
    return () => sub.remove();
  }, []);

  return (
    <DeviceContext.Provider value={{ isIpad }}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDevice must be used within a DeviceProvider");
  return ctx;
};

export default DeviceProvider; 