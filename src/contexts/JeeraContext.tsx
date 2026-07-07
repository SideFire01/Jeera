
import React, { createContext, useContext, ReactNode } from 'react';
import { useJeera } from '../hooks/useJeera';
import { Session } from '@supabase/supabase-js';

type JeeraContextType = ReturnType<typeof useJeera>;

const JeeraContext = createContext<JeeraContextType | undefined>(undefined);

export const JeeraProvider: React.FC<{ session: Session | null; children: ReactNode }> = ({ session, children }) => {
  const jeera = useJeera(session);
  return <JeeraContext.Provider value={jeera}>{children}</JeeraContext.Provider>;
};

export const useJeeraContext = () => {
  const context = useContext(JeeraContext);
  if (!context) {
    throw new Error('useJeeraContext must be used within a JeeraProvider');
  }
  return context;
};
