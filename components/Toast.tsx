"use client";

import React from "react";
import { useLibrary } from "@/context/LibraryContext";

export default function Toast() {
  const { toastMessage } = useLibrary();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
      <div className="bg-[#181d29] border border-amber-500/40 text-amber-100 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-sm">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        <p className="font-medium">{toastMessage}</p>
      </div>
    </div>
  );
}

