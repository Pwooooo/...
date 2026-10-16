"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import { useAuth } from "@/context/AuthContext";
import {
  Settings,
  User,
  Sliders,
  Shield,
  Bell,
  Camera,
  Trash2,
  CheckCircle2,
  Save,
  Sparkles,
  ExternalLink,
  History,
  Eye,
} from "lucide-react";
import Link from "next/link";

function BoxToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all cursor-pointer border-2 ${
        checked
          ? "border-white bg-black shadow-sm ring-1 ring-white/10"
          : "border-white/20 bg-[#181818] hover:border-white/40"
      }`}
    >
      <span
        className={`h-3 w-3 rounded-xs bg-white transition-all duration-150 ${
          checked ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
      />
    </button>
  );
}

interface EntropySettings {
  defaultQuality: string;
  autoplay: boolean;
  chapterMarkers: boolean;
  ambientGlow: boolean;
  privateSubscriptions: boolean;
  privatePlaylists: boolean;
  notifyUploads: boolean;
  notifyComments: boolean;
}

const DEFAULT_SETTINGS: EntropySettings = {
  defaultQuality: "Auto",
  autoplay: true,
  chapterMarkers: true,
  ambientGlow: true,
  privateSubscriptions: false,
  privatePlaylists: false,
  notifyUploads: true,
  notifyComments: true,
};

