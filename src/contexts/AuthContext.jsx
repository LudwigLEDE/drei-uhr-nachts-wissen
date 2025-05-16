// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../supabaseClient"; // Stellen Sie sicher, dass der Pfad korrekt ist

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data: { user: currentUser }, error }) => {
        if (error) {
          console.warn(
            "Fehler beim Abrufen des Benutzers (getUser):",
            error.message
          );
        }
        setUser(currentUser ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.error(
          "Kritischer Fehler in supabase.auth.getUser Promise:",
          error
        );
        setUser(null);
        setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (
          loading &&
          (_event === "INITIAL_SESSION" ||
            _event === "SIGNED_IN" ||
            _event === "SIGNED_OUT")
        ) {
          setLoading(false);
        }
      }
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []); // Leer lassen, damit es nur beim Mounten ausgeführt wird

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    signInAnonymously: () => supabase.auth.signInAnonymously(), // NEUE FUNKTION
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
