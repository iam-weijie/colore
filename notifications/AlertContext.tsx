import React, { createContext, useContext, useState, ReactNode } from 'react';
import AlertNotification from '@/components/Alert'; // your existing component


type AlertStatus = 'success' | 'error' | 'warning';

type AlertOptions = {
  title: string;
  message: string;
  type: string;
  status: AlertStatus;
  duration?: number;
  action?: () => void;
  color?: string;
  actionText?: string;
};

type AlertContextType = {
  showAlert: (options: AlertOptions) => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alertOptions, setAlertOptions] = useState<AlertOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = (options: AlertOptions) => {
    setAlertOptions(options);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alertOptions && visible && (
        <AlertNotification
          {...alertOptions}
          duration={alertOptions.duration ?? 2000}
          onClose={hideAlert}
        />
      )}
    </AlertContext.Provider>
  );
};
