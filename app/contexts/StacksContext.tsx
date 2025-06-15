import React, { createContext, useContext, useState } from "react";
import { Stacks } from "@/types/type";

export type StacksContextType = {
  stacks: Stacks[];
  setStacks: React.Dispatch<React.SetStateAction<Stacks[]>>;
};

const StacksContext = createContext<StacksContextType | undefined>(undefined);

export const StacksProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [stacks, setStacks] = useState<Stacks[]>([]);

  return (
    <StacksContext.Provider value={{ stacks, setStacks }}>
      {children}
    </StacksContext.Provider>
  );
};

export const useStacks = () => {
  const ctx = useContext(StacksContext);
  if (!ctx) {
    throw new Error("useStacks must be used within a StacksProvider");
  }
  return ctx;
};

export default StacksProvider; 