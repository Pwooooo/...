"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { X, User as UserIcon, LogIn, Lock, Mail, CheckCircle2 } from "lucide-react";

export interface User {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatarUrl?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (userData?: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: "u-current",
  name: "Entropy Creator",
  email: "creator@entropy.stream",
  handle: "entropycreator",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize from localStorage safely
  useEffect(() => {
    try {
      const saved = localStorage.getItem("entropy_user");
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const login = (userData?: Partial<User>) => {
    const newUser: User = {
      ...DEMO_USER,
      ...userData,
    };
    setUser(newUser);
    try {
      localStorage.setItem("entropy_user", JSON.stringify(newUser));
    } catch {
      // ignore
    }
    setIsAuthModalOpen(false);
    showToast(`Welcome back, ${newUser.name}!`);
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("entropy_user");
    } catch {
      // ignore
    }
    showToast("Signed out");
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    const username = nameInput.trim() || emailInput.split("@")[0] || "User";
    login({
      name: username,
      email: emailInput.trim(),
      handle: username.toLowerCase().replace(/[^a-z0-9]/g, ""),
      avatarUrl: DEMO_USER.avatarUrl,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        login,
        logout,
      }}
    >
      {children}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2.5 rounded-xl font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={closeAuthModal}
          />

          <div
            className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 p-6 shadow-2xl text-white z-10 animate-in zoom-in-95 duration-200 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Logo & Heading */}
            <div className="text-center mb-6">
              <img
                src="/entropy-icon.png"
                alt="Entropy"
                className="h-12 w-12 mx-auto mb-3 object-contain"
              />
              <h2 className="text-xl font-bold tracking-tight text-white">
                {authMode === "signin" ? "Sign in to Entropy" : "Create your account"}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                to continue watching, liking, and creating
              </p>
            </div>

            {/* Quick 1-Click Demo Login */}
            <div className="space-y-2.5 mb-5">
              <button
                type="button"
                onClick={() => login()}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black py-2.5 text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-[1.01]"
              >
                <LogIn className="h-4 w-4" />
                <span>Continue as Demo Creator</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  login({
                    name: "Google Explorer",
                    email: "user@gmail.com",
                    handle: "googleuser",
                    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
                  })
                }
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 py-2.5 text-xs font-semibold transition-all cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  login({
                    name: "GitHub Developer",
                    email: "dev@github.com",
                    handle: "ghdeveloper",
                    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
                  })
                }
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 py-2.5 text-xs font-semibold transition-all cursor-pointer"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span>Continue with GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="w-full border-t border-zinc-800" />
              <span className="absolute bg-zinc-950 px-2 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                Or with email
              </span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {authMode === "signup" && (
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white transition-colors"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white transition-colors"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-white hover:bg-zinc-200 text-black py-2.5 text-xs font-bold transition-all cursor-pointer mt-1"
              >
                {authMode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-4 text-center text-xs text-zinc-400">
              {authMode === "signin" ? (
                <span>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthMode("signup")}
                    className="text-white font-bold hover:underline cursor-pointer"
                  >
                    Sign up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthMode("signin")}
                    className="text-white font-bold hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
