"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { BOOKS, CATEGORIES, Book, ResourceType } from "@/data/books";
import { READING_PATHS, ReadingPath } from "@/lib/reading-paths";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_EMAIL } from "@/lib/admin";
import AdminGuard from "@/components/auth/AdminGuard";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit as firestoreLimit } from "firebase/firestore";
import {
  CatalogOverride,
  CuratedSeriesOverride,
  AdminAuditLog,
  getCatalogOverrides,
  getCuratedSeriesOverrides,
  getAdminAuditLogs,
  softDeleteBook,
  restoreBook,
  updateBookMetadata,
  softDeleteSeries,
  restoreSeries,
  updateSeriesMetadata,
} from "@/lib/admin-catalog";
import {
  AdminUserListItem,
  getAdminUsersList,
} from "@/lib/admin-users";
import { getActivityStatus, formatLastSeen } from "@/lib/active-tracker";
import UserDetailsModal from "@/components/admin/UserDetailsModal";
import BookEditModal from "@/components/admin/BookEditModal";
import SoftDeleteConfirmModal from "@/components/admin/SoftDeleteConfirmModal";
import SeriesEditModal from "@/components/admin/SeriesEditModal";
import { PublicActivity } from "@/lib/social";

type AdminTab = "overview" | "users" | "books" | "series" | "activity" | "audit" | "system";

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
}

