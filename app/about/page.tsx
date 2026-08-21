import React from "react";
import { Metadata } from "next";
import { BOOKS, CATEGORIES } from "@/data/books";
import AboutClient from "@/components/about/AboutClient";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Reader's HUB — a public, barrier-free digital reading platform built by Aman Dubey to preserve and share timeless literature.",
};

export default function AboutPage() {
  const totalBooks = BOOKS.length;
  const totalCategories = CATEGORIES.filter((c) => c !== "All").length;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <AboutClient
        totalBooks={totalBooks}
        totalCategories={totalCategories}
      />
    </main>
  );
}
