"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Entropy Global Error Caught:", error);
  }, [error]);

  const handleClearAndReload = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("entropy_user_videos");
        localStorage.removeItem("entropy_deleted_video_ids");
        sessionStorage.clear();
      }
    } catch {}
    window.location.href = "/";
  };

  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full bg-black text-white flex flex-col items-center justify-center p-6 text-center select-none antialiased">
        <div className="max-w-md w-full bg-[#141414] border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col items-center shadow-2xl">
          <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-2">
            Application Recovery
          </h1>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            {error?.message || "An unexpected error occurred while loading Entropy."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => reset()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
            <button
              onClick={handleClearAndReload}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.08] text-white font-semibold text-xs hover:bg-white/[0.14] transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Reset & Reload</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
