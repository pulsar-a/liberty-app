# Liberty - E-Book Management Application

> **⚠️ IMPORTANT:** Update this document whenever significant architectural changes, new features, or structural modifications are introduced to the project.

## Overview

Liberty is a cross-platform desktop e-book management application built with Electron. It allows users to store, catalog, and read e-books in various formats. The app is currently in MVP phase with plans for future expansion.

### MVP Features (Current)
- Import and store e-books (EPUB, PDF, MOBI, FB2, FB3, DJVU, TXT, DOC/DOCX)
- Automatic metadata extraction from EPUB files (title, authors, description, cover, identifiers)
- Book catalog with grid/list view
- Filter books by author
- Book details view with metadata display
- **Book Reader** with page-by-page navigation (EPUB support)
- **Bookmarks** - add/remove bookmarks on pages
- **Reading Progress** - persists across sessions
- Dark/Light theme support
- Multi-language support (EN, RU, UA, DE, TT)
- Settings management

### Planned Features (Future Phases)
- Book format converter
- Library export/import
- Library sync across devices
- Reader support for additional formats (FB2, FB3, PDF, etc.)
- Collections management
- Reader appearance customization (font size, color temperature, themes)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Electron 33.x |
| Build Tool | electron-vite 2.x, Vite 5.x |
| Frontend | React 18.3, TypeScript 5.7 |
| Routing | TanStack Router 1.15.x |
| State Management | Zustand 5.x (with persist middleware), TanStack Query 4.x |
| Styling | Tailwind CSS 3.4 |
| IPC Communication | tRPC 10.x + electron-trpc 0.6.x |
| Database | SQLite via TypeORM 0.3.x |
| Settings | electron-store 8.x |
| i18n | i18next, react-i18next |
| Icons | FontAwesome 6.x |
| UI Components | HeadlessUI 1.7.x |

> **Note:** tRPC is pinned to v10 due to electron-trpc compatibility. HeadlessUI is pinned to v1.7.x due to breaking API changes in v2.

---

## Architecture

