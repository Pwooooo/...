import React from "react";

interface VerifiedBadgeProps {
  subscribersCount?: number;
  className?: string;
  forceShow?: boolean;
}

export default function VerifiedBadge({
  subscribersCount,
  className = "h-3.5 w-3.5",
  forceShow = false,
}: VerifiedBadgeProps) {
  const isVerified =
    forceShow || (typeof subscribersCount === "number" && subscribersCount >= 100000);

  if (!isVerified) return null;

  return (
    <img
      src="/checkmark.png"
      alt="Verified (100k+ subscribers)"
      title="Verified (100k+ subscribers)"
      className={`inline-block object-contain flex-shrink-0 select-none ${className}`}
      draggable={false}
    />
  );
}
