"use client";

import React, { useState } from "react";
import { useLibrary } from "@/context/LibraryContext";

export default function ContactPage() {
  const { showToast } = useLibrary();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Book Recommendation",
    message: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fallbackMailto, setFallbackMailto] = useState<string | null>(null);

  const validate = () => {
    const newErrors: { name?: string; email?: string; message?: string } = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = "Please enter your name (minimum 2 characters).";
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please provide a valid email address.";
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = "Please write a message of at least 10 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFallbackMailto(null);

    if (!validate()) {
      showToast("Please check the form for errors.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.fallbackMailto) {
          setFallbackMailto(data.fallbackMailto);
        } else {
          setFallbackMailto(
            `mailto:kumaraman19137@gmail.com?subject=${encodeURIComponent(
              `[Reader's HUB] ${formData.subject}`
            )}&body=${encodeURIComponent(
              `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
            )}`
          );
        }
        throw new Error(data.error || "Failed to deliver email. Please try again or email directly.");
      }

      setSubmitted(true);
      showToast("Message delivered to Aman Dubey! 📬");
      // Clear form ONLY upon verified server delivery
      setFormData({
        name: "",
        email: "",
        subject: "Book Recommendation",
        message: "",
      });
      setErrors({});
    } catch (err: any) {
      console.error("Submission error:", err);
      setServerError(err?.message || "Could not deliver email. Your entered text has been saved.");
      showToast("Delivery notice: Please check the options below.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-left">
      {/* -------------------------------------------------------------
       * Hero Section
       * ------------------------------------------------------------- */}
      <div className="max-w-3xl mb-12 sm:mb-16 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-bold uppercase tracking-widest shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <span>Connect &amp; Collaborate</span>
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serif text-[var(--foreground)] tracking-tight">
          Let&apos;s Build Better Literature Experiences.
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed font-normal">
          Have a rare book recommendation, translation suggestion, partnership inquiry, or technical feedback for Reader&apos;s HUB? Reach out directly.
        </p>
      </div>

      {/* -------------------------------------------------------------
       * Two-Column Layout (Desktop) / Single-Column (Mobile)
       * ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* =========================================================
         * LEFT COLUMN: Direct Contact & Portfolio Showcase
         * ========================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Developer Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-[var(--border)] bg-[var(--card)] shadow-xl relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div
              className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-[80px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"
              style={{ background: "var(--accent)" }}
            />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--primary)] to-[var(--accent-secondary)] text-[var(--primary-foreground)] font-serif font-bold text-xl flex items-center justify-center shadow-md">
                  AD
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[var(--foreground)]">
                    Aman Dubey
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">
                    Creator &amp; Sole Developer of Reader&apos;s HUB
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-normal">
                Passionate about high-performance web engineering, digital publishing, and crafting frictionless reading tools.
              </p>

              <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Response Time: &lt; 24h</span>
                </span>
                <span>Bengaluru / Global 🌐</span>
              </div>
            </div>
          </div>

          {/* Interactive Direct Email Card */}
          <div className="glass-card rounded-3xl p-6 border border-[var(--border)] bg-[var(--card)] shadow-xl hover:border-[var(--accent)]/50 transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] text-[var(--accent)] flex items-center justify-center text-lg border border-[var(--border)] flex-shrink-0 group-hover:scale-110 transition-transform">
                ✉️
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-secondary)]">
                  Direct Email
                </span>
                <h4 className="text-sm font-bold text-[var(--foreground)] truncate mt-0.5">
                  kumaraman19137@gmail.com
                </h4>
                <a
                  href="mailto:kumaraman19137@gmail.com"
                  className="inline-flex items-center gap-1 text-xs text-[var(--accent)] font-semibold mt-2 hover:underline"
                >
                  <span>Open in Mail Client</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* Interactive 3D Portfolio Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-[var(--border)] bg-[var(--card)] shadow-xl hover:border-[var(--accent)]/50 transition-all relative overflow-hidden group">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--secondary)] text-[var(--accent)] text-[10px] font-bold uppercase tracking-wider border border-[var(--border)]">
                <span>⚡</span>
                <span>Personal Showcase</span>
              </div>
              <h3 className="font-serif font-bold text-lg text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                Interactive 3D Portfolio
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-normal">
                Explore more of my full-stack projects, real-time architectures, and interactive 3D web experiences.
              </p>

              <a
                href="https://aman3dportfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between w-full p-3 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-xs shadow-lg hover:shadow-[0_0_18px_var(--theme-glow)] transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Explore my Portfolio</span>
                <span className="text-sm font-mono">→</span>
              </a>
            </div>
          </div>

          {/* Quick FAQ / Topics Guide */}
          <div className="p-5 rounded-3xl bg-[var(--secondary)]/40 border border-[var(--border)]/70 text-xs space-y-2">
            <h5 className="font-bold font-serif text-[var(--foreground)] text-xs uppercase tracking-wider">
              Common Reasons to Reach Out:
            </h5>
            <ul className="space-y-1.5 text-[var(--text-secondary)] text-[11px]">
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent)]">📚</span>
                <span>Suggesting books for our upcoming public domain ingestion</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent)]">🇮🇳</span>
                <span>Hindi literature curation and OCR quality feedback</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent)]">🛠️</span>
                <span>Reporting reading glitches or broken PDF coordinates</span>
              </li>
            </ul>
          </div>
        </div>

        {/* =========================================================
         * RIGHT COLUMN: Polished Contact Form
         * ========================================================= */}
        <div className="lg:col-span-7">
          <div className="glass-card rounded-3xl p-6 sm:p-10 border border-[var(--border)] shadow-2xl bg-[var(--card)] relative">
            {submitted ? (
              /* Verified Delivery Confirmation Card */
              <div className="text-center py-12 space-y-4 animate-scale-up">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 text-3xl flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
                  ✓
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--foreground)]">
                  Message Sent Successfully!
                </h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed font-normal">
                  Your message has been delivered to <strong className="text-[var(--foreground)]">Aman Dubey</strong> (kumaraman19137@gmail.com). I&apos;ll get back to you soon!
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-md hover:scale-105 transition-transform cursor-pointer"
                  >
                    Send Another Message →
                  </button>
                </div>
              </div>
            ) : (
              /* Interactive Contact Form */
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-xl text-[var(--foreground)]">
                    Send a Direct Note
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-normal">
                    Fill in the details below. Messages are routed straight to kumaraman19137@gmail.com.
                  </p>
                </div>

                {/* Server Alert (Preserves Input + One-Click Mailto Fallback) */}
                {serverError && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2 animate-fade-in">
                    <div className="flex items-start gap-2.5">
                      <span className="text-base flex-shrink-0">⚠️</span>
                      <div className="flex-1">
                        <span className="font-bold block text-amber-300">Delivery Notice</span>
                        <p className="leading-relaxed">{serverError}</p>
                      </div>
                    </div>

                    {fallbackMailto && (
                      <div className="pt-2">
                        <a
                          href={fallbackMailto}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          <span>Send Pre-Filled via Mail App</span>
                          <span>↗</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">
                      Your Name <span className="text-[var(--accent)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: undefined });
                      }}
                      placeholder="e.g. Rahul Sharma"
                      disabled={isSubmitting}
                      className={`w-full bg-[var(--background)] border rounded-2xl px-4 py-3 text-xs sm:text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] transition-all focus:outline-none ${
                        errors.name
                          ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30"
                          : "border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30"
                      }`}
                    />
                    {errors.name && (
                      <span className="text-[11px] text-rose-400 mt-1 block font-medium">
                        {errors.name}
                      </span>
                    )}
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">
                      Email Address <span className="text-[var(--accent)]">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      placeholder="name@example.com"
                      disabled={isSubmitting}
                      className={`w-full bg-[var(--background)] border rounded-2xl px-4 py-3 text-xs sm:text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] transition-all focus:outline-none ${
                        errors.email
                          ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30"
                          : "border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30"
                      }`}
                    />
                    {errors.email && (
                      <span className="text-[11px] text-rose-400 mt-1 block font-medium">
                        {errors.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Topic / Subject Select */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">
                    Inquiry Topic
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl px-4 py-3 text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    <option value="Book Recommendation">📚 Suggest a Rare / Classic Book</option>
                    <option value="Hindi Literature Feedback">🇮🇳 Hindi Literature &amp; OCR Quality</option>
                    <option value="Feature / Reader Improvement">✨ Reader Feature Suggestion</option>
                    <option value="Portfolio & Collaboration">💼 Collaboration / Project Inquiry</option>
                    <option value="Bug Report">🐛 Broken PDF / Bug Report</option>
                    <option value="General Note">☕ General Note</option>
                  </select>
                </div>

                {/* Message Body */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">
                    Message <span className="text-[var(--accent)]">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      if (errors.message) setErrors({ ...errors, message: undefined });
                    }}
                    placeholder="Tell us which books you would love to see added, share translation ideas, or send your thoughts..."
                    disabled={isSubmitting}
                    className={`w-full bg-[var(--background)] border rounded-2xl p-4 text-xs sm:text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] transition-all focus:outline-none resize-y ${
                      errors.message
                        ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30"
                        : "border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30"
                    }`}
                  />
                  {errors.message && (
                    <span className="text-[11px] text-rose-400 mt-1 block font-medium">
                      {errors.message}
                    </span>
                  )}
                </div>

                {/* Form Footer & Submit Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                    <span>🔒</span>
                    <span>Delivered to kumaraman19137@gmail.com</span>
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xl ${
                      isSubmitting
                        ? "bg-[var(--muted)] text-[var(--text-secondary)] opacity-60 cursor-not-allowed"
                        : "bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] hover:shadow-[0_0_20px_var(--theme-glow)] hover:scale-105"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Sending message...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