The application follows Electron's multi-process architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN PROCESS                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Controllers│  │   Parsers   │  │    Database (SQLite)    │  │
│  │  (tRPC)     │  │  (EPUB...)  │  │    via TypeORM          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Queries   │  │  Services   │  │    Settings (Store)     │  │
│  │             │  │ (Pagination)│  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ IPC (electron-trpc)
┌───────────────────────────┴─────────────────────────────────────┐
│                       PRELOAD SCRIPT                            │
│     Exposes: electronAPI, api (settings, dialogs, loaders)      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ contextBridge
┌───────────────────────────┴─────────────────────────────────────┐
│                      RENDERER PROCESS                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Views    │  │ Components  │  │   Hooks (useIpc, etc)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Layouts   │  │   Stores    │  │    Routes (TanStack)    │  │
│  │             │  │ (persisted) │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
liberty-app/
├── .cursor/rules/           # Cursor IDE rules and documentation
├── build/                   # Build assets (icons, entitlements)
├── database/                # TypeORM seeds and factories
├── resources/               # App icons for all platforms
├── src/
│   ├── main/                # Main process (Node.js)
│   │   ├── constants/       # App constants (paths, dev mode)
│   │   ├── controllers/     # tRPC procedure handlers
│   │   │   └── reader.controller.ts  # Reader-specific controllers
│   │   ├── entities/        # TypeORM entities
│   │   │   ├── book.entity.ts
│   │   │   ├── author.entity.ts
│   │   │   ├── bookId.entity.ts
│   │   │   └── bookmark.entity.ts    # Bookmarks for reader
│   │   ├── listeners/       # IPC event listeners
│   │   ├── parsers/         # E-book format parsers
│   │   │   ├── AbstractParser.ts     # Metadata parser base
│   │   │   ├── epub/                 # EPUB metadata parser
│   │   │   ├── noParser/             # Fallback parser
│   │   │   └── content/              # Content parsers for reading
│   │   │       ├── AbstractContentParser.ts
│   │   │       ├── EpubContentParser.ts
│   │   │       └── ContentParserRegistry.ts
│   │   ├── queries/         # Database query functions
│   │   │   └── bookmarks.ts          # Bookmark queries
│   │   ├── router/          # tRPC router definition
│   │   ├── services/        # Services
│   │   │   ├── db.ts                 # Database connection
│   │   │   └── pagination.ts         # Book pagination service
│   │   ├── settings/        # electron-store configuration
│   │   └── index.ts         # Main process entry point
│   ├── preload/             # Preload scripts (context bridge)
│   │   ├── index.ts         # API exposure to renderer
│   │   └── index.d.ts       # TypeScript definitions
│   └── renderer/            # Renderer process (React)
│       ├── index.html       # HTML entry point
│       └── src/
│           ├── api/         # API resource helpers
│           ├── assets/      # Fonts, CSS, images
│           │   └── reader-theme.css  # Reader CSS variables & styles
│           ├── components/  # Reusable UI components
│           │   └── reader/           # Reader-specific components
│           │       ├── PageRenderer.tsx
│           │       ├── ReaderSidebar.tsx
│           │       └── ReferencesPanel.tsx
│           ├── hooks/       # React hooks (useIpc, useSettings)
│           ├── i18n/        # Internationalization config + locales
│           ├── layouts/     # Page layouts (Main, Library, Empty)
│           ├── routes/      # TanStack Router configuration
│           ├── store/       # Zustand stores
│           │   └── useReaderStore.ts # Reader state (persisted)
│           ├── utils/       # Utility functions
│           ├── views/       # Page components
│           │   └── ReaderView.tsx    # Book reader view
│           ├── workers/     # Web workers
│           ├── App.tsx      # Root app component
│           └── main.tsx     # React entry point
├── types/                   # Shared TypeScript types
│   └── reader.types.ts      # Reader-related types
├── electron.vite.config.ts  # Vite config for Electron
├── electron-builder.yml     # Build configuration
├── package.json
├── tailwind.config.js
└── tsconfig.*.json          # TypeScript configs
```

---

## Key Concepts

### 1. IPC Communication via tRPC

The app uses `electron-trpc` for type-safe communication between main and renderer processes.

**Main Process Router** (`src/main/router/routes.ts`):
```typescript
export const router = trpc.router({
  // Book management
  addBooks: trpc.procedure.mutation(addBooksController),
  getBooks: trpc.procedure.query(getBooksController),
  getBookById: trpc.procedure.input(z.object({ id: z.union([z.number(), z.string()]) })).query(getBookByIdController),
  
  // Reader procedures
  getBookContent: trpc.procedure.input(...).query(getBookContentController),
  getBookmarks: trpc.procedure.input(...).query(getBookmarksController),
  createBookmark: trpc.procedure.input(...).mutation(createBookmarkController),
  deleteBookmark: trpc.procedure.input(...).mutation(deleteBookmarkController),
  updateReadingProgress: trpc.procedure.input(...).mutation(updateReadingProgressController),
})
```

**Renderer Usage** (`src/renderer/src/hooks/useIpc.ts`):
```typescript
const { main } = useIpc()
const { data: books } = main.getBooks.useQuery()
const { data: content } = main.getBookContent.useQuery({ bookId, paginationConfig })
```

### 2. Database Entities

Four main entities managed via TypeORM:

- **BookEntity**: Stores book metadata (name, fileName, cover, description, fileFormat, readingProgress, totalPages)
- **AuthorEntity**: Stores author information with book count
- **BookIdEntity**: Stores book identifiers (ISBN, UUID, etc.)
- **BookmarkEntity**: Stores reader bookmarks (bookId, chapterId, pageIndex, label, selectedText)

Relationships:
- Book ↔ Author: Many-to-Many via `author_book` table
- Book → BookId: One-to-Many
- Book → Bookmark: One-to-Many

### 3. E-Book Parsers

**Metadata Parsers** (for importing books):
Parsers follow an abstract pattern (`AbstractParser`) to extract metadata from different formats:

- **EpubParser**: Full implementation - extracts title, authors, description, cover, identifiers from EPUB files
- **NoParser**: Fallback for unsupported formats (uses filename as title)

**Content Parsers** (for reading books):
Content parsers extract readable content from book files:

- **AbstractContentParser**: Base class defining the interface
- **EpubContentParser**: Extracts chapters, table of contents, and references from EPUB
- **ContentParserRegistry**: Maps file extensions to content parsers

Adding new format support:
1. Metadata parser: Create class extending `AbstractParser`, register in `ParserRegistry.ts`
2. Content parser: Create class extending `AbstractContentParser`, register in `ContentParserRegistry.ts`

### 4. Pagination Service

The `PaginationService` (`src/main/services/pagination.ts`) handles book content pagination:

- Pre-computes page boundaries based on character count
- Splits content into logical segments (paragraphs, headings, etc.)
- Supports single-page and two-column layouts
- Extracts references/footnotes per page

Configuration:
```typescript
const DEFAULT_CHARS_PER_PAGE = {
  single: 1800,      // Characters per page in single mode
  'two-column': 1200 // Characters per column in spread mode
}
```

### 5. Reader Store (Zustand with Persistence)

The reader state is managed via Zustand with localStorage persistence (`src/renderer/src/store/useReaderStore.ts`):

**Persisted State** (survives app restart):
- `bookId` - Currently reading book ID
- `bookTitle` - Book title (for menu display)
- `bookAuthor` - Book author
- `currentPageIndex` - Current reading position
- `totalPages` - Total pages in book
- `layoutMode` - 'single' or 'two-column'

**Session State** (reset on navigation):
- `content` - Parsed book content
- `paginatedContent` - Paginated pages
- `bookmarks` - Current book's bookmarks
- `isReferencesPanelOpen` - References panel visibility
- `sidebarTab` - 'contents' or 'bookmarks'

**Key Actions**:
```typescript
setBookData(data)        // Initialize book content
goToPage(index)          // Navigate to page
nextPage() / previousPage()
goToChapter(chapterId)   // Navigate to chapter
setLayoutMode(mode)      // Toggle single/two-column
openReferencesPanel()    // Show footnotes
```

### 6. Reader CSS Theming

Reader appearance is controlled via CSS variables in `src/renderer/src/assets/reader-theme.css`:

```css
:root {
  --paper-base: #faf8f5;
  --paper-warmth: 0.15;
  --paper-tint-hue: 0;
  --paper-grain-opacity: 0.03;
  --page-font-size: 1.1rem;
  --page-line-height: 1.8;
  --page-padding-x: 3rem;
  --page-padding-y: 2.5rem;
}
```

Theme presets available:
- `.reader-theme-sepia` - Warm/sepia tones
- `.reader-theme-cool` - Cool/blue tones
- `.reader-theme-white` - Pure white
- `.reader-theme-night` - Dark mode optimized

### 7. Settings Management

Settings are stored via `electron-store` with schema validation:

```typescript
type SettingsType = {
  language: string       // 'en', 'ru', 'ua', 'de', 'tt'
  theme: 'light' | 'dark' | 'system'
  userFilesDir: string
  currentlyReading: number | null
  libraryViewStyle: 'list' | 'grid'
}
```

### 8. File Storage

Books are stored in the app's user data directory (`app.getPath('userData')`):
- Linux: `~/.config/liberty/books/`
- macOS: `~/Library/Application Support/liberty/books/`
- Windows: `%APPDATA%/liberty/books/`

Cover images are extracted and stored in `{userData}/books/images/`.

Local files are served via the `liberty-file://` custom protocol for secure access with webSecurity enabled.

