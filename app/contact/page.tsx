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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    if (isSubmitting) return; // Prevent duplicate submissions

    setErrorMessage(null);

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
        throw new Error(data.error || "Failed to deliver message. Please try again.");
      }

      setSubmitted(true);
      showToast("Message sent to Aman Dubey! 📬");
      // Clear form ONLY after verified delivery
      setFormData({
        name: "",
        email: "",
        subject: "Book Recommendation",
        message: "",
      });
      setErrors({});
    } catch (err: any) {
      console.error("Submission error:", err);
      setErrorMessage(err?.message || "Could not send message. Please try again or use direct email.");
      showToast("Submission notice: Please check the details below.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-left">
      {/* -------------------------------------------------------------
       * Hero Section
       * ------------------------------------------------------------- */}
      <div className="max-w-3xl mb-10 sm:mb-14 space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-[11px] font-bold uppercase tracking-widest shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <span>Connect &amp; Collaborate</span>
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-serif text-[var(--foreground)] tracking-tight leading-tight">
          Let&apos;s Build Better <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] bg-clip-text text-transparent">Literature</span> Experiences.
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-normal max-w-2xl">
          Have a rare book recommendation, translation suggestion, partnership inquiry, or technical feedback for Reader&apos;s HUB? Reach out directly.
        </p>
      </div>

      {/* -------------------------------------------------------------
       * Two-Column Layout (Desktop) / Single-Column (Mobile)
       * ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        {/* =========================================================
         * LEFT COLUMN: Direct Contact & Portfolio Showcase
         * ========================================================= */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5">
          {/* Developer Card */}
          <div className="rounded-2xl p-5 sm:p-6 border border-[var(--border)] bg-[var(--card)] shadow-xs hover:border-[var(--accent)]/40 hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between">
            {/* Ambient Background Glow */}
            <div
              className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-[80px] opacity-15 pointer-events-none group-hover:opacity-35 transition-opacity"
              style={{ background: "var(--accent)" }}
            />

            <div className="space-y-3.5 relative z-10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                  <span>👨‍💻</span> Creator
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/25 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online &amp; Active
                </span>
              </div>

              <div className="flex items-center gap-3.5 pt-1">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] text-[var(--primary-foreground)] font-serif font-black text-xl flex items-center justify-center shadow-md shrink-0">
                  AD
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-black text-base sm:text-lg text-[var(--foreground)] truncate">
                    Aman Dubey
                  </h3>
                  <p className="text-[11px] text-[var(--accent)] font-bold truncate">
                    Sole Developer &amp; Architect of Reader&apos;s HUB
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-normal">
                Passionate about high-performance web engineering, digital publishing, and crafting frictionless offline-first reading tools.
              </p>

              <div className="pt-3 border-t border-[var(--border)]/60 flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">⚡ Response:</span> &lt; 24 hours
                </span>
                <span className="px-2 py-0.5 rounded bg-[var(--secondary)] text-[10px] font-bold text-[var(--foreground)] border border-[var(--border)]">
                  Chandigarh 🌐
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Direct Email Card */}
          <div className="rounded-2xl p-5 border border-[var(--border)] bg-[var(--card)] shadow-xs hover:border-[var(--accent)]/40 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <span>✉️</span> Direct Contact
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-bold border border-[var(--accent)]/25">
                Direct Inbox
              </span>
            </div>
            <div className="flex items-center gap-3.5 mt-2">
              <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] text-[var(--accent)] flex items-center justify-center text-lg border border-[var(--border)] flex-shrink-0 group-hover:scale-110 transition-transform">
                ✉️
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-mono font-bold text-[var(--foreground)] truncate">
                  kumaraman19137@gmail.com
                </h4>
                <a
                  href="mailto:kumaraman19137@gmail.com"
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--accent)] font-bold mt-1 hover:underline"
                >
                  <span>Open in Mail Client</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* Interactive 3D Portfolio Card */}
          <div className="rounded-2xl p-5 sm:p-6 border border-[var(--border)] bg-[var(--card)] shadow-xs hover:border-[var(--accent)]/40 hover:shadow-md transition-all relative overflow-hidden group space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <span>⚡</span> Personal Showcase
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-bold border border-violet-500/25">
                3D Web Portfolio
              </span>
            </div>

            <h3 className="font-serif font-black text-base sm:text-lg text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              Interactive 3D Portfolio
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-normal">
              Explore more of my full-stack projects, real-time architectures, and interactive 3D web experiences.
            </p>

            <a
              href="https://aman-portfolio-next.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] hover:opacity-95 text-[var(--primary-foreground)] font-extrabold text-xs shadow-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>Explore My Portfolio</span>
              <span className="text-sm font-mono">→</span>
            </a>
          </div>

          {/* Quick FAQ / Topics Guide */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]/70 text-xs space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              <span>💡 Common Reasons to Connect</span>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[var(--secondary)] text-[var(--foreground)] font-bold">Topics</span>
            </div>
            <ul className="space-y-2 text-[var(--text-secondary)] text-[11.5px]">
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent)] font-bold">📚</span>
                <span>Suggesting books for public domain ingestion</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent)] font-bold">🇮🇳</span>
                <span>Hindi literature curation and OCR quality feedback</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent)] font-bold">🛠️</span>
                <span>Reporting reading glitches or broken PDF coordinates</span>
              </li>
            </ul>
          </div>
        </div>

        {/* =========================================================
         * RIGHT COLUMN: Polished Contact Form
         * ========================================================= */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl p-5 sm:p-8 border border-[var(--border)] shadow-xs bg-[var(--card)] relative">
            {submitted ? (
              /* Verified Delivery Confirmation Card */
              <div className="text-center py-10 space-y-4 animate-scale-up">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
                  ✓
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-serif text-[var(--foreground)]">
                  Message Sent Successfully!
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed font-normal">
                  Your message has been delivered to <strong className="text-[var(--foreground)] font-bold">Aman Dubey</strong> (kumaraman19137@gmail.com). I&apos;ll get back to you soon!
                </p>
                <div className="pt-3">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-[var(--primary-foreground)] text-xs font-bold shadow-md hover:scale-105 transition-transform cursor-pointer"
                  >
                    Send Another Message →
                  </button>
                </div>
              </div>
            ) : (
              /* Interactive Contact Form */
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border)]/60 pb-3">
                  <div>
                    <h3 className="font-serif font-black text-lg sm:text-xl text-[var(--foreground)]">
                      Send a Direct Note
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-normal">
                      Messages are routed straight to kumaraman19137@gmail.com.
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-bold border border-[var(--accent)]/25">
                    Fast Route
                  </span>
                </div>

                {/* Error Notice (Preserves Input) */}
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-2 animate-fade-in">
                    <div className="flex items-start gap-2.5">
                      <span className="text-base flex-shrink-0">⚠️</span>
                      <div className="flex-1">
                        <span className="font-bold block text-rose-300">Notice</span>
                        <p className="leading-relaxed">{errorMessage}</p>
                      </div>
                    </div>
                    <div className="pt-1">
                      <a
                        href={`mailto:kumaraman19137@gmail.com?subject=${encodeURIComponent(`[Reader's HUB] ${formData.subject}`)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`}
                        className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] font-semibold hover:underline"
                      >
                        <span>Send directly via Email Client</span>
                        <span>↗</span>
                      </a>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
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
                      className={`w-full bg-[var(--background)] border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] transition-all focus:outline-none ${
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
                    <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
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
                      className={`w-full bg-[var(--background)] border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] transition-all focus:outline-none ${
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
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
                    Inquiry Topic
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
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
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
                    Message <span className="text-[var(--accent)]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      if (errors.message) setErrors({ ...errors, message: undefined });
                    }}
                    placeholder="Tell us which books you would love to see added, share translation ideas, or send your thoughts..."
                    disabled={isSubmitting}
                    className={`w-full bg-[var(--background)] border rounded-xl p-3.5 text-xs sm:text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] transition-all focus:outline-none resize-y ${
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5 font-medium">
                    <span>🔒</span>
                    <span>Delivered to kumaraman19137@gmail.com</span>
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full sm:w-auto px-7 py-3 rounded-xl text-xs sm:text-[13px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md ${
                      isSubmitting
                        ? "bg-[var(--muted)] text-[var(--text-secondary)] opacity-60 cursor-not-allowed"
                        : "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] hover:opacity-95 text-[var(--primary-foreground)] hover:shadow-lg hover:scale-[1.02]"
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
