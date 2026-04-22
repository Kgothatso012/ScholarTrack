import React, { createContext, useContext, useState } from 'react';

interface DeepLinkContextValue {
  confirmationError: string | null;
  setConfirmationError: (error: string | null) => void;
}

export const DeepLinkContext = createContext<DeepLinkContextValue>({
  confirmationError: null,
  setConfirmationError: () => {},
});

export function DeepLinkProvider({ children }: { children: React.ReactNode }) {
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  return (
    <DeepLinkContext.Provider value={{ confirmationError, setConfirmationError }}>
      {children}
    </DeepLinkContext.Provider>
  );
}

export function useDeepLink() {
  return useContext(DeepLinkContext);
}
