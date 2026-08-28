"use client";

import React from "react";
import { useEntitlement } from "@/context/EntitlementContext";

export default function ProBadge() {
  const { isPro, isSupporter } = useEntitlement();

  if (!isPro && !isSupporter) return null;

  if (isPro) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 text-[10px] font-black tracking-wider uppercase shadow-xs select-none">
        <span>★</span>
        <span>PRO</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/35 text-amber-400 text-[10px] font-bold tracking-wider uppercase select-none">
      <span>💛</span>
      <span>Supporter</span>
    </span>
  );
}
