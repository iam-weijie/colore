import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AlertNotification from "@/components/Alert"; // your existing component

// Extend status to include 'info'
type AlertStatus = "success" | "error" | "warning" | "info";

export type AlertOptions = {
  title: string;
  message: string;
  status: AlertStatus;
  duration?: number; // milliseconds
  action?: () => void;
  color?: string; // override color
  actionText?: string;
};

type AlertContextType = {
  showAlert: (options: AlertOptions) => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alertOptions, setAlertOptions] = useState<AlertOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const defaultColors: Record<AlertStatus, string> = {
    success: "#4BB543",
    error: "#D63447",
    warning: "#FFA500",
    info: "#2678C2",
  };

  const showAlert = (options: AlertOptions) => {
    // assign default color if none provided
    const color = options.color ?? defaultColors[options.status];
    setAlertOptions({ ...options, color });
    setVisible(true);

    // auto-hide after duration
    const timeout = setTimeout(() => {
      setVisible(false);
    }, options.duration ?? 2000);

    // cleanup if showing another alert
    return () => clearTimeout(timeout);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alertOptions && visible && (
        <AlertNotification
          title={alertOptions.title}
          message={alertOptions.message}
          status={alertOptions.status}
          duration={alertOptions.duration}
          action={alertOptions.action}
          actionText={alertOptions.actionText}
          color={alertOptions.color}
          onClose={hideAlert}
        />
      )}
    </AlertContext.Provider>
  );
};
