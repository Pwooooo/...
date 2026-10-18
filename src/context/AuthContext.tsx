"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { X, User as UserIcon, Lock, Mail, CheckCircle2, AtSign } from "lucide-react";
import {
  saveRegisteredUser,
  validateDisplayName,
  validateHandle,
  suggestHandleFromName,
  getRegisteredUsers,
} from "@/lib/user-validation";
import { syncUserChannelInfo } from "@/lib/video-storage";

export interface User {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatarUrl?: string;
  avatar?: string;
  bio?: string;
  country?: string;
  joinedAt?: string;
  subscribersCount?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (userData?: Partial<User>) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function formatJoinedDate(timestamp?: number) {
  const d = timestamp ? new Date(timestamp) : new Date();
  return `Joined ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [handleInput, setHandleInput] = useState("");
  const [handleManuallyEdited, setHandleManuallyEdited] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize from localStorage safely
  useEffect(() => {
    const syncUser = () => {
      try {
        const saved = localStorage.getItem("entropy_user");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            if (!parsed.name) parsed.name = "User";
            if (!parsed.handle) {
              parsed.handle = String(parsed.name).toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
            }
            if (!parsed.joinedAt) {
              let jAt = "";
              if (typeof parsed.id === "string" && parsed.id.startsWith("u-")) {
                const ts = parseInt(parsed.id.replace("u-", ""), 10);
                if (!isNaN(ts) && ts > 1500000000000) {
                  jAt = formatJoinedDate(ts);
                }
              }
              parsed.joinedAt = jAt || formatJoinedDate();
            }
            if (!parsed.avatarUrl && !parsed.avatar) {
              parsed.avatarUrl = "/default-avatar.png";
              parsed.avatar = "/default-avatar.png";
            }
            setUser(parsed as User);
            saveRegisteredUser(parsed as User);
            syncUserChannelInfo(parsed as User);
          }
        }
      } catch {
        // ignore
      }
    };

    syncUser();

    if (typeof window !== "undefined") {
      window.addEventListener("storage", syncUser);
      window.addEventListener("entropy_user_updated", syncUser);
      return () => {
        window.removeEventListener("storage", syncUser);
        window.removeEventListener("entropy_user_updated", syncUser);
      };
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const login = (userData?: Partial<User>) => {
    const username = userData?.name || "User";
    const id = userData?.id || `u-${Date.now()}`;

    let userJoinedAt = userData?.joinedAt;
    if (!userJoinedAt) {
      if (id.startsWith("u-")) {
        const ts = parseInt(id.replace("u-", ""), 10);
        if (!isNaN(ts) && ts > 1500000000000) {
          userJoinedAt = formatJoinedDate(ts);
        }
      }
      if (!userJoinedAt) {
        userJoinedAt = formatJoinedDate();
      }
    }

    const cleanHandle = (userData?.handle || username.toLowerCase().replace(/[^a-z0-9]/g, "") || "user").replace(/^@/, "");

    const newUser: User = {
      id,
      name: username,
      email: userData?.email || "user@entropy.stream",
      handle: cleanHandle,
      avatarUrl: userData?.avatarUrl || "/default-avatar.png",
      avatar: userData?.avatar || userData?.avatarUrl || "/default-avatar.png",
      bio: userData?.bio || "",
      country: userData?.country || "",
      joinedAt: userJoinedAt,
    };
    setUser(newUser);
    saveRegisteredUser(newUser);

    try {
      localStorage.setItem("entropy_user", JSON.stringify(newUser));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_user_updated"));
      }
    } catch {
      // ignore
    }
    syncUserChannelInfo(newUser);
    setIsAuthModalOpen(false);
    showToast(`Welcome, ${newUser.name}!`);
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("entropy_user");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_user_updated"));
      }
    } catch {
      // ignore
    }
    showToast("Signed out");
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const cleanHandle = userData.handle ? userData.handle.replace(/^@/, "").toLowerCase() : prev.handle;
      const updated = { ...prev, ...userData, handle: cleanHandle };
      saveRegisteredUser(updated);
      try {
        localStorage.setItem("entropy_user", JSON.stringify(updated));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("entropy_user_updated"));
        }
      } catch {
        // ignore
      }
      syncUserChannelInfo(updated);
      return updated;
    });
    showToast("Profile updated");
  };

  const openAuthModal = () => {
    setAuthError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthError(null);
    setEmailInput("");
    setPasswordInput("");
    setNameInput("");
    setHandleInput("");
    setHandleManuallyEdited(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authMode === "signup") {
      const nameVal = validateDisplayName(nameInput);
      if (!nameVal.valid) {
        setAuthError(nameVal.error || "Display name must be 3–20 characters.");
        return;
      }

      const handleVal = validateHandle(handleInput);
      if (!handleVal.valid) {
        setAuthError(handleVal.error || "Invalid handle.");
        return;
      }

      if (!emailInput.trim()) {
        setAuthError("Email address is required.");
        return;
      }

      login({
        id: `u-${Date.now()}`,
        name: nameInput.trim(),
        email: emailInput.trim(),
        handle: handleVal.cleanHandle!,
        avatarUrl: "",
        avatar: "",
      });
    } else {
      if (!emailInput.trim()) return;
      const cleanLogin = emailInput.trim().toLowerCase().replace(/^@/, "");
      const registered = getRegisteredUsers();
      const existing = registered.find(
        (u) =>
          u.email?.toLowerCase() === cleanLogin ||
          (u.handle && u.handle.toLowerCase() === cleanLogin)
      );

      if (existing) {
        login(existing);
      } else {
        const username = emailInput.split("@")[0] || "User";
        login({
          id: `u-${Date.now()}`,
          name: username,
          email: emailInput.trim(),
          handle: suggestHandleFromName(username),
          avatarUrl: "",
          avatar: "",
        });
      }
    }

    setEmailInput("");
    setPasswordInput("");
    setNameInput("");
    setHandleInput("");
    setHandleManuallyEdited(false);
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
        updateUser,
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
            className="relative w-full max-w-sm rounded-3xl bg-[#141414] border border-white/[0.08] p-6 shadow-2xl text-white z-10 animate-in zoom-in-95 duration-200 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={closeAuthModal}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
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

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0a0a0a] border border-white/[0.08] mb-5">
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  authMode === "signin"
                    ? "bg-white text-black shadow font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  authMode === "signup"
                    ? "bg-white text-black shadow font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-xs text-red-200">
                {authError}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {authMode === "signup" && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-zinc-400">Name</span>
                      <span className="text-[10px] font-mono text-zinc-500">{nameInput.length}/20</span>
                    </div>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="text"
                        required
                        minLength={3}
                        maxLength={20}
                        placeholder="Your Name (3–20 characters)"
                        value={nameInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNameInput(val);
                          if (!handleManuallyEdited) {
                            setHandleInput(suggestHandleFromName(val));
                          }
                        }}
                        className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-zinc-400">Username / Handle</span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {handleInput.replace(/^@/, "").length}/30
                      </span>
                    </div>
                    <div className="relative flex items-center rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3 py-2 focus-within:border-white/20 transition-colors">
                      <span className="text-zinc-500 text-xs font-mono select-none">@</span>
                      <input
                        type="text"
                        required
                        minLength={3}
                        maxLength={30}
                        placeholder="handle (e.g. user_123)"
                        value={handleInput.replace(/^@/, "")}
                        onChange={(e) => {
                          setHandleManuallyEdited(true);
                          setHandleInput(e.target.value);
                        }}
                        className="w-full bg-transparent text-xs text-white placeholder-zinc-500 outline-none ml-1 font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                      3–30 chars. Letters, numbers, and _ - . · (cannot start/end with separators). Unique.
                    </p>
                  </div>
                </>
              )}

              <div>
                {authMode === "signup" && (
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Email address
                  </label>
                )}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type={authMode === "signup" ? "email" : "text"}
                    required
                    placeholder={authMode === "signup" ? "Email address" : "Email or @username"}
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              <div>
                {authMode === "signup" && (
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Password
                  </label>
                )}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-white hover:bg-zinc-200 text-black py-2.5 text-xs font-bold transition-all cursor-pointer mt-2"
              >
                {authMode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            {/* Toggle Mode Footer */}
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
