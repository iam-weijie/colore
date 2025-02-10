import React, { createContext, useContext, useState } from "react";
import { Stack } from "@/types/type";

// Initiating GlobalContext
type GlobalContextType = {
    stacks: Stack[];
    setStacks: React.Dispatch<React.SetStateAction<Stack[]>>;
    // Add other global constants here

  };



// Constants
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Exporting GlobalContext

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stacks, setStacks] = useState<Stack[]>([]);
    //const [someOtherConstant, setSomeOtherConstant] = useState<string>("");
  
    return (
      <GlobalContext.Provider value={{ stacks, setStacks }}>
        {children}
      </GlobalContext.Provider>
    );
  };
  
  export const useGlobalContext = () => {
    const context = useContext(GlobalContext);
    if (!context) {
      throw new Error("useGlobalContext must be used within a GlobalProvider");
    }
    return context;
  };