function AdminDashboardContent() {
  const { user, signOutUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  // =========================================================================
  // 1. DYNAMIC DATA STATES
  // =========================================================================
  const [usersList, setUsersList] = useState<AdminUserListItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [catalogOverrides, setCatalogOverrides] = useState<Record<string, CatalogOverride>>({});
  const [seriesOverrides, setSeriesOverrides] = useState<Record<string, CuratedSeriesOverride>>({});
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [publicActivities, setPublicActivities] = useState<PublicActivity[]>([]);
  const [dataRefreshing, setDataRefreshing] = useState(false);

  // Modals state
  const [inspectUid, setInspectUid] = useState<string | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [editingSeries, setEditingSeries] = useState<ReadingPath | null>(null);

  // Status message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch initial admin datasets
  const loadDashboardData = useCallback(async () => {
    setDataRefreshing(true);
    try {
      const [uList, cOverrides, sOverrides, aLogs] = await Promise.all([
        getAdminUsersList({ limitCount: 100, currentUser: user }),
        getCatalogOverrides(),
        getCuratedSeriesOverrides(),
        getAdminAuditLogs(50),
      ]);

      setUsersList(uList);
      setCatalogOverrides(cOverrides);
      setSeriesOverrides(sOverrides);
      setAuditLogs(aLogs);
    } catch (err) {
      console.warn("[Admin] loadDashboardData error:", err);
    } finally {
      setUsersLoading(false);
      setDataRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Fetch public activities when switching to activity tab
  useEffect(() => {
    if (activeTab === "activity" && publicActivities.length === 0) {
      const firestoreDb = getFirebaseDb();
      if (!firestoreDb) return;

      const actCol = collection(firestoreDb, "public_activities");
      const q = query(actCol, orderBy("timestamp", "desc"), firestoreLimit(40));
      getDocs(q).then((snap) => {
        const list: PublicActivity[] = [];
        snap.forEach((d) => list.push(d.data() as PublicActivity));
        setPublicActivities(list);
      }).catch((err) => {
        console.warn("[Admin] public_activities note:", err);
      });
    }
  }, [activeTab, publicActivities.length]);

  // =========================================================================
  // 2. COMPUTED METRICS
  // =========================================================================
  const metrics = useMemo(() => {
    const totalCatalogBooks = BOOKS.length;
    let deletedBooksCount = 0;

    Object.values(catalogOverrides).forEach((ov) => {
      if (ov.isDeleted) deletedBooksCount++;
    });

    const activeBooksCount = totalCatalogBooks - deletedBooksCount;

    // Users metrics
    const totalUsers = usersList.length;
    let onlineUsersCount = 0;
    let recentlyActiveCount = 0;
    let totalCompletedBooks = 0;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let newUsersThisWeek = 0;

    usersList.forEach((u) => {
      if (u.status === "online") onlineUsersCount++;
      else if (u.status === "recently_active") recentlyActiveCount++;

      totalCompletedBooks += u.booksCompleted || 0;

      if (u.createdAt && u.createdAt >= sevenDaysAgo) {
        newUsersThisWeek++;
      }
    });

    // Series metrics
    const totalCuratedSeries = READING_PATHS.length;
    let activeSeriesCount = 0;
    READING_PATHS.forEach((path) => {
      const ov = seriesOverrides[path.id];
      if (!ov || !ov.isDeleted) activeSeriesCount++;
    });

    // Catalog pages & category breakdown
    let totalPages = 0;
    const categoryCounts: Record<string, number> = {};

    BOOKS.forEach((b) => {
      const p = typeof b.pages === "number" ? b.pages : parseInt(String(b.pages), 10);
      if (!isNaN(p) && p > 0) totalPages += p;
      categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
    });

    return {
      totalUsers,
      onlineUsersCount,
      recentlyActiveCount,
      activeUsersTotal: onlineUsersCount + recentlyActiveCount,
      newUsersThisWeek,
      totalCatalogBooks,
      activeBooksCount,
      deletedBooksCount,
      totalCuratedSeries,
      activeSeriesCount,
      totalCompletedBooks,
      totalPages,
      categoryCounts,
    };
  }, [usersList, catalogOverrides, seriesOverrides]);

  // =========================================================================
  // 3. USER MANAGEMENT STATES & FILTERING
  // =========================================================================
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "online" | "recently_active" | "offline">("all");
  const [userSortBy, setUserSortBy] = useState<"active" | "newest" | "completed">("active");
  const [usersPage, setUsersPage] = useState(1);
  const usersPageSize = 20;

  const filteredUsers = useMemo(() => {
    return usersList
      .filter((u) => {
        if (userSearchQuery.trim()) {
          const q = userSearchQuery.toLowerCase().trim();
          const matchName = (u.displayName || "").toLowerCase().includes(q);
          const matchUsername = u.username ? u.username.toLowerCase().includes(q) : false;
          const matchEmail = (u.email || "").toLowerCase().includes(q);
          const matchUid = (u.uid || "").toLowerCase().includes(q);
          if (!matchName && !matchUsername && !matchEmail && !matchUid) return false;
        }

        if (userStatusFilter !== "all" && u.status !== userStatusFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (userSortBy === "active") {
          return (b.lastActiveAt || 0) - (a.lastActiveAt || 0);
        }
        if (userSortBy === "newest") {
          return (b.createdAt || 0) - (a.createdAt || 0);
        }
        if (userSortBy === "completed") {
          return (b.booksCompleted || 0) - (a.booksCompleted || 0);
        }
        return 0;
      });
  }, [usersList, userSearchQuery, userStatusFilter, userSortBy]);

  const totalUserPages = Math.ceil(filteredUsers.length / usersPageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (usersPage - 1) * usersPageSize;
    return filteredUsers.slice(start, start + usersPageSize);
  }, [filteredUsers, usersPage, usersPageSize]);

  // =========================================================================
  // 4. BOOK MANAGEMENT STATES & FILTERING
  // =========================================================================
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "deleted">("all");
  const [bookSortBy, setBookSortBy] = useState<"title-asc" | "title-desc" | "pages-desc" | "rating-desc">("title-asc");
  const [booksPage, setBooksPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const booksPageSize = 20;

  const filteredBooks = useMemo(() => {
    return BOOKS.filter((book) => {
      const override = catalogOverrides[book.id];
      const isDeleted = override?.isDeleted === true;

      if (selectedStatus === "active" && isDeleted) return false;
      if (selectedStatus === "deleted" && !isDeleted) return false;

      const title = override?.titleOverride || book.title;
      const author = override?.authorOverride || book.author;
      const category = override?.categoryOverride || book.category;

      if (bookSearchQuery.trim()) {
        const q = bookSearchQuery.toLowerCase().trim();
        const matchesTitle = title.toLowerCase().includes(q);
        const matchesAuthor = author.toLowerCase().includes(q);
        const matchesCat = category.toLowerCase().includes(q);
        const matchesId = book.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAuthor && !matchesCat && !matchesId) return false;
      }

      if (selectedCategory !== "All" && category !== selectedCategory) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const aTitle = catalogOverrides[a.id]?.titleOverride || a.title;
      const bTitle = catalogOverrides[b.id]?.titleOverride || b.title;

      if (bookSortBy === "title-asc") return aTitle.localeCompare(bTitle);
      if (bookSortBy === "title-desc") return bTitle.localeCompare(aTitle);
      if (bookSortBy === "pages-desc") {
        const pa = typeof a.pages === "number" ? a.pages : parseInt(String(a.pages), 10) || 0;
        const pb = typeof b.pages === "number" ? b.pages : parseInt(String(b.pages), 10) || 0;
        return pb - pa;
      }
      if (bookSortBy === "rating-desc") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
  }, [catalogOverrides, selectedStatus, bookSearchQuery, selectedCategory, bookSortBy]);

  const totalBookPages = Math.ceil(filteredBooks.length / booksPageSize) || 1;
  const paginatedBooks = useMemo(() => {
    const start = (booksPage - 1) * booksPageSize;
    return filteredBooks.slice(start, start + booksPageSize);
  }, [filteredBooks, booksPage, booksPageSize]);

  // =========================================================================
  // 5. MUTATION HANDLERS
  // =========================================================================
  const handleSoftDeleteBook = async (reason: string) => {
    if (!deletingBook || !user) return;
    const ok = await softDeleteBook(
      deletingBook.id,
      deletingBook.title,
      { email: user.email || ADMIN_EMAIL, uid: user.uid },
      reason
    );
    if (ok) {
      setCatalogOverrides((prev) => ({
        ...prev,
        [deletingBook.id]: {
          bookId: deletingBook.id,
          isDeleted: true,
          updatedAt: Date.now(),
        },
      }));
      showToast(`Soft-deleted "${deletingBook.title}"`);
      // Refresh audit logs
      getAdminAuditLogs(50).then(setAuditLogs);
    } else {
      showToast("Failed to delete book. Check permissions.");
    }
  };

  const handleRestoreBook = async (book: Book) => {
    if (!user) return;
    const ok = await restoreBook(
      book.id,
      book.title,
      { email: user.email || ADMIN_EMAIL, uid: user.uid }
    );
    if (ok) {
      setCatalogOverrides((prev) => ({
        ...prev,
        [book.id]: {
          ...(prev[book.id] || { bookId: book.id }),
          isDeleted: false,
          updatedAt: Date.now(),
        },
      }));
      showToast(`Restored "${book.title}" to active catalog`);
      getAdminAuditLogs(50).then(setAuditLogs);
    } else {
      showToast("Failed to restore book.");
    }
  };

  const handleSaveBookMetadata = async (updates: {
    titleOverride?: string;
    authorOverride?: string;
    categoryOverride?: string;
    descriptionOverride?: string;
  }) => {
    if (!editingBook || !user) return;
    const ok = await updateBookMetadata(
      editingBook.id,
      editingBook.title,
      updates,
      { email: user.email || ADMIN_EMAIL, uid: user.uid }
    );
    if (ok) {
      setCatalogOverrides((prev) => ({
        ...prev,
        [editingBook.id]: {
          ...(prev[editingBook.id] || { bookId: editingBook.id, isDeleted: false }),
          ...updates,
          updatedAt: Date.now(),
        },
      }));
      showToast("Book metadata updated");
      getAdminAuditLogs(50).then(setAuditLogs);
    }
  };

  const handleSaveSeriesMetadata = async (updates: {
    titleOverride?: string;
    descriptionOverride?: string;
  }) => {
    if (!editingSeries || !user) return;
    const ok = await updateSeriesMetadata(
      editingSeries.id,
      editingSeries.title,
      updates,
      { email: user.email || ADMIN_EMAIL, uid: user.uid }
    );
    if (ok) {
      setSeriesOverrides((prev) => ({
        ...prev,
        [editingSeries.id]: {
          ...(prev[editingSeries.id] || { seriesId: editingSeries.id, isDeleted: false }),
          ...updates,
          updatedAt: Date.now(),
        },
      }));
      showToast("Curated reading path updated");
      getAdminAuditLogs(50).then(setAuditLogs);
    }
  };

  const handleToggleSeriesDelete = async (shouldDelete: boolean, reason?: string) => {
    if (!editingSeries || !user) return;
    if (shouldDelete) {
      const ok = await softDeleteSeries(
        editingSeries.id,
        editingSeries.title,
        { email: user.email || ADMIN_EMAIL, uid: user.uid },
        reason
      );
      if (ok) {
        setSeriesOverrides((prev) => ({
          ...prev,
          [editingSeries.id]: {
            ...(prev[editingSeries.id] || { seriesId: editingSeries.id }),
            isDeleted: true,
            updatedAt: Date.now(),
          },
        }));
        showToast(`Soft-deleted series "${editingSeries.title}" (books preserved)`);
        getAdminAuditLogs(50).then(setAuditLogs);
      }
    } else {
      const ok = await restoreSeries(
        editingSeries.id,
        editingSeries.title,
        { email: user.email || ADMIN_EMAIL, uid: user.uid }
      );
      if (ok) {
        setSeriesOverrides((prev) => ({
          ...prev,
          [editingSeries.id]: {
            ...(prev[editingSeries.id] || { seriesId: editingSeries.id }),
            isDeleted: false,
            updatedAt: Date.now(),
          },
        }));
        showToast(`Reactivated series "${editingSeries.title}"`);
        getAdminAuditLogs(50).then(setAuditLogs);
      }
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-20 pb-20 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 flex items-center gap-2">
            <span>🛡️</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* =========================================================================
            HEADER & TOP NAVIGATION
           ========================================================================= */}
        <header className="relative overflow-hidden rounded-3xl border border-[var(--border)] p-6 sm:p-8 bg-gradient-to-br from-[var(--card)] via-[var(--card)]/90 to-[var(--secondary)]/40 shadow-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 -mb-10 w-60 h-60 bg-[var(--accent)]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 p-0.5 shadow-lg flex-shrink-0 relative overflow-hidden">
                <div className="w-full h-full rounded-[14px] bg-[var(--card)] flex items-center justify-center text-3xl">
                  🛡️
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)] font-serif">
                    Administrator Control Panel
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Authorized • {ADMIN_EMAIL}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  Real-time library governance: user management, catalog soft-delete controls, curated reading tracks, and security audit log.
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]/80 flex-wrap">
                  <span>Logged in: <strong className="text-[var(--foreground)]">{user?.displayName || "Admin"}</strong> ({user?.email})</span>
                  <span>•</span>
                  <span>Role: <strong className="text-amber-400">Master Administrator</strong></span>
                  <span>•</span>
                  <button
                    onClick={loadDashboardData}
                    disabled={dataRefreshing}
                    className="text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>↻</span>
                    <span>{dataRefreshing ? "Syncing..." : "Refresh Data"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Top Quick Links */}
            <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
              <Link
                href="/library"
                className="py-2 px-3.5 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <span>📚</span>
                <span>Open Library</span>
              </Link>

              <Link
                href="/profile"
                className="py-2 px-3.5 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <span>👤</span>
                <span>Profile</span>
              </Link>

              <button
                onClick={signOutUser}
                className="py-2 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="mt-8 pt-4 border-t border-[var(--border)] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "overview"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-md"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
            >
              <span>📊</span>
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "users"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-md"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
            >
              <span>👥</span>
              <span>Users Management ({metrics.totalUsers})</span>
            </button>

            <button
              onClick={() => setActiveTab("books")}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "books"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-md"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
            >
              <span>📖</span>
              <span>Books Management ({metrics.totalCatalogBooks})</span>
            </button>

            <button
              onClick={() => setActiveTab("series")}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "series"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-md"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
            >
              <span>🧭</span>
              <span>Series &amp; Tracks ({metrics.totalCuratedSeries})</span>
            </button>

            <button
              onClick={() => setActiveTab("activity")}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "activity"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-md"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
            >
              <span>⚡</span>
              <span>Activity Feed</span>
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "audit"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-md"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
            >
              <span>📜</span>
              <span>Audit Log ({auditLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("system")}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "system"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-md"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
            >
              <span>⚙️</span>
              <span>System</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            TAB 1: OVERVIEW & METRICS
           ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Registered Users */}
              <div className="glass-card rounded-2xl p-5 sm:p-6 border border-[var(--border)] bg-[var(--card)] relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Total Users
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-lg">
                    👥
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] font-serif tracking-tight">
                    {usersLoading ? "..." : metrics.totalUsers}
                  </span>
                  <span className="text-xs text-blue-400 ml-2 font-semibold">
                    +{metrics.newUsersThisWeek} this week
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                  Firestore cloud accounts
                </p>
              </div>

              {/* Active Users */}
              <div className="glass-card rounded-2xl p-5 sm:p-6 border border-[var(--border)] bg-[var(--card)] relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Active Readers
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg">
                    🟢
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] font-serif tracking-tight">
                    {metrics.activeUsersTotal}
                  </span>
                  <span className="text-xs text-emerald-400 ml-2 font-semibold">
                    {metrics.onlineUsersCount} online now
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                  {metrics.recentlyActiveCount} active in last 30 min
                </p>
              </div>

              {/* Catalog Books */}
              <div className="glass-card rounded-2xl p-5 sm:p-6 border border-[var(--border)] bg-[var(--card)] relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Catalog Books
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-lg">
                    📚
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] font-serif tracking-tight">
                    {metrics.activeBooksCount}
                  </span>
                  {metrics.deletedBooksCount > 0 ? (
                    <span className="text-xs text-rose-400 ml-2 font-semibold">
                      {metrics.deletedBooksCount} soft-deleted
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-400 ml-2 font-semibold">100% active</span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                  {metrics.totalPages.toLocaleString()} total indexed pages
                </p>
              </div>

              {/* Completed Books */}
              <div className="glass-card rounded-2xl p-5 sm:p-6 border border-[var(--border)] bg-[var(--card)] relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Books Finished
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-lg">
                    🏆
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] font-serif tracking-tight">
                    {metrics.totalCompletedBooks}
                  </span>
                  <span className="text-xs text-purple-400 ml-2 font-semibold">volumes read</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                  Across registered reading shelves
                </p>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="glass-card rounded-3xl p-6 sm:p-7 border border-[var(--border)] bg-[var(--card)] space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] font-serif">
                    Catalog Category Distribution
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Realms &amp; specialized study disciplines across the master catalog
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-[var(--secondary)] text-[var(--foreground)] font-bold">
                  {Object.keys(metrics.categoryCounts).length} Disciplines
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {Object.entries(metrics.categoryCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => {
                    const pct = ((count / metrics.totalCatalogBooks) * 100).toFixed(1);
                    return (
                      <div
                        key={category}
                        className="p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)] flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[var(--foreground)] truncate pr-2">
                            {category}
                          </span>
                          <span className="font-mono font-bold text-[var(--accent)] flex-shrink-0">
                            {count} <span className="text-[10px] text-[var(--text-secondary)]">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[var(--accent)] to-amber-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* DRM & Download policy notice */}
            <div className="p-6 rounded-3xl border border-[var(--border)] bg-gradient-to-r from-amber-500/10 via-[var(--card)] to-[var(--secondary)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-[var(--foreground)]">
                  <span>🔒 Direct Download Restriction Active</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Enforced
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                  Direct raw PDF downloading is disabled platform-wide. Readers read smoothly inside the integrated embedded viewer, with personal offline memory cached via browser IndexedDB.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("books")}
                className="py-2.5 px-4 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer flex-shrink-0"
              >
                <span>Browse &amp; Manage Catalog →</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: USERS MANAGEMENT
           ========================================================================= */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Control Bar: Search & Filter */}
            <div className="glass-card rounded-3xl p-5 border border-[var(--border)] bg-[var(--card)] space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      setUsersPage(1);
                    }}
                    placeholder="Search by name, @username, email, or UID..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] focus:border-[var(--accent)] text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--text-secondary)]/70 focus:outline-hidden transition-all"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => { setUserStatusFilter("all"); setUsersPage(1); }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      userStatusFilter === "all"
                        ? "bg-[var(--foreground)] text-[var(--background)]"
                        : "bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    All ({usersList.length})
                  </button>

                  <button
                    onClick={() => { setUserStatusFilter("online"); setUsersPage(1); }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      userStatusFilter === "online"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active now ({metrics.onlineUsersCount})
                  </button>

                  <button
                    onClick={() => { setUserStatusFilter("recently_active"); setUsersPage(1); }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      userStatusFilter === "recently_active"
                        ? "bg-amber-600 text-white"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    Recently Active ({metrics.recentlyActiveCount})
                  </button>
                </div>
              </div>

              {/* Sort & Count Row */}
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]/70">
                <span>
                  Showing <strong className="text-[var(--foreground)]">{filteredUsers.length}</strong> registered readers
                </span>

                <div className="flex items-center gap-2">
                  <span>Sort:</span>
                  <select
                    value={userSortBy}
                    onChange={(e) => setUserSortBy(e.target.value as any)}
                    className="px-2.5 py-1 rounded-lg bg-[var(--secondary)]/60 border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-hidden cursor-pointer"
                  >
                    <option value="active">Most Recent Activity</option>
                    <option value="newest">Newest Joined</option>
                    <option value="completed">Most Books Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="glass-card rounded-3xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Email (Admin Only)</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4">Last Seen</th>
                      <th className="py-3.5 px-4 text-center">Completed</th>
                      <th className="py-3.5 px-4 text-center">Reading</th>
                      <th className="py-3.5 px-4 text-center">Followers</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-sm text-[var(--text-secondary)]">
                          {usersLoading ? "Loading users..." : "No users matched the search criteria."}
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((u) => {
                        const actInfo = getActivityStatus(u.lastActiveAt);
                        return (
                          <tr key={u.uid} className="hover:bg-[var(--secondary)]/30 transition-colors">
                            <td className="py-3 px-4 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[var(--secondary)] overflow-hidden relative flex-shrink-0 border border-[var(--border)]">
                                {u.photoURL ? (
                                  <Image src={u.photoURL} alt={u.displayName} fill sizes="36px" className="object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[var(--text-secondary)]">
                                    {u.displayName?.[0]?.toUpperCase() || "👤"}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 max-w-[160px]">
                                <span className="font-bold text-[var(--foreground)] truncate block">
                                  {u.displayName}
                                  {u.displayName?.replace(/^@+/, "") || u.username || "Reader"}
                                </span>
                                <span className="text-[10px] text-[var(--accent)] font-mono truncate block">
                                  @{u.username}
                                </span>
                                {u.username ? (
                                  <span className="text-[10px] text-[var(--accent)] font-mono truncate block">
                                    @{u.username}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[var(--text-secondary)]/60 italic block">
                                    Not set
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 font-mono text-[11px] text-[var(--foreground)]">
                              <span className="select-all">{u.email}</span>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${actInfo.badgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${actInfo.dotClass}`} />
                                {actInfo.label}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">
                              {formatLastSeen(u.lastActiveAt)}
                            </td>

                            <td className="py-3 px-4 text-center font-mono font-bold text-[var(--foreground)]">
                              {u.booksCompleted}
                            </td>

                            <td className="py-3 px-4 text-center font-mono text-[var(--text-secondary)]">
                              {u.currentlyReading}
                            </td>

                            <td className="py-3 px-4 text-center font-mono text-[var(--text-secondary)]">
                              {u.followersCount} / {u.followingCount}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setInspectUid(u.uid)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--foreground)] hover:text-[var(--background)] text-[var(--foreground)] text-[11px] font-bold border border-[var(--border)] transition-all cursor-pointer"
                              >
                                <span>Inspect</span>
                                <span>🔍</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalUserPages > 1 && (
              <div className="flex items-center justify-between py-2 px-1">
                <span className="text-xs text-[var(--text-secondary)]">
                  Page <strong className="text-[var(--foreground)]">{usersPage}</strong> of {totalUserPages}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                    disabled={usersPage === 1}
                    className="py-1.5 px-3 rounded-xl bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] text-xs font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setUsersPage((p) => Math.min(totalUserPages, p + 1))}
                    disabled={usersPage === totalUserPages}
                    className="py-1.5 px-3 rounded-xl bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] text-xs font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: BOOKS MANAGEMENT
           ========================================================================= */}
        {activeTab === "books" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Control Bar: Search, Category, Status, Sort */}
            <div className="glass-card rounded-3xl p-5 sm:p-6 border border-[var(--border)] bg-[var(--card)] space-y-4">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={bookSearchQuery}
                    onChange={(e) => {
                      setBookSearchQuery(e.target.value);
                      setBooksPage(1);
                    }}
                    placeholder="Search by title, author, realm, ID, or tag..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] focus:border-[var(--accent)] text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--text-secondary)]/70 focus:outline-hidden transition-all"
                  />
                  {bookSearchQuery && (
                    <button
                      onClick={() => setBookSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* View toggle & Results Count */}
                <div className="flex items-center gap-3 justify-between lg:justify-end">
                  <span className="text-xs text-[var(--text-secondary)] font-medium">
                    Showing <strong className="text-[var(--foreground)]">{filteredBooks.length}</strong> of {metrics.totalCatalogBooks} titles
                  </span>

                  <div className="flex items-center gap-1 p-1 bg-[var(--secondary)] rounded-xl border border-[var(--border)]">
                    <button
                      onClick={() => setViewMode("table")}
                      className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        viewMode === "table"
                          ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                          : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      📑 Table
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        viewMode === "grid"
                          ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                          : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      🔲 Grid
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[var(--border)]/70">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    Catalog Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value as any);
                      setBooksPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">All ({metrics.totalCatalogBooks})</option>
                    <option value="active">Active Only ({metrics.activeBooksCount})</option>
                    <option value="deleted">Soft-Deleted ({metrics.deletedBooksCount})</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    Realm / Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setBooksPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-hidden cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-[var(--card)] text-[var(--foreground)]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    Sort By
                  </label>
                  <select
                    value={bookSortBy}
                    onChange={(e) => setBookSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-hidden cursor-pointer"
                  >
                    <option value="title-asc">Title (A → Z)</option>
                    <option value="title-desc">Title (Z → A)</option>
                    <option value="pages-desc">Pages (Highest first)</option>
                    <option value="rating-desc">Rating (Highest first)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="p-2 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)] text-[11px] text-[var(--text-secondary)] w-full text-center">
                    {metrics.deletedBooksCount} titles hidden in reader
                  </div>
                </div>
              </div>
            </div>

            {/* Table View */}
            {viewMode === "table" ? (
              <div className="glass-card rounded-3xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4">Cover / Title</th>
                        <th className="py-3.5 px-4">Author</th>
                        <th className="py-3.5 px-4">Realm</th>
                        <th className="py-3.5 px-4 text-center">Pages</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {paginatedBooks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-sm text-[var(--text-secondary)]">
                            No books matched the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedBooks.map((book) => {
                          const override = catalogOverrides[book.id];
                          const isDeleted = override?.isDeleted === true;
                          const title = override?.titleOverride || book.title;
                          const author = override?.authorOverride || book.author;
                          const category = override?.categoryOverride || book.category;

                          return (
                            <tr key={book.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                              <td className="py-3 px-4 flex items-center gap-3">
                                <div className="w-9 h-12 rounded-md bg-[var(--secondary)] overflow-hidden flex-shrink-0 relative border border-[var(--border)]">
                                  {book.cover ? (
                                    <Image src={book.cover} alt={title} fill sizes="36px" className="object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px]">📖</div>
                                  )}
                                </div>
                                <div className="min-w-0 max-w-xs">
                                  <Link
                                    href={`/book/${book.id}`}
                                    target="_blank"
                                    className="font-bold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors truncate block"
                                  >
                                    {title}
                                  </Link>
                                  <span className="text-[10px] text-[var(--text-secondary)] font-mono truncate block">
                                    ID: {book.id}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3 px-4 text-[var(--text-secondary)] font-medium truncate max-w-[140px]">
                                {author}
                              </td>

                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)]">
                                  {category}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-center font-mono">
                                {book.pages}
                              </td>

                              <td className="py-3 px-4 text-center">
                                {isDeleted ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                    Soft-Deleted
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    Active
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setEditingBook(book)}
                                    className="p-1.5 rounded-lg bg-[var(--secondary)] hover:bg-[var(--foreground)] hover:text-[var(--background)] text-[var(--foreground)] transition-all cursor-pointer"
                                    title="Edit Metadata Override"
                                  >
                                    ✏️
                                  </button>

                                  {isDeleted ? (
                                    <button
                                      onClick={() => handleRestoreBook(book)}
                                      className="py-1 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] transition-all cursor-pointer"
                                    >
                                      Restore
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setDeletingBook(book)}
                                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                                      title="Soft Delete"
                                    >
                                      🗑️
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedBooks.map((book) => {
                  const override = catalogOverrides[book.id];
                  const isDeleted = override?.isDeleted === true;
                  const title = override?.titleOverride || book.title;
                  const author = override?.authorOverride || book.author;

                  return (
                    <div
                      key={book.id}
                      className="glass-card rounded-2xl p-4 border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex gap-3">
                          <div className="w-14 h-20 rounded-lg bg-[var(--secondary)] overflow-hidden flex-shrink-0 relative border border-[var(--border)]">
                            {book.cover ? (
                              <Image src={book.cover} alt={title} fill sizes="56px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs">📖</div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-[var(--foreground)] line-clamp-2">
                              {title}
                            </span>
                            <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                              {author}
                            </p>
                            <div className="mt-1.5">
                              {isDeleted ? (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                  Soft-Deleted
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                        <button
                          onClick={() => setEditingBook(book)}
                          className="text-[var(--text-secondary)] hover:text-[var(--foreground)] font-semibold"
                        >
                          Edit ✏️
                        </button>

                        {isDeleted ? (
                          <button
                            onClick={() => handleRestoreBook(book)}
                            className="font-bold text-emerald-400 hover:underline"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => setDeletingBook(book)}
                            className="font-bold text-rose-400 hover:underline"
                          >
                            Soft Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalBookPages > 1 && (
              <div className="flex items-center justify-between py-2 px-1">
                <span className="text-xs text-[var(--text-secondary)]">
                  Page <strong className="text-[var(--foreground)]">{booksPage}</strong> of {totalBookPages}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBooksPage((p) => Math.max(1, p - 1))}
                    disabled={booksPage === 1}
                    className="py-1.5 px-3 rounded-xl bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] text-xs font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setBooksPage((p) => Math.min(totalBookPages, p + 1))}
                    disabled={booksPage === totalBookPages}
                    className="py-1.5 px-3 rounded-xl bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] text-xs font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: SERIES & CURATED TRACKS
           ========================================================================= */}
        {activeTab === "series" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="glass-card rounded-3xl p-6 sm:p-7 border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] font-serif">
                    Platform Curated Reading Tracks
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Sequential curricula connecting engineering, philosophy, and masterworks. Soft-deleting a track preserves all connected books.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--secondary)] border border-[var(--border)]">
                  {metrics.activeSeriesCount} of {metrics.totalCuratedSeries} Tracks Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {READING_PATHS.map((series) => {
                  const override = seriesOverrides[series.id];
                  const isDeleted = override?.isDeleted === true;
                  const title = override?.titleOverride || series.title;
                  const desc = override?.descriptionOverride || series.description;

                  return (
                    <div
                      key={series.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                        isDeleted
                          ? "bg-rose-500/5 border-rose-500/30 opacity-70"
                          : "bg-[var(--secondary)]/40 border-[var(--border)] hover:border-[var(--accent)]/40"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{series.icon}</span>
                            <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">
                              {series.category}
                            </span>
                          </div>

                          {isDeleted ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              Inactive
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Active Track
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold font-serif text-[var(--foreground)]">
                          {title}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                          {desc}
                        </p>

                        <div className="pt-2 text-xs text-[var(--text-secondary)]">
                          <span className="font-semibold text-[var(--foreground)]">
                            Curriculum:
                          </span>{" "}
                          {series.steps.length} sequential volumes
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                        <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                          ID: {series.id}
                        </span>

                        <button
                          onClick={() => setEditingSeries(series)}
                          className="py-1.5 px-3 rounded-xl bg-[var(--secondary)] hover:bg-[var(--foreground)] hover:text-[var(--background)] text-[var(--foreground)] font-bold text-xs border border-[var(--border)] transition-all cursor-pointer"
                        >
                          Manage Track ⚙️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: ACTIVITY FEED
           ========================================================================= */}
        {activeTab === "activity" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="glass-card rounded-3xl p-6 sm:p-7 border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] font-serif">
                    Live Public Reading Activities
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Real events across Reader Hub: books started, volumes finished, and reading streak milestones.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--secondary)] border border-[var(--border)]">
                  {publicActivities.length} Events Logged
                </span>
              </div>

              {publicActivities.length === 0 ? (
                <p className="py-12 text-center text-xs text-[var(--text-secondary)]">
                  No public reading activities recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {publicActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-4 rounded-2xl bg-[var(--secondary)]/30 border border-[var(--border)] flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] border border-[var(--border)] overflow-hidden relative flex-shrink-0">
                          {act.photoURL ? (
                            <Image src={act.photoURL} alt={act.displayName} fill sizes="40px" className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                              {act.displayName?.[0] || "👤"}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[var(--foreground)]">
                              {act.displayName}
                            </span>
                            <span className="text-[10px] text-[var(--accent)] font-mono">
                              @{act.username}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                            {act.type === "completed_book" ? "🏆 Completed: " : act.type === "started_book" ? "📖 Started: " : "🔥 "}
                            <strong className="text-[var(--foreground)]">{act.bookTitle || act.details}</strong>
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-[var(--text-secondary)] whitespace-nowrap">
                        {formatLastSeen(act.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: AUDIT LOG
           ========================================================================= */}
        {activeTab === "audit" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="glass-card rounded-3xl p-6 sm:p-7 border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] font-serif">
                    Administrator Security Audit Log
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Immutable audit record of all catalog mutations, soft deletions, restorations, and track updates.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {auditLogs.length} Records
                </span>
              </div>

              {auditLogs.length === 0 ? (
                <p className="py-12 text-center text-xs text-[var(--text-secondary)]">
                  No administrative actions logged yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Admin Email</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Target</th>
                        <th className="py-3 px-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {auditLogs.map((log) => {
                        const actionBadge =
                          log.action.includes("delete")
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : log.action.includes("restore")
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-blue-500/15 text-blue-400 border-blue-500/30";

                        return (
                          <tr key={log.id} className="hover:bg-[var(--secondary)]/30 transition-colors font-mono text-[11px]">
                            <td className="py-3 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-semibold text-[var(--foreground)]">
                              {log.adminEmail}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${actionBadge}`}>
                                {log.action.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-sans font-bold text-[var(--foreground)] truncate max-w-[180px]">
                              {log.targetName || log.targetId}
                            </td>
                            <td className="py-3 px-4 font-sans text-[var(--text-secondary)] truncate max-w-xs">
                              {log.details || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: SYSTEM & POLICIES
           ========================================================================= */}
        {activeTab === "system" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Architecture & Rights */}
              <div className="glass-card rounded-3xl p-6 border border-[var(--border)] bg-[var(--card)] space-y-4">
                <h3 className="text-base font-bold text-[var(--foreground)] font-serif border-b border-[var(--border)] pb-3 flex items-center gap-2">
                  <span>📜</span>
                  <span>Content Security &amp; DRM Policy</span>
                </h3>

                <div className="space-y-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                  <div className="p-3.5 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                    <strong className="text-[var(--foreground)] block mb-1">
                      Download Policy Enforced:
                    </strong>
                    All client-side direct download buttons and raw file links have been removed. Books stream inside the embedded reader canvas.
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                    <strong className="text-[var(--foreground)] block mb-1">
                      IndexedDB Offline Preservation:
                    </strong>
                    The PWA offline architecture preserves reader cache inside browser-local IndexedDB. Readers can read offline without file distribution.
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                    <strong className="text-[var(--foreground)] block mb-1">
                      Strict Admin Access Gate:
                    </strong>
                    Guarded via Firestore Security Rules and route authorization matching exclusively <code>{ADMIN_EMAIL}</code>.
                  </div>
                </div>
              </div>

              {/* System Infrastructure Health */}
              <div className="glass-card rounded-3xl p-6 border border-[var(--border)] bg-[var(--card)] space-y-4">
                <h3 className="text-base font-bold text-[var(--foreground)] font-serif border-b border-[var(--border)] pb-3 flex items-center gap-2">
                  <span>⚙️</span>
                  <span>Platform Health Checklist</span>
                </h3>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[var(--foreground)] block">Firebase Authentication</span>
                      <span className="text-[var(--text-secondary)]">Google OAuth 2.0 Provider</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold">
                      Active
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[var(--foreground)] block">Cloud Firestore Security Rules</span>
                      <span className="text-[var(--text-secondary)]">Enforced with isAdmin() verification</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold">
                      Protected
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[var(--foreground)] block">Catalog Storage</span>
                      <span className="text-[var(--text-secondary)]">Static JSON catalog + Dynamic Overrides</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold">
                      {metrics.totalCatalogBooks} Titles
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[var(--foreground)] block">PWA Service Worker</span>
                      <span className="text-[var(--text-secondary)]">Background Cache &amp; Offline IndexedDB</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      {/* 1. User Deep Inspector Modal */}
      {inspectUid && (
        <UserDetailsModal
          uid={inspectUid}
          onClose={() => setInspectUid(null)}
        />
      )}

      {/* 2. Book Metadata Edit Modal */}
      {editingBook && (
        <BookEditModal
          book={editingBook}
          existingOverride={catalogOverrides[editingBook.id]}
          isOpen={Boolean(editingBook)}
          onClose={() => setEditingBook(null)}
          onSave={handleSaveBookMetadata}
        />
      )}

      {/* 3. Soft Delete Confirmation Modal */}
      {deletingBook && (
        <SoftDeleteConfirmModal
          book={deletingBook}
          isOpen={Boolean(deletingBook)}
          onClose={() => setDeletingBook(null)}
          onConfirm={handleSoftDeleteBook}
        />
      )}

      {/* 4. Series Edit Modal */}
      {editingSeries && (
        <SeriesEditModal
          series={editingSeries}
          existingOverride={seriesOverrides[editingSeries.id]}
          isOpen={Boolean(editingSeries)}
          onClose={() => setEditingSeries(null)}
          onSave={handleSaveSeriesMetadata}
          onToggleDelete={handleToggleSeriesDelete}
        />
      )}
    </main>
  );
}