const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile & Identity", icon: User },
  { id: "playback", label: "Playback & Player", icon: Sliders },
  { id: "privacy", label: "Privacy & Data", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function SettingsPage() {
  const { user, openAuthModal, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");

  // Profile form state
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // App settings state
  const [settings, setSettings] = useState<EntropySettings>(DEFAULT_SETTINGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setHandle(user.handle || "");
      setBio(user.bio || "");
      setCountry(user.country || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("entropy_settings");
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // ignore
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.9);
          setAvatarUrl(compressed);
        } else {
          setAvatarUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateUser({
      name: name.trim(),
      handle: handle.trim().replace(/^@/, "").toLowerCase() || "user",
      bio: bio.trim(),
      country: country.trim(),
      avatarUrl: avatarUrl.trim(),
    });

    showToast("Profile identity saved");
  };

  const updateSetting = <K extends keyof EntropySettings>(key: K, value: EntropySettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem("entropy_settings", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    showToast("Preference updated");
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem("entropy_history");
      showToast("Watch history cleared");
    } catch {
      // ignore
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="rounded-3xl bg-[#141414] border border-white/[0.08] p-10 max-w-md w-full text-center flex flex-col items-center shadow-2xl">
              <div className="h-16 w-16 rounded-full bg-white/[0.05] flex items-center justify-center text-white mb-4">
                <Settings className="h-8 w-8 text-zinc-300" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Sign in for Account Settings</h2>
              <p className="text-xs text-zinc-400 mb-6">
                Sign in to customize your Entropy channel, video player preferences, and privacy controls.
              </p>
              <button
                type="button"
                onClick={openAuthModal}
                className="rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-lg"
              >
                Sign In
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden p-4 md:p-8 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-2xl bg-white/[0.08] flex items-center justify-center text-white">
                <Settings className="h-5 w-5 text-zinc-200" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Account Settings</h1>
                <p className="text-xs text-zinc-400">
                  Manage your Entropy identity, player preferences, and security options.
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-6 overflow-x-auto scrollbar-none pb-1">
              {SETTINGS_SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ease-out cursor-pointer ${
                      isActive
                        ? "bg-white/[0.08] text-white shadow-sm"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 1: Profile & Identity */}
          {activeSection === "profile" && (
            <div className="space-y-6">
              <form onSubmit={handleSaveProfile} className="rounded-2xl bg-[#141414] border border-white/[0.08] p-6 space-y-6 shadow-xl">
                <div>
                  <h3 className="text-base font-bold text-white">Channel Identity</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Your public appearance on Entropy video streams and comments.
                  </p>
                </div>

                {/* Avatar Direct Importer */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Profile Avatar
                  </label>
                  <div className="flex items-center gap-5 p-4 rounded-2xl bg-[#0a0a0a] border border-white/[0.08]">
                    <div className="relative h-20 w-20 rounded-full overflow-hidden bg-[#181818] flex-shrink-0 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                      <img
                        src={avatarUrl || "/default-avatar.png"}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageFileSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 rounded-xl bg-white hover:bg-zinc-200 text-black px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>Import Image</span>
                        </button>

                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setAvatarUrl("")}
                            className="flex items-center gap-1.5 rounded-xl bg-[#181818] hover:bg-[#222222] text-zinc-300 hover:text-red-400 border border-white/[0.08] px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Upload directly from your device (PNG, JPG, WebP). Scaled automatically.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Channel Handle
                    </label>
                    <div className="flex items-center rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3.5 py-2.5 focus-within:border-white/20 transition-colors">
                      <span className="text-zinc-500 text-xs font-mono select-none">@</span>
                      <input
                        type="text"
                        required
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        className="w-full bg-transparent text-xs text-white placeholder-zinc-500 outline-none ml-1 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Country / Location
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. United States, United Kingdom, Greece..."
                    className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    About / Bio
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell your audience about yourself or your channel..."
                    className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link
                    href="/profile"
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1.5"
                  >
                    <span>View public channel</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-white hover:bg-zinc-200 text-black px-5 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Profile</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Section 2: Playback & Player */}
          {activeSection === "playback" && (
            <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-6 space-y-6 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white">Player & Playback Preferences</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tune video streaming performance, automatic actions, and visual fidelity.
                </p>
              </div>

              {/* Default Quality */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Default Video Quality</p>
                  <p className="text-xs text-zinc-400">Choose preferred resolution for new video playbacks</p>
                </div>
                <select
                  value={settings.defaultQuality}
                  onChange={(e) => updateSetting("defaultQuality", e.target.value)}
                  className="rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white outline-none cursor-pointer"
                >
                  <option value="Auto">Auto (Adaptive)</option>
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="720p">720p (HD)</option>
                  <option value="480p">480p (Standard)</option>
                </select>
              </div>

              {/* Autoplay Next */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Autoplay Next Video</p>
                  <p className="text-xs text-zinc-400">Automatically play next recommended video when one ends</p>
                </div>
                <BoxToggle
                  checked={settings.autoplay}
                  onChange={() => updateSetting("autoplay", !settings.autoplay)}
                  label="Autoplay Next Video"
                />
              </div>

              {/* Chapter Jump Markers */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-white">In-Player Chapter Markers</p>
                  <p className="text-xs text-zinc-400">Display chapter segments and timestamps on the progress bar</p>
                </div>
                <BoxToggle
                  checked={settings.chapterMarkers}
                  onChange={() => updateSetting("chapterMarkers", !settings.chapterMarkers)}
                  label="In-Player Chapter Markers"
                />
              </div>

              {/* Ambient Glow */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Ambient Glow Lighting</p>
                  <p className="text-xs text-zinc-400">Cast subtle light reflections from video player into the page</p>
                </div>
                <BoxToggle
                  checked={settings.ambientGlow}
                  onChange={() => updateSetting("ambientGlow", !settings.ambientGlow)}
                  label="Ambient Glow Lighting"
                />
              </div>
            </div>
          )}

          {/* Section 3: Privacy & Data */}
          {activeSection === "privacy" && (
            <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-6 space-y-6 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white">Privacy & Channel Visibility</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Control what viewers and other creators see on your profile.
                </p>
              </div>

              {/* Private Subscriptions */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Keep Subscriptions Private</p>
                  <p className="text-xs text-zinc-400">Do not display subscribed channels on your public profile</p>
                </div>
                <BoxToggle
                  checked={settings.privateSubscriptions}
                  onChange={() => updateSetting("privateSubscriptions", !settings.privateSubscriptions)}
                  label="Keep Subscriptions Private"
                />
              </div>

              {/* Private Playlists */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Keep Saved Playlists Private</p>
                  <p className="text-xs text-zinc-400">Hide your created playlists tab from public visitors</p>
                </div>
                <BoxToggle
                  checked={settings.privatePlaylists}
                  onChange={() => updateSetting("privatePlaylists", !settings.privatePlaylists)}
                  label="Keep Saved Playlists Private"
                />
              </div>

              {/* Clear History Actions */}
              <div className="pt-2">
                <p className="text-sm font-semibold text-white mb-2">History & Storage</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="flex items-center gap-2 rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/[0.08] px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>Clear Watch History</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Notifications */}
          {activeSection === "notifications" && (
            <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-6 space-y-6 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white">Notifications & Alerts</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Choose how and when Entropy alerts you to activity.
                </p>
              </div>

              {/* Uploads Notifications */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-white">New Upload Notifications</p>
                  <p className="text-xs text-zinc-400">Get notified when channels you subscribe to post new videos</p>
                </div>
                <BoxToggle
                  checked={settings.notifyUploads}
                  onChange={() => updateSetting("notifyUploads", !settings.notifyUploads)}
                  label="New Upload Notifications"
                />
              </div>

              {/* Comments & Replies */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Comments & Replies</p>
                  <p className="text-xs text-zinc-400">Notify me about activity on my comments and videos</p>
                </div>
                <BoxToggle
                  checked={settings.notifyComments}
                  onChange={() => updateSetting("notifyComments", !settings.notifyComments)}
                  label="Comments & Replies"
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Save Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2.5 rounded-xl font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
