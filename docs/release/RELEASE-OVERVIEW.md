# Liberty App - Release Overview

This document provides a comprehensive guide to building and releasing the Liberty app for production across all supported platforms.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Pre-Release Checklist](#pre-release-checklist)
5. [Version Management](#version-management)
6. [Build Process Overview](#build-process-overview)
7. [Platform-Specific Guides](#platform-specific-guides)
8. [Auto-Updates](#auto-updates)
9. [Distribution](#distribution)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

Liberty is an Electron-based e-book reader application built with:
- **Electron** (v33.x) - Cross-platform desktop framework
- **React** (v18.x) - UI framework
- **TypeScript** - Type-safe JavaScript
- **Rust/WebAssembly** - High-performance reader engine
- **SQLite** - Local database via TypeORM
- **electron-builder** - Build and packaging tool

The app is distributed as:
- **Windows**: NSIS installer (.exe)
- **macOS**: DMG disk image (.dmg)
- **Linux**: AppImage, Snap, and Debian package (.deb)

---

## Prerequisites

### Required Software (All Platforms)

| Software | Minimum Version | Purpose |
|----------|-----------------|---------|
| Node.js | 18.x or higher | JavaScript runtime |
| npm | 9.x or higher | Package manager |
| Git | 2.x or higher | Version control |
| Rust | 1.70+ | WASM reader compilation |
| wasm-pack | 0.12+ | Rust to WASM compiler |

### Installing Node.js

**Windows:**
1. Download from https://nodejs.org/ (LTS version recommended)
2. Run the installer and follow the prompts
3. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

**macOS:**
```bash
# Using Homebrew (recommended)
brew install node

# Verify installation
node --version
npm --version
```

**Linux (Ubuntu/Debian):**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Installing Rust and wasm-pack

**All Platforms:**
```bash
# Install Rust via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart your terminal, then install wasm-pack
cargo install wasm-pack

# Add WASM target
rustup target add wasm32-unknown-unknown

# Verify installation
rustc --version
wasm-pack --version
```

**Windows (if curl isn't available):**
Download rustup-init.exe from https://rustup.rs/ and run it.

---

## Project Structure

Understanding the project structure is essential for the build process:

```
liberty-app/
├── build/                    # Build resources (icons, entitlements)
│   ├── entitlements.mac.plist    # macOS code signing entitlements
│   ├── icon.icns                 # macOS icon
│   ├── icon.ico                  # Windows icon
│   └── icon.png                  # Base icon
├── resources/                # Additional resources
│   ├── app-icons/               # Platform-specific icons
│   │   ├── linux/
│   │   ├── mac/
│   │   └── win/
│   └── dmg-bg-book.png          # macOS DMG background
├── src/                      # Source code
│   ├── main/                    # Electron main process
│   ├── preload/                 # Preload scripts
│   └── renderer/                # React frontend
│       └── src/
│           └── wasm-reader/     # Rust WASM module
├── releases/                 # Output directory (created during build)
│   ├── win/
│   ├── mac/
│   └── linux/
├── electron-builder.yml      # Build configuration
├── electron.vite.config.ts   # Vite configuration
├── package.json              # Project dependencies and scripts
└── dev-app-update.yml        # Development auto-update config
```

---

## Pre-Release Checklist

Before starting the build process, complete these steps:

### 1. Clean Development Artifacts

```bash
# Remove node_modules and reinstall dependencies
rm -rf node_modules
npm install

# Clean WASM build artifacts
npm run wasm:clean
```

**Windows PowerShell:**
```powershell
# Remove node_modules
Remove-Item -Recurse -Force node_modules
npm install

# Clean WASM artifacts
npm run wasm:clean
```

### 2. Run All Tests and Checks

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

### 3. Update Dependencies (if needed)

```bash
# Check for outdated packages
npm outdated

# Update packages (be careful with major versions)
npm update
```

### 4. Database Migrations

Ensure all database migrations are up to date:

```bash
# Run pending migrations
npm run migration:run
```

---

## Version Management

### Updating the Version Number

Before each release, update the version in `package.json`:

```json
{
  "name": "liberty",
  "version": "1.0.0",  // Update this
  ...
}
```

**Versioning Convention (Semantic Versioning):**
- **MAJOR** (1.x.x): Breaking changes, incompatible API changes
- **MINOR** (x.1.x): New features, backwards compatible
- **PATCH** (x.x.1): Bug fixes, backwards compatible

### Examples:
- `1.0.0` → `1.0.1` (bug fix)
- `1.0.1` → `1.1.0` (new feature)
- `1.1.0` → `2.0.0` (breaking change)

### Creating a Git Tag

After updating the version:

```bash
# Commit the version change
git add package.json
git commit -m "Bump version to 1.1.0"

# Create an annotated tag
git tag -a v1.1.0 -m "Release version 1.1.0"

# Push commits and tags
git push origin main
git push origin v1.1.0
```

---

## Build Process Overview

### Step 1: Build the WASM Module

The WASM reader module must be built before the main application:

```bash
# Build WASM module in release mode
npm run wasm:build
```

This command:
1. Navigates to `src/renderer/src/wasm-reader/`
2. Runs `wasm-pack build --target web --release`
3. Outputs compiled WASM and JS bindings to the `pkg/` directory

### Step 2: Build the Application

After the WASM module is built, build the Electron app:

```bash
# Type check and build with Vite
npm run build
```

This command:
1. Runs TypeScript type checking
2. Compiles the main process code
3. Compiles the preload scripts
4. Bundles the renderer (React) application

### Step 3: Package for Target Platform

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

### Output Location

Built packages are saved to:
```
releases/
├── win/
│   └── x64/
│       └── liberty-1.0.0-setup.exe
├── mac/
│   └── arm64/  (or x64)
│       └── liberty-1.0.0.dmg
└── linux/
    └── x64/
        ├── liberty-1.0.0.AppImage
        ├── liberty-1.0.0.snap
        └── liberty-1.0.0.deb
```

---

## Platform-Specific Guides

Detailed instructions for each platform:

| Platform | Guide |
|----------|-------|
| Windows | [RELEASE-WINDOWS.md](./RELEASE-WINDOWS.md) |
| macOS | [RELEASE-MACOS.md](./RELEASE-MACOS.md) |
| Linux | [RELEASE-LINUX.md](./RELEASE-LINUX.md) |

---

## Auto-Updates

Liberty uses `electron-updater` for automatic updates.

### Configuration Files

**Production (`electron-builder.yml`):**
```yaml
publish:
  provider: generic
  url: https://example.com/auto-updates
```

**Development (`dev-app-update.yml`):**
```yaml
provider: generic
url: https://example.com/auto-updates
updaterCacheDirName: liberty-updater
```

### Update Server Setup

To enable auto-updates, you need a web server hosting:

1. **latest.yml** (Windows) / **latest-mac.yml** (macOS) / **latest-linux.yml** (Linux)
   - Generated automatically during build
   - Contains version info and download URLs

2. **The installer files**
   - `liberty-1.0.0-setup.exe` (Windows)
   - `liberty-1.0.0.dmg` (macOS)
   - `liberty-1.0.0.AppImage` (Linux)

### Folder Structure on Update Server

```
https://your-server.com/auto-updates/
├── latest.yml              # Windows update metadata
├── latest-mac.yml          # macOS update metadata
├── latest-linux.yml        # Linux update metadata
├── liberty-1.0.0-setup.exe
├── liberty-1.0.0.dmg
└── liberty-1.0.0.AppImage
```

### Alternative: GitHub Releases

Change the publish configuration to use GitHub:

```yaml
publish:
  provider: github
  owner: your-github-username
  repo: liberty-app
```

---

## Distribution

### Distribution Channels

| Channel | Best For | Pros | Cons |
|---------|----------|------|------|
| Direct Download | Full control | No fees, immediate | Handle hosting yourself |
| GitHub Releases | Open source | Free, built-in updates | Requires GitHub account |
| Microsoft Store | Windows users | Trusted, discoverable | Review process, fees |
| Mac App Store | macOS users | Trusted, discoverable | Strict review, sandbox |
| Snap Store | Linux users | Auto-updates | Snap required |

### Recommended Approach for Small Teams

1. **GitHub Releases** for tech-savvy users
2. **Direct website download** for general public
3. Consider app stores later for wider reach

---

## Troubleshooting

### Common Build Errors

#### "Cannot find module 'electron'"

**Solution:** Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

#### WASM Build Fails

**Solution:** Ensure Rust toolchain is installed:
```bash
rustup update
rustup target add wasm32-unknown-unknown
cargo install wasm-pack --force
```

#### "ENOENT: no such file or directory"

**Solution:** Ensure all paths in `electron-builder.yml` exist:
```bash
# Check required files
ls build/
ls resources/app-icons/
```

#### Build Hangs or Uses Too Much Memory

**Solution:** Increase Node.js memory limit:
```bash
export NODE_OPTIONS="--max-old-space-size=8192"
npm run build:win
```

**Windows:**
```powershell
$env:NODE_OPTIONS="--max-old-space-size=8192"
npm run build:win
```

#### Native Module Build Errors

**Solution:** Rebuild native modules:
```bash
npm run postinstall
# or
npx electron-builder install-app-deps
```

### Getting Help

1. Check the [electron-builder documentation](https://www.electron.build/)
2. Search [electron-builder issues](https://github.com/electron-userland/electron-builder/issues)
3. Check [Electron documentation](https://www.electronjs.org/docs)

---

## Next Steps

1. Read the platform-specific guide for your target OS
2. Set up code signing certificates (required for distribution)
3. Configure your update server
4. Test the built application thoroughly before release

---

**Document Version:** 1.0  
**Last Updated:** December 2024

