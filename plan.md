Reader’s HUB Mobile Application (Expo / React Native)
Technical Specification & Architectural Blueprint
1. SPEC SUMMARY
Product & Vision
Reader’s HUB Mobile is a cross-platform mobile application combining a high-performance Digital Library with a book-focused Social Network for Readers ("Instagram for Readers"). It allows book lovers to read catalog books with genuine page tracking, share visual book quotes/thoughts/reviews/page snapshots, interact via likes and comments, follow fellow readers, and engage in real-time 1-to-1 direct messaging.

Target Users
Passionate book readers, students, self-taught engineers, and literature enthusiasts who want a distraction-free mobile reading experience coupled with a community of readers.
Creators and book reviewers who want to share quotes, insights, and reading aesthetics.
Goals
Deliver a mobile-first digital reading and social experience that operates seamlessly alongside the existing web application.
Provide a 100% unified user identity: books, reading progress, streaks, achievements, certificates, and profiles sync bi-directionally between web and mobile.
Guarantee zero disruption, zero downtime, and zero data loss for the live production website.
V1 Scope (Confirmed)
Guest Mode & Authentication:
Frictionless guest exploration of the feed and 380+ book catalog.
Unified Firebase Authentication (Google Sign-In + Email/Password) with seamless session restoration.
Smart auth gate prompted only when performing interactive actions (liking, commenting, posting, messaging, or saving).
Native Book Reader:
Native horizontal page-swipe / tap gesture navigation.
Reader Heads-Up Display (HUD): chapter selector, page scrubber, and reading themes (Light, Dark, Sepia/Warm Paper).
Timestamped monotonic progress tracking (page progress, total pages, active reading time, streak maintenance).
"Save for Offline" local caching via expo-file-system with conflict-safe syncing when reconnected.
Book-Focused Social Feed:
Dual-tab feed navigation: Discover / For You (community-wide trending & recent posts) and Following (chronological posts from followed accounts).
4 specialized post formats:
Quote / Highlight Card (styled card with book attribution and page tag).
Book Review / Thought (star rating + review text + book cover tag).
Book / Page Snapshot (camera/gallery photo with caption and book tag).
Book Visual / Scene Art (user-uploaded visual or scene depiction tagged with a book).
Instant interactions: optimistic likes, comments list with replies, and post bookmarking.
Real-Time 1-to-1 Direct Messaging (Chat):
Real-time chat powered by Firestore onSnapshot listeners.
Text messaging, unread count badges, delivery/read receipts, and interactive embedded Book Preview Cards.
Push & In-App Notifications:
EAS Push Notification service + Firebase Cloud triggers for DMs, post comments, likes, and new followers.
In-app notification center.
User Safety & App Store Compliance (Guideline 1.2):
Report button on all posts, comments, and profiles (routed to /reports).
Block user capability (hides posts, comments, and disables DMs immediately).
Delete own content and self-serve Account Deletion.
5-Tab Navigation:
[Feed] | [Library / Explore] | [Create (+)] | [Direct Messages] | [My Shelf / Profile]
V1 Out-of-Scope (Deferred to V2/V3)
Internal AI image generation engine (no Gemini/Imagen API keys, billing, or token quotas; external AI images are supported as standard user uploads).
Audiobooks, text-to-speech, and audio/video direct calling.
Group book clubs, community forums, and public reading rooms.
In-app purchases, paid creator subscriptions, and tipping.
Core User Journeys
Mermaid diagram
Key Screen Architecture (Expo Router v4)
app/(tabs)/_layout.tsx: 5-tab root navigator.
app/(tabs)/index.tsx: Main Feed (Dual tab: Discover & Following).
app/(tabs)/library.tsx: Book Catalog (380+ books, search, categories, curated collections).
app/(tabs)/create.tsx: Post Creation Modal (Quote, Review, Photo Snap, Book Visual).
app/(tabs)/messages.tsx: Conversations List with search and unread badges.
app/(tabs)/profile.tsx: My Shelf (Streak, Achievements, Shelves, Certificates, My Posts).
app/book/[id].tsx: Book Details & Action Sheet (Read, Add to Shelf, Save Offline, Related Posts).
app/reader/[id].tsx: Fullscreen Horizontal Page-Swipe Reader with HUD.
app/chat/[chatId].tsx: Real-time 1-to-1 Chat Room with Share-Book cards.
app/profile/[username].tsx: Public Reader Profile & Activity Feed.
app/post/[postId].tsx: Single Post View with threaded comments.
Data Model & Additive Schema
Existing Web Collections (Strictly Preserved As-Is)
/users/{userId}: Core private user record, reading history, streaks, bookmarks.
/public_profiles/{userId}: Social profile metadata, bio, avatar, followers count.
/usernames/{username}: Unique @username registry.
/follows/{followId}: Follower-following relationship graph (${followerUid}_${followingUid}).
/public_activities/{activityId}: Public reading milestone events.
/catalog_overrides/{bookId}: Book availability and dynamic admin metadata.
New Additive Mobile Collections (No Breaking Changes)
/posts/{postId}:
id: string (UUID)
authorUid: string (Indexed)
authorUsername: string
authorPhotoURL: string
postType: 'quote' | 'review' | 'snapshot' | 'visual'
bookId: string (Optional tag, indexed)
bookTitle: string
bookCover: string
content: string (Caption, review text, or quote text)
quotePage: number (Optional)
rating: number (1-5 stars, optional)
mediaUrl: string (Optional Firebase Storage URL)
likesCount: number (Atomic increment)
commentsCount: number (Atomic increment)
createdAt: number (Unix timestamp, indexed)
/posts/{postId}/comments/{commentId}:
authorUid: string, authorUsername: string, authorPhotoURL: string, text: string, createdAt: number
/likes/{postId_userId}:
postId: string, userId: string, createdAt: number (Atomic idempotency)
/chats/{chatId}:
participants: string[] (Array of 2 UIDs, indexed with array-contains)
participantProfiles: Record<string, { username: string; displayName: string; photoURL: string }>
lastMessage: { text: string; senderId: string; createdAt: number }
unreadCounts: Record<string, number>
updatedAt: number (Indexed)
/chats/{chatId}/messages/{messageId}:
senderId: string, text: string
bookAttachment: { bookId: string; title: string; cover: string; author: string } | null
status: 'sent' | 'delivered' | 'read'
createdAt: number (Indexed)
/reports/{reportId}:
reporterUid: string, targetType: 'post' | 'comment' | 'user', targetId: string, reason: string, createdAt: number
/blocks/{blockerUid_blockedUid}:
blockerUid: string, blockedUid: string, createdAt: number
/users/{userId}/saved_posts/{postId}:
Bookmarked post reference with timestamp.
Technical Stack & Dependencies
Framework: React Native with Expo SDK 52 and Expo Router v4.
Language: TypeScript 5.x.
Styling: NativeWind v4 (Tailwind CSS for React Native) matching web design tokens.
State & Caching: Zustand (Global app/user state) + TanStack Query (React Query v5) (Server state/feed caching).
Local Storage & Offline: MMKV / AsyncStorage (Fast KV) + expo-file-system (Offline book caching).
Media Pipeline: expo-image-picker + expo-image-manipulator (Client-side WebP compression < 300 KB) + Firebase Cloud Storage.
Push Notifications: Expo Application Services (EAS Push).
Build & CI: EAS Build (generating .apk/.aab for Android and .ipa for iOS TestFlight).
2. ASSUMPTIONS
[ASSUMPTION] Repository Location: The mobile project will be created in a new, independent folder/repository (e.g. ../readers-hub-mobile or a standalone mobile repo) to guarantee that the Next.js web application repository remains 100% unencumbered by mobile dependencies or build configs.
[ASSUMPTION] Static Catalog Data: The 380+ books defined in data/books.json and data/books.ts on web can be exported or shared as a bundled catalog in mobile, ensuring instant zero-latency book browsing without database query costs.
[ASSUMPTION] Progress Sync Monotonicity: If a user reads to page 50 on web, then reads offline on mobile to page 75, mobile takes precedence upon reconnect. If web is ahead, web takes precedence (the higher page count with valid reading time and newer timestamp always wins).
[ASSUMPTION] Push Notification Server Component: Since push triggers require sending payloads to https://exp.host/--/api/v2/push/send, a lightweight Next.js API route (/api/notifications/send-push) or a standard Firebase Cloud Function in the existing Firebase project will handle the dispatch safely using a server-side secret.
3. OPEN RISKS & MITIGATION STRATEGY
Firestore Security Rules Expansion:
Risk: Existing firestore.rules has a catch-all match /{document=**} { allow read, write: false; }. Deploying mobile without updating rules will cause permission denied errors for /posts, /chats, and /likes.
Mitigation: We will draft additive, isolated security rule blocks specifically for the new collections. Existing web rules (/users/{userId}, /public_profiles/{userId}, /usernames/{username}) will not be modified by a single line.
Offline Sync Overwrites:
Risk: A user reads offline on mobile while previously finishing a book on web; reconnecting could theoretically overwrite the completed status.
Mitigation: The progress sync engine uses non-destructive, monotonic logic: Math.max(cloudPage, localPage) combined with genuinely verified total page constraints.
App Store Review Guideline 1.2 (User Generated Content):
Risk: Apple rejects social apps lacking proactive moderation tools.
Mitigation: We include Report, Block User, Delete Content, and Delete Account from Day 1 in V1, alongside terms of service acceptance during registration.
Firebase Storage Bandwidth:
Risk: Large uncompressed camera images (5–10 MB) could bloat storage and slow down the feed.
Mitigation: Mandatory client-side pre-upload compression via expo-image-manipulator resizing images to max 1080px width at 80% WebP/JPEG quality (< 300 KB).
4. ARCHITECTURAL DECISIONS
Separate Mobile Codebase over Universal Monorepo:
Rationale: Protects the live Vercel production deployment. Zero risk of dependency version mismatch between React 19 (web) and React Native / Expo.
Native Firestore Real-Time (onSnapshot) over Custom WebSockets:
Rationale: Eliminates the need to maintain, deploy, and pay for a separate Node.js socket server. Leverages existing Firebase infrastructure, works offline, and automatically reconnects on mobile sleep/wake.
Expo Router v4 over Legacy React Navigation:
Rationale: Provides a modern, file-based routing convention matching Next.js App Router, enabling deep linking (readershub://book/1984), type-safe navigation, and consistent state trees.
Client-Side Compression over Server-Side Cloud Functions:
Rationale: Reduces mobile upload times and cellular data usage for the user, while saving server compute and storage costs.
5. DATA SAFETY & MIGRATION STRATEGY
Zero Migrations: No existing collections or documents will undergo structural transformation.
Additive Only: All mobile features write strictly to new root collections (posts, chats, likes, reports).
Read-Only Compatibility for Catalog: Mobile reads the static book dataset and applies dynamic catalog_overrides identically to the web application.
Staging Verification: Every new collection and security rule will be verified against a test account before any production exposure.
6. V1 DEFINITION OF DONE
The mobile application is considered complete and production-ready when:

Catalog & Reader: A user can explore all 380+ books, open any book, swipe pages smoothly, change themes, download a book for offline reading, and have reading progress/streaks accurately reflected on the web site.
Social Feed: A user can create all 4 post types with image attachments, view the Discover and Following feeds, like posts optimistically, add comments, and bookmark posts.
Chat: Two users can exchange direct messages in real time, view read receipts, and send interactive book cards that link directly to the reader.
Notifications: A user receives an alert when their post is commented on or when they receive a direct message.
Safety Compliance: A user can block another user, report content, and delete their own posts or account.
Cross-Platform Verification: Successful EAS production builds pass on physical Android devices and iOS TestFlight with 60 FPS scrolling and zero unhandled exceptions.
7. IMPLEMENTATION PHASES
Mermaid diagram
Phase 1: Foundation & Unified Identity: Initialize Expo SDK 52 project, configure Firebase Auth, establish 5-tab navigation shell, and implement guest browsing + soft auth modal.
Phase 2: Library & Native Offline Reader: Port book catalog, build horizontal page-swipe reader with HUD and themes, implement expo-file-system offline caching, and monotonic progress sync.
Phase 3: Social Feed & Post Creation: Implement post authoring (Quote, Review, Photo, Visual), client-side compression pipeline to Firebase Storage, Discover/Following feeds, likes, and comments.
Phase 4: Real-Time Direct Messaging (Chat): Build conversations list, real-time message stream with onSnapshot, unread counters, read receipts, and interactive Share-Book cards.
Phase 5: Notifications & Safety Suite: Integrate EAS Push Notifications, build Report, Block, and Account Deletion flows for App Store compliance.
Phase 6: Hardening & Release: End-to-end regression testing, Firestore security rule publishing, performance tuning (60 FPS feed), and EAS production builds for Android (.aab) and iOS TestFlight.