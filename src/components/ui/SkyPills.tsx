"use client";

import React from "react";
import BoxTabs, { BoxTabItem, BoxTabsProps } from "./BoxTabs";

export type SkyTabItem = BoxTabItem;
export interface SkyPillsProps extends Omit<BoxTabsProps, "variant" | "fillColor"> {
  variant?: string;
  fillColor?: string;
}

export default function SkyPills({
  variant,
  fillColor,
  ...props
}: SkyPillsProps) {
  return <BoxTabs {...props} />;
}
