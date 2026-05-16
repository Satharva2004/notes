import React, { createContext, useContext, useEffect, useState } from "react";
import { api, emailStore, tokenStore } from "@/lib/api";

type User = {
  email: string;
  username?: string;
};

type Profile = {
  full_name: string | null;
};

interface AuthContextType {
  user: User | null;
  session: { access_token: string } | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStore.get();
    const email = emailStore.get();

    if (token && email) {
      setSession({ access_token: token });
      setUser({ email, username: localStorage.getItem("notes_username") || undefined });
      setProfile({ full_name: email.split("@")[0] });
    }

    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    await api.register(email, password, fullName);
    const loginResponse = await api.login(email, password);
    tokenStore.set(loginResponse.access_token);
    emailStore.set(email);
    localStorage.setItem("notes_username", loginResponse.username);
    setSession({ access_token: loginResponse.access_token });
    setUser({ email, username: loginResponse.username });
    setProfile({ full_name: fullName || email.split("@")[0] });
  };

  const signIn = async (email: string, password: string) => {
    const loginResponse = await api.login(email, password);
    tokenStore.set(loginResponse.access_token);
    emailStore.set(email);
    localStorage.setItem("notes_username", loginResponse.username);
    setSession({ access_token: loginResponse.access_token });
    setUser({ email, username: loginResponse.username });
    setProfile({ full_name: email.split("@")[0] });
  };

  const signOut = async () => {
    tokenStore.clear();
    emailStore.clear();
    localStorage.removeItem("notes_username");
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {};

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
