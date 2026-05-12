# Mentras — Frontend

> A full-featured web platform helping Latin American entrepreneurs and small businesses digitize their operations — inventory, learning, analytics, and team management in one product.

---

## What is Mentras?

Mentras is a React single-page application built around three core pillars:

1. **SME Management** — register and operate small businesses, manage employees, categories, and profile data.
2. **Learning** — a lightweight LMS with course catalogs, unit/lesson structure, video playback, and PDF materials.
3. **Tools & Dashboard** — real-time inventory management, digital menus with stock tracking, sales metrics, and PDF menu export.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + TypeScript 6 |
| Build Tool | Vite 8 + Rolldown |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Routing | React Router v7 |
| Animations | Motion (Framer Motion) |
| WebGL Background | OGL — GLSL shader-based canvas |
| PDF Generation | jsPDF v4 with fully custom layout engine |
| Social Auth | Google OAuth via `@react-oauth/google` |
| Component Primitives | Base UI, shadcn/ui |
| Typography | Geist Variable (`@fontsource-variable/geist`) |
| Linting | ESLint 9 + TypeScript-ESLint |
| Package Manager | Bun |

---

## Project Architecture

```
src/
├── components/
│   ├── auth/              # Login/register form with Google, Meta, Microsoft OAuth
│   ├── auth-code/         # 6-digit OTP verification with resend cooldown timer
│   ├── home/              # Landing sections: hero, features, process, social proof
│   ├── learning/          # Course viewer, outline panel, shared types
│   ├── profile/           # Profile cards, metrics, account editing
│   ├── pymes/             # SME dashboard, menu/inventory manager, PDF export, shared UI
│   ├── tools/             # Per-SME sales metrics, analytics cards
│   └── ui/                # Design system: Header, Footer, Reveal, SectionHeading,
│                          #   MarqueeStrip, ThemeToggle, WebGL background (Grainient)
├── lib/
│   ├── auth.ts            # Token management (access + refresh), authFetch with auto-retry
│   ├── google-auth.ts     # Allowed origins guard for Google OAuth
│   └── utils.ts           # cn() helper, buildBackendUrl()
└── pages/                 # One file per route: Home, Auth, Profile, Pymes,
                           #   Aprendizaje, CursoAprendizaje, Dashboard,
                           #   Herramientas, Blog, Contacto, Privacidad, Términos
```

---

## Key Features

### Authentication
- Full register and login flow with JWT (access + refresh tokens).
- Access token stored in `sessionStorage`; refresh token in `localStorage` for tab-close safety.
- Transparent auto-refresh: `authFetch` intercepts 401s, refreshes the token, and retries the original request automatically.
- Google OAuth: ID token → backend exchange → app-owned JWT.
- 6-digit OTP email verification with configurable resend cooldown and live countdown timer.

### SME & Inventory Management
- Full CRUD for SMEs: name, description, category, profile picture, foundation date.
- Visual separation between owned SMEs and SMEs where the user is an employee.
- Inventory dashboard: items with price and stock quantity.
- Digital menus: item groups attached to a specific SME.
- Every item added to a menu deducts stock on the backend and logs a movement record (actor, previous quantity, new quantity).
- Collapsible disclosure sections (inventory / menus / records) to keep long dashboards scannable.
- Menu detail modal with inline movement history and an item editor.

### PDF Menu Export
- Full in-browser PDF generation with `jsPDF` — no backend dependency.
- Custom layout engine: cover page, summary metrics, product cards with availability badges, notes section, paginated footer.
- Text sanitization to strip diacritics for PDF compatibility.
- Supports direct download and native share via Web Share API (mobile-optimized).

### Learning Management (LMS)
- Paginated course catalog accessible to all authenticated users.
- Individual course view: collapsible outline panel + video player + PDF viewer.
- Course creation flow (mentors only): Course → Unit → Lesson, with video and PDF upload to ImageKit.
- Step-by-step progress indicator during lesson creation (auth upload → video upload → PDF upload → lesson save).
- Unit and lesson deletion with optimistic UI updates.

### Analytics & Tools
- Per-SME metrics dashboard: monthly sales, top-selling product, most-viewed product, leading category.
- Visual bar chart built in pure CSS (no chart library).
- Manual refresh button to force metric recalculation on the backend.
- "Human-readable" story cards and progress bars that explain data in plain language, not raw numbers.

### Design System
- Light/dark theme with CSS custom properties; toggle available on the landing page.
- Animated WebGL background (`Grainient`) using custom GLSL shaders with two color palettes (light/dark).
- `Reveal` component for viewport-aware entrance animations via Framer Motion.
- `MarqueeStrip` with edge fade gradients.
- Fully responsive; hamburger menu navigation on mobile.

---

## Authentication Flow

```
User → POST /api/user/login/ → { access, refresh }
                                        ↓
                             sessionStorage (access)
                             localStorage  (refresh)
                                        ↓
             authFetch() → Authorization: Bearer <access>
                        → 401? → POST /refresh/ → retry original request
```

---

## Environment Variables

```env
VITE_BACKEND_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=<your-client-id>
VITE_GOOGLE_ALLOWED_ORIGINS=http://localhost:5173
```

---

## Getting Started

```bash
# Install dependencies
bun install          # or npm install

# Development server
bun run dev          # http://localhost:5173

# Production build
bun run build

# Preview production build
bun run preview
```

> Requires a Django backend running at `VITE_BACKEND_URL`. The frontend consumes REST endpoints under `/api/`.

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Home | Landing: hero, features, process steps |
| `/auth` | Auth | Login / Register with OAuth |
| `/auth-code` | AuthCode | OTP email verification |
| `/profile` | Profile | View and edit user profile |
| `/pymes` | Pymes | Owned SMEs and employee SME dashboards |
| `/aprendizaje` | AprendizajeCatalogo | Course catalog |
| `/aprendizaje/crear` | Aprendizaje | Course creation panel (mentors only) |
| `/aprendizaje/cursos/:id` | CursoAprendizaje | Course detail with lesson viewer |
| `/dashboard` | Dashboard | Menu and inventory management |
| `/herramientas` | Herramientas | Sales metrics and analytics per SME |
| `/settings` | Settings | Settings (in progress) |

---

## Notable Design Decisions

**Session-scoped access tokens.** The access token lives in `sessionStorage` (cleared on tab close) while the refresh token lives in `localStorage`, balancing security and UX without forcing re-login on every page refresh.

**No global state manager.** State is handled locally per page with `useState` / `useEffect`. Each page is self-contained enough that introducing Redux or Zustand would add complexity without real benefit at this scale.

**100% client-side PDF generation.** Menu export does not hit any endpoint — jsPDF builds the document entirely in memory with a custom multi-page layout, then triggers a download or Web Share.

**Zero-animation WebGL background.** The `Grainient` shader runs with `timeSpeed: 0` in production, meaning no animation loop is active. It renders once on mount and re-renders only on resize via `ResizeObserver`, keeping GPU usage at zero during normal browsing.

**Defensive API response normalization.** Every API response passes through typed normalizer functions before reaching component state. This protects the UI from unexpected payload shapes and makes backend contract changes easier to absorb.

---

## Author

Built as the frontend for **Mentras** — a digitalization platform for Latin American SMEs and entrepreneurs.