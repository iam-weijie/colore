import React, { createContext, useContext, useState } from "react";

export type ReplyScrollContextType = {
  replyTo: string | null;
  setReplyTo: React.Dispatch<React.SetStateAction<string | null>>;
  scrollTo: string | null;
  setScrollTo: React.Dispatch<React.SetStateAction<string | null>>;
};

const ReplyScrollContext = createContext<ReplyScrollContextType | undefined>(
  undefined
);

export const ReplyScrollProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [scrollTo, setScrollTo] = useState<string | null>(null);

  return (
    <ReplyScrollContext.Provider
      value={{ replyTo, setReplyTo, scrollTo, setScrollTo }}
    >
      {children}
    </ReplyScrollContext.Provider>
  );
};

export const useReplyScroll = () => {
  const ctx = useContext(ReplyScrollContext);
  if (!ctx)
    throw new Error("useReplyScroll must be used within a ReplyScrollProvider");
  return ctx;
}; 