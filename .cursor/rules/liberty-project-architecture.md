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
- Dark/Light theme support
- Multi-language support (EN, RU, UA, DE, TT)
- Settings management

### Planned Features (Future Phases)
- Book format converter
- Library export/import
- Library sync across devices
- Reader view (currently placeholder)
- Collections management

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Electron 33.x |
| Build Tool | electron-vite 2.x, Vite 5.x |
| Frontend | React 18.3, TypeScript 5.7 |
| Routing | TanStack Router 1.15.x |
| State Management | Zustand 5.x, TanStack Query 4.x |
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
│  │   Queries   │  │  Listeners  │  │    Settings (Store)     │  │
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
│   │   ├── entities/        # TypeORM entities (Book, Author, BookId)
│   │   ├── listeners/       # IPC event listeners
│   │   ├── parsers/         # E-book format parsers
│   │   │   ├── AbstractParser.ts
│   │   │   ├── epub/        # EPUB parser implementation
│   │   │   └── noParser/    # Fallback for unsupported formats
│   │   ├── queries/         # Database query functions
│   │   ├── router/          # tRPC router definition
│   │   ├── services/        # Database connection service
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
│           ├── components/  # Reusable UI components
│           ├── hooks/       # React hooks (useIpc, useSettings)
│           ├── i18n/        # Internationalization config + locales
│           ├── layouts/     # Page layouts (Main, Library, Empty)
│           ├── routes/      # TanStack Router configuration
│           ├── store/       # Zustand stores
│           ├── utils/       # Utility functions
│           ├── views/       # Page components
│           ├── workers/     # Web workers
│           ├── App.tsx      # Root app component
│           └── main.tsx     # React entry point
├── types/                   # Shared TypeScript types
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
  addBooks: trpc.procedure.mutation(addBooksController),
  getBooks: trpc.procedure.query(getBooksController),
  getBookById: trpc.procedure.input(z.object({ id: z.union([z.number(), z.string()]) })).query(getBookByIdController),
  // ... more procedures
})
```

**Renderer Usage** (`src/renderer/src/hooks/useIpc.ts`):
```typescript
const { main } = useIpc()
const { data: books } = main.getBooks.useQuery()
const mutation = main.addBooks.useMutation()
```

### 2. Database Entities

Three main entities managed via TypeORM:

- **BookEntity**: Stores book metadata (name, fileName, cover, description, fileFormat, etc.)
- **AuthorEntity**: Stores author information with book count
- **BookIdEntity**: Stores book identifiers (ISBN, UUID, etc.)

Relationships:
- Book ↔ Author: Many-to-Many via `author_book` table
- Book → BookId: One-to-Many

### 3. E-Book Parsers

Parsers follow an abstract pattern (`AbstractParser`) to extract metadata from different formats:

- **EpubParser**: Full implementation - extracts title, authors, description, cover, identifiers from EPUB files
- **NoParser**: Fallback for unsupported formats (uses filename as title)

Adding new format support: Create a new parser class extending `AbstractParser` and register it in `addBooks.controller.ts`.

### 4. Settings Management

Settings are stored via `electron-store` with schema validation:

```typescript
// Available settings
type SettingsType = {
  language: string       // 'en', 'ru', 'ua', 'de', 'tt'
  theme: 'light' | 'dark' | 'system'
  userFilesDir: string
  currentlyReading: number | null
  libraryViewStyle: 'list' | 'grid'
}
```

### 5. File Storage

Books are stored in the app's user data directory (`app.getPath('userData')`):
- Linux: `~/.config/liberty/books/`
- macOS: `~/Library/Application Support/liberty/books/`
- Windows: `%APPDATA%/liberty/books/`

Cover images are extracted and stored in `{userData}/books/images/`.

Local files are served via the `liberty-file://` custom protocol for secure access with webSecurity enabled.

### 6. Logging

The app uses a centralized logger (`src/main/utils/logger.ts`) with levels:
- `debug` - Development only, verbose debugging info
- `info` - General operational messages
- `warn` - Warning messages
- `error` - Error messages

### 7. Parser System

Parsers are registered via `src/main/parsers/ParserRegistry.ts`:
- `EpubParser` - Full metadata extraction for EPUB files
- `NoParser` - Fallback parser for unsupported formats

To add a new format parser:
1. Create a class extending `AbstractParser`
2. Register it in `ParserRegistry.ts`

### 8. Error Handling

- React ErrorBoundary wraps the entire app for graceful error recovery
- Structured error types for parser results

---

## Frontend Routes

| Path | View | Description |
|------|------|-------------|
| `/` | LibraryView | Main library with book grid/list |
| `/book/:bookId` | BookDetailsView | Book details flyout panel |
| `/my-collections` | MyCollectionsView | Collections management (WIP) |
| `/reader` | ReaderView | Book reader (WIP) |
| `/settings` | SettingsGeneralView | General settings |
| `/settings/appearance` | SettingsAppearanceView | Theme settings |
| `/settings/files` | SettingsFilesView | File storage settings |
| `/settings/about` | SettingsAboutView | About page |

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
| Parser registry | `src/main/parsers/ParserRegistry.ts` |
| Preload API | `src/preload/index.ts` |
| React entry | `src/renderer/src/main.tsx` |
| Error Boundary | `src/renderer/src/components/ErrorBoundary.tsx` |
| Frontend routes | `src/renderer/src/routes/routes.tsx` |
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

**After adding a new key, update ALL locale files:**
```json
// en.json
{ "myFeature": { "title": "My Feature Title" } }

// ru.json
{ "myFeature": { "title": "Название моей функции" } }

// ua.json
{ "myFeature": { "title": "Назва моєї функції" } }

// de.json
{ "myFeature": { "title": "Mein Feature-Titel" } }

// tt.json
{ "myFeature": { "title": "Минем функция исеме" } }
```

---

## Notes for Contributors

1. **Adding new IPC procedures**: Add controller in `src/main/controllers/`, register in `src/main/router/routes.ts`
2. **Adding new views**: Create view in `src/renderer/src/views/`, add route in `routes.tsx`
3. **Adding new book formats**: Implement parser extending `AbstractParser`, register in `addBooks.controller.ts`
4. **Adding translations**: Update ALL JSON files in `src/renderer/src/i18n/locale/` - this is **mandatory** for any user-facing text
5. **Database changes**: Entities auto-sync in development (synchronize: true). Create migrations for production.

---

*Last updated: December 2024 (v1.0.0 - Major updates: Electron 33, npm migration, package compatibility fixes, architecture improvements)*

