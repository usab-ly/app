'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  getIdToken,
} from 'firebase/auth';
import { auth } from '@/server/firebase/clientApp';
import { trpc } from '@/server/trpc/client';

interface AuthContextType {
  googleUser: FirebaseUser | null;
  googleLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setGoogleUser(user);
      setGoogleLoading(false);
      if (user) {
        const token = await getIdToken(user);
        setIdToken(token);
      } else {
        setIdToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const {
    mutate: createProfile,
    isPending: isCreating,
    isSuccess: isCreated,
  } = trpc.profile.createProfile.useMutation({
    onSuccess: () => {
      utils.profile.getProfileByToken.invalidate();
    },
  });

  const { error } = trpc.profile.getProfileByToken.useQuery(
    { idToken: idToken ?? '' },
    {
      enabled: !!idToken && !isCreated,
      retry: false,
    }
  );

  useEffect(() => {
    const shouldCreate = error?.data?.code === 'NOT_FOUND' && googleUser;
    const alreadyWorking = isCreating || isCreated;
    if (shouldCreate && !alreadyWorking) {
      createProfile();
    }
  }, [error, googleUser, createProfile, isCreating, isCreated]);

  return (
    <AuthContext.Provider
      value={{
        googleUser,
        googleLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