### 9. Logging

The app uses a centralized logger (`src/main/utils/logger.ts`) with levels:
- `debug` - Development only, verbose debugging info
- `info` - General operational messages
- `warn` - Warning messages
- `error` - Error messages

### 10. Error Handling

- React ErrorBoundary wraps the entire app for graceful error recovery
- Structured error types for parser results

---

## Frontend Routes

| Path | View | Description |
|------|------|-------------|
| `/` | LibraryView | Main library with book grid/list |
| `/book/:bookId` | BookDetailsView | Book details flyout panel |
| `/my-collections` | MyCollectionsView | Collections management (WIP) |
| `/reader/$bookId` | ReaderView | Book reader with pagination |
| `/settings` | SettingsGeneralView | General settings |
| `/settings/appearance` | SettingsAppearanceView | Theme settings |
| `/settings/files` | SettingsFilesView | File storage settings |
| `/settings/about` | SettingsAboutView | About page |

---

## Reader Component Architecture

```
ReaderView
├── ThreeSectionsLayout (standard app layout)
│   ├── sidebarTop: Book title, author, layout toggle
│   ├── sidebar: ReaderSidebar
│   │   ├── Tab buttons (Contents / Bookmarks icons)
│   │   ├── TableOfContents (navigable chapter list)
│   │   └── BookmarksList (add/remove/navigate bookmarks)
│   └── content:
│       ├── PageRenderer
│       │   ├── reader-page (CSS paper texture)
│       │   ├── bookmark-indicator (clickable to remove)
│       │   ├── page-content (HTML content)
│       │   └── page-nav-zones (click to turn page)
│       └── ReferencesPanel (expandable footnotes)
└── StatusBar (shows progress, page number, chapter)
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux

# Type checking
npm run typecheck

# Linting & Formatting
npm run lint
npm run format

# Database migrations
npm run migration:generate  # Generate migration from entity changes
npm run migration:run       # Run pending migrations
npm run migration:revert    # Revert last migration
```

