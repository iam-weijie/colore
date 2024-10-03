import { NavigationContextType } from "@/types/type";
import React, { createContext, useContext, useState } from "react";

// allows maintenance of state across multiple screens
// helpful to preserve user-entered values even if they navigate away from that screen
// must wrap the component in the NavigationProvider component
// then set or access the state variables by using the hook:
// const { state, setState } = useNavigationContext(); // Access context state and setter

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

// component that will pass context to children
export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [stateVars, setStateVars] = useState<any>({}); // any state variables

  return (
    <NavigationContext.Provider value={{ stateVars, setStateVars }}>
      {children}
    </NavigationContext.Provider>
  );
};

// hook to use navigation context inside of navigation provider
// can ONLY be used inside the navigation provider
export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error(
      "useNavigationContext must be used within a NavigationProvider"
    );
  }
  return context;
};
