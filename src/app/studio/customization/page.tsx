"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Wand2,
  Camera,
  Image as ImageIcon,
  Check,
  Upload,
  Globe,
  ExternalLink,
  Sparkles,
  User,
  Plus,
  Trash2,
} from "lucide-react";

export default function StudioCustomizationPage() {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"branding" | "basic">("branding");

  // Form states
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [handle, setHandle] = useState(user?.handle || "");
  const [description, setDescription] = useState(user?.bio || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || "/default-avatar.png");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);

  const [links, setLinks] = useState<{ title: string; url: string }[]>([
    { title: "Website", url: "https://entropy.video" },
    { title: "GitHub", url: "https://github.com/YourUsername/YourProject" },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      setHandle((user.handle || "").replace(/^@/, ""));
      setAvatarPreview(user.avatarUrl || "/default-avatar.png");
    }

    if (typeof window !== "undefined") {
      try {
        const savedBanner = localStorage.getItem("entropy_channel_banner");
        if (savedBanner) setBannerPreview(savedBanner);
        const savedBio = localStorage.getItem("entropy_channel_bio");
        if (savedBio) setDescription(savedBio);
        const savedLinks = localStorage.getItem("entropy_channel_links");
        if (savedLinks) {
          const parsed = JSON.parse(savedLinks);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleaned = parsed.map((item: { title: string; url: string }) => {
              if (item.url && (item.url.includes("Pwooooo") || item.url.includes("..."))) {
                return { ...item, url: "https://github.com/YourUsername/YourProject" };
              }
              return item;
            });
            setLinks(cleaned);
          }
        }
      } catch {}
    }
  }, [user]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatarPreview(dataUrl);
      showToast("Profile photo selected");
    };
    reader.readAsDataURL(file);
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBannerPreview(dataUrl);
      showToast("Banner image selected");
    };
    reader.readAsDataURL(file);
  };

  const handleAddLink = () => {
    setLinks([...links, { title: "", url: "" }]);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!displayName.trim()) {
      showToast("Channel name cannot be empty");
      return;
    }

    // Persist to user context & storage
    try {
      if (updateUser) {
        updateUser({
          name: displayName.trim(),
          handle: handle.trim(),
          avatarUrl: avatarPreview,
        });
      }

      if (bannerPreview) {
        localStorage.setItem("entropy_channel_banner", bannerPreview);
      }
      if (description) {
        localStorage.setItem("entropy_channel_bio", description.trim());
      }
      localStorage.setItem("entropy_channel_links", JSON.stringify(links));
    } catch {}

    showToast("Changes published to your channel");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full bg-white text-black font-semibold text-xs px-4 py-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Channel customization</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Customize your channel branding, profile icon, header banner, and public bio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/@${(handle || "creator").replace(/^@/, "")}`}
            className="px-4 py-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            View channel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all shadow cursor-pointer active:scale-95"
          >
            <Check className="h-4 w-4" />
            <span>Publish changes</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("branding")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "branding"
              ? "bg-white text-black shadow"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          Branding
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("basic")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "basic"
              ? "bg-white text-black shadow"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          Basic Info
        </button>
      </div>

      {/* Tab: Branding */}
      {activeTab === "branding" && (
        <div className="space-y-6">
          {/* 1. Picture */}
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-sm text-white">Picture</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Your profile picture will appear where your channel is presented on Entropy, like next to your videos and comments.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-2">
              <div className="h-28 w-28 rounded-full overflow-hidden bg-zinc-800 border-2 border-white/10 shadow-xl flex-shrink-0">
                <img
                  src={avatarPreview}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
              </div>

              <div className="space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                  It is recommended to use a picture that is at least 98 x 98 pixels and 4MB or less. Use a PNG or JPEG file.
                </p>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
                  >
                    Change photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarPreview("/default-avatar.png")}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Banner Image */}
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-sm text-white">Banner image</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                This image will appear across the top of your channel page on all devices.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="relative aspect-[16/5] w-full rounded-2xl overflow-hidden bg-gradient-to-r from-zinc-900 to-zinc-800 border border-white/10 shadow-inner flex items-center justify-center">
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center text-zinc-500 p-4">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-semibold">No banner uploaded</p>
                    <p className="text-[11px] opacity-70">2048 x 1152 pixels recommended</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={bannerInputRef}
                  onChange={handleBannerSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  {bannerPreview ? "Change banner" : "Upload banner"}
                </button>
                {bannerPreview && (
                  <button
                    type="button"
                    onClick={() => setBannerPreview("")}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Video Watermark */}
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-6 shadow-xl flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-white">Video branding watermark</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Show channel avatar icon in the bottom-right corner of your video player.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setWatermarkEnabled(!watermarkEnabled);
                showToast(!watermarkEnabled ? "Watermark enabled" : "Watermark disabled");
              }}
              className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                watermarkEnabled
                  ? "bg-white text-black shadow"
                  : "bg-white/10 text-zinc-400"
              }`}
            >
              {watermarkEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Basic Info */}
      {activeTab === "basic" && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-6 shadow-xl space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full max-w-lg rounded-xl bg-[#1e1e1e] border border-white/[0.08] focus:border-white/30 p-2.5 text-xs text-white outline-none"
                placeholder="Channel display name"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Choose a channel name that represents you and your content.
              </p>
            </div>

            {/* Handle */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Handle
              </label>
              <div className="relative max-w-lg">
                <span className="absolute left-3 top-2.5 text-xs text-zinc-500">@</span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                  className="w-full rounded-xl bg-[#1e1e1e] border border-white/[0.08] focus:border-white/30 py-2.5 pl-7 pr-3 text-xs text-white outline-none font-mono"
                  placeholder="handle"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                https://entropy.video/@{handle || "handle"}
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full max-w-2xl rounded-xl bg-[#1e1e1e] border border-white/[0.08] focus:border-white/30 p-3 text-xs text-white outline-none resize-none leading-relaxed"
                placeholder="Tell viewers about your channel. Your description will appear in the About section of your channel and search results."
              />
            </div>

            {/* Links */}
            <div>
              <div className="flex items-center justify-between mb-1.5 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-white">
                    Links
                  </label>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Share external links (like your website, GitHub, or social profiles) with your viewers.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-zinc-500 font-semibold">
                  {links.length}/5
                </span>
              </div>

              <div className="space-y-2.5 max-w-2xl mt-3">
                {links.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-zinc-500">
                    No links added yet. Click &quot;Add link&quot; below to add links to your channel.
                  </div>
                ) : (
                  links.map((link, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all"
                    >
                      <div className="w-1/3 min-w-[120px]">
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => {
                            const next = [...links];
                            next[idx].title = e.target.value;
                            setLinks(next);
                          }}
                          placeholder="Title (e.g. GitHub)"
                          className="w-full rounded-xl bg-[#181818] border border-white/[0.08] focus:border-white/30 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => {
                            const next = [...links];
                            next[idx].url = e.target.value;
                            setLinks(next);
                          }}
                          placeholder="https://..."
                          className="w-full rounded-xl bg-[#181818] border border-white/[0.08] focus:border-white/30 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none font-mono text-[11px] transition-colors"
                        />
                      </div>

                      {/* Test link external button */}
                      {link.url && link.url.startsWith("http") && (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="Open link in new tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}

                      {/* Delete link */}
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        className="p-2 rounded-xl hover:bg-white/10 text-zinc-500 hover:text-white cursor-pointer transition-colors"
                        title="Remove link"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}

                {links.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer mt-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add link</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
