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
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) {
      showToast("Please fill in your name and message.");
      return;
    }

    setSubmitted(true);
    showToast("Thank you! Your feedback has been received. 📚");
    setFormData({
      name: "",
      email: "",
      subject: "Book Recommendation",
      message: "",
    });
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-semibold uppercase tracking-wider mb-4">
          <span>📬</span>
          <span>Reader Community</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[var(--foreground)] tracking-tight mb-4">
          Get in Touch
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)]">
          Have a book suggestion, translation feedback, or a question about Reader&apos;s HUB? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-[var(--border)] shadow-2xl bg-[var(--card)]">
        {submitted ? (
          <div className="text-center py-12 space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-3xl flex items-center justify-center mx-auto text-emerald-400">
              ✓
            </div>
            <h2 className="text-2xl font-bold font-serif text-[var(--foreground)]">
              Message Received!
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
              Thank you for helping us make Reader&apos;s HUB better. Your literary suggestion has been recorded.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-md hover:opacity-90 transition-all cursor-pointer"
            >
              Send Another Note
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                  Your Name <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="name@example.com"
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                Topic
              </label>
              <select
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/50 cursor-pointer"
              >
                <option value="Book Recommendation">📚 Suggest a New Book</option>
                <option value="Translation Feedback">🇮🇳 Hindi / Translation Feedback</option>
                <option value="Bug Report">🐛 Technical Issue / Broken PDF</option>
                <option value="General Feedback">✨ General Feedback</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                Message / Book Details <span className="text-[var(--accent)]">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Let us know what books you would love to see added or share your thoughts..."
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 text-sm text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]/50 resize-y"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[var(--text-secondary)]">
                🔒 Reader&apos;s HUB respects your privacy.
              </span>
              <button
                type="submit"
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-sm shadow-lg hover:shadow-[0_0_15px_var(--theme-glow)] hover:scale-[1.02] transition-all cursor-pointer"
              >
                Send Message →
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