---

## Important Files Reference

| Purpose | File |
|---------|------|
| Main process entry | `src/main/index.ts` |
| tRPC Router | `src/main/router/routes.ts` |
| Database setup | `src/main/services/db.ts` |
| Logger utility | `src/main/utils/logger.ts` |
| Metadata parser registry | `src/main/parsers/ParserRegistry.ts` |
| Content parser registry | `src/main/parsers/content/ContentParserRegistry.ts` |
| Pagination service | `src/main/services/pagination.ts` |
| Reader controller | `src/main/controllers/reader.controller.ts` |
| Bookmark entity | `src/main/entities/bookmark.entity.ts` |
| Bookmark queries | `src/main/queries/bookmarks.ts` |
| Preload API | `src/preload/index.ts` |
| React entry | `src/renderer/src/main.tsx` |
| Error Boundary | `src/renderer/src/components/ErrorBoundary.tsx` |
| Frontend routes | `src/renderer/src/routes/routes.tsx` |
| Reader view | `src/renderer/src/views/ReaderView.tsx` |
| Reader store | `src/renderer/src/store/useReaderStore.ts` |
| Reader CSS | `src/renderer/src/assets/reader-theme.css` |
| Reader types | `types/reader.types.ts` |
| Vite config | `electron.vite.config.ts` |
| Build config | `electron-builder.yml` |
| TypeORM config | `ormconfig.js` |
| Tailwind config | `tailwind.config.js` |

---

## Internationalization (i18n)

> **⚠️ CRITICAL:** This application is **multilingual**. When implementing ANY user-facing text, you MUST add translations for ALL supported languages.

### Supported Languages
- English (`en`)
- Russian (`ru`)
- Ukrainian (`ua`)
- German (`de`)
- Tatar (`tt`)

### Translation Files Location
All translation files are located in `src/renderer/src/i18n/locale/`:
- `en.json` - English (primary)
- `ru.json` - Russian
- `ua.json` - Ukrainian
- `de.json` - German
- `tt.json` - Tatar

### Reader Translation Keys
The reader feature uses these translation key prefixes:
- `reader_*` - Reader UI elements
- `statusBar_page` - Page progress in status bar
- `mainMenu_reading_title` - Reading menu item

### When Adding New Text

1. **Never hardcode user-facing strings** - Always use the `useTranslation` hook from `react-i18next`
2. **Add translation keys to ALL language files** - Not just English
3. **Use descriptive, hierarchical keys** - e.g., `settings.appearance.theme`, `library.emptyState.title`

**Example:**
```tsx
// ✅ Correct
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <h1>{t('myFeature.title')}</h1>
}

// ❌ Wrong - hardcoded text
function MyComponent() {
  return <h1>My Feature Title</h1>
}
```

---

## Notes for Contributors

1. **Adding new IPC procedures**: Add controller in `src/main/controllers/`, register in `src/main/router/routes.ts`
2. **Adding new views**: Create view in `src/renderer/src/views/`, add route in `routes.tsx`
3. **Adding new book formats**: 
   - Metadata: Implement parser extending `AbstractParser`, register in `ParserRegistry.ts`
   - Content: Implement parser extending `AbstractContentParser`, register in `ContentParserRegistry.ts`
4. **Adding translations**: Update ALL JSON files in `src/renderer/src/i18n/locale/` - this is **mandatory** for any user-facing text
5. **Database changes**: Entities auto-sync in development (synchronize: true). Create migrations for production.
6. **Reader styling**: Use CSS variables in `reader-theme.css` for theming support
7. **Reader state**: Zustand store persists essential state to localStorage (`liberty-reader-state`)

---

*Last updated: December 2024 (v1.1.0 - Added Book Reader with EPUB support, bookmarks, reading progress persistence)*

