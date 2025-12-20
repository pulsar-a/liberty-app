# Liberty App - Linux Release Guide

This guide provides detailed instructions for building and releasing Liberty for Linux.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Building the Application](#building-the-application)
4. [Package Formats](#package-formats)
5. [Testing the Build](#testing-the-build)
6. [Distribution](#distribution)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Supported Distributions

Liberty can be built on most modern Linux distributions. This guide focuses on:
- **Ubuntu** 20.04+ / Debian 11+
- **Fedora** 35+
- **Arch Linux**

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x LTS or higher | JavaScript runtime |
| npm | 9.x or higher | Package manager |
| Git | 2.x or higher | Version control |
| Rust | 1.70+ | WASM reader compilation |
| wasm-pack | 0.12+ | Rust to WASM compiler |
| Build essentials | Latest | Native module compilation |

### Distribution-Specific Prerequisites

#### Ubuntu/Debian

```bash
# Update package lists
sudo apt update

# Install build essentials and dependencies
sudo apt install -y \
  build-essential \
  git \
  curl \
  libgtk-3-0 \
  libnotify4 \
  libnss3 \
  libxss1 \
  libxtst6 \
  xdg-utils \
  libatspi2.0-0 \
  libuuid1 \
  libsecret-1-0 \
  libasound2

# For Electron native modules
sudo apt install -y \
  libx11-dev \
  libxkbfile-dev \
  libsecret-1-dev \
  python3 \
  python-is-python3

# For building .deb packages
sudo apt install -y dpkg fakeroot

# For building snap packages
sudo apt install -y snapcraft

# For building AppImage
sudo apt install -y libfuse2
```

#### Fedora

```bash
# Install development tools
sudo dnf groupinstall -y "Development Tools"

# Install dependencies
sudo dnf install -y \
  git \
  curl \
  gtk3 \
  libnotify \
  nss \
  libXScrnSaver \
  libXtst \
  xdg-utils \
  at-spi2-core \
  libuuid \
  libsecret \
  alsa-lib

# For Electron native modules
sudo dnf install -y \
  libX11-devel \
  libxkbfile-devel \
  libsecret-devel \
  python3

# For building RPM packages
sudo dnf install -y rpm-build
```

#### Arch Linux

```bash
# Install base development tools
sudo pacman -S --needed base-devel git curl

# Install dependencies
sudo pacman -S --needed \
  gtk3 \
  libnotify \
  nss \
  libxss \
  libxtst \
  xdg-utils \
  at-spi2-core \
  util-linux-libs \
  libsecret \
  alsa-lib

# For AppImage
sudo pacman -S --needed fuse2
```

### Installing Node.js

#### Option 1: Using NodeSource (Recommended)

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

**Fedora:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Verify installation
node --version
npm --version
```

#### Option 2: Using nvm (Node Version Manager)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.bashrc  # or ~/.zshrc

# Install Node.js
nvm install 20
nvm use 20

# Verify installation
node --version
npm --version
```

### Installing Rust and wasm-pack

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow the prompts, choose option 1 (default)

# Restart terminal or run:
source $HOME/.cargo/env

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install wasm-pack
cargo install wasm-pack

# Verify installation
rustc --version
wasm-pack --version
```

---

## Development Environment Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/liberty-app.git
cd liberty-app
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

### Step 3: Build the WASM Module

```bash
npm run wasm:build
```

### Step 4: Test Development Build

```bash
npm run dev
```

If the app opens without errors, you're ready to build for production.

---

## Building the Application

### Complete Build Process

```bash
# Step 1: Clean previous builds
rm -rf releases/linux
rm -rf out

# Step 2: Install/update dependencies
npm install

# Step 3: Build WASM module (release mode)
npm run wasm:build

# Step 4: Build the application
npm run build:linux
```

### What Happens During Build

1. **TypeScript Compilation**: All .ts/.tsx files are compiled
2. **Vite Bundling**: React app is bundled with assets
3. **Electron Packaging**: App is packaged with Electron runtime
4. **Package Creation**: AppImage, Snap, and .deb packages are created

### Build Configuration

The `electron-builder.yml` contains Linux-specific settings:

```yaml
linux:
  target:
    - AppImage    # Universal Linux format
    - snap        # Ubuntu Snap package
    - deb         # Debian/Ubuntu package
  maintainer: pulsar-a.com
  category: Utility

appImage:
  artifactName: ${name}-${version}.${ext}
```

### Build Output

After successful build:

```
releases/
└── linux/
    └── x64/
        ├── liberty-1.0.0.AppImage           # Universal package
        ├── liberty-1.0.0.snap               # Snap package
        ├── liberty-1.0.0.deb                # Debian package
        ├── latest-linux.yml                 # Auto-update metadata
        └── linux-unpacked/                  # Unpacked app
            └── liberty
```

### Building Specific Package Types Only

To build only certain package types, modify `electron-builder.yml`:

```yaml
linux:
  target:
    - AppImage  # Only AppImage
```

Or use command line:

```bash
# Build only AppImage
npx electron-builder --linux AppImage

# Build only .deb
npx electron-builder --linux deb

# Build only snap
npx electron-builder --linux snap
```

---

## Package Formats

### AppImage (Recommended for Universal Distribution)

**Pros:**
- Works on virtually any Linux distribution
- No installation required (just download and run)
- Self-contained with all dependencies
- Easy to update

**Cons:**
- Larger file size
- Not integrated into system package manager
- Requires FUSE for mounting

**Using AppImage:**
```bash
# Make executable
chmod +x liberty-1.0.0.AppImage

# Run
./liberty-1.0.0.AppImage

# Or integrate with desktop (optional)
./liberty-1.0.0.AppImage --appimage-extract
```

### Snap Package

**Pros:**
- Automatic updates
- Sandboxed for security
- Easy installation from Snap Store
- Works across distributions

**Cons:**
- Requires snapd
- Some distributions don't support snaps
- Sandboxing can limit functionality

**Installing Snap:**
```bash
# Install
sudo snap install liberty-1.0.0.snap --dangerous

# The --dangerous flag is needed for local snaps
# (not needed when installing from Snap Store)
```

### Debian Package (.deb)

**Pros:**
- Native integration with Debian/Ubuntu
- Managed by apt package manager
- Proper dependency handling
- System menu integration

**Cons:**
- Only works on Debian-based distributions

**Installing .deb:**
```bash
# Install using dpkg
sudo dpkg -i liberty-1.0.0.deb

# Fix any dependency issues
sudo apt install -f

# Or use apt directly (Ubuntu 22.04+)
sudo apt install ./liberty-1.0.0.deb
```

### Additional Formats (Optional)

You can add more formats to `electron-builder.yml`:

```yaml
linux:
  target:
    - AppImage
    - snap
    - deb
    - rpm         # For Fedora/RHEL
    - pacman      # For Arch Linux
    - tar.gz      # Simple archive
```

**For RPM (Fedora/RHEL):**
```bash
# Install
sudo dnf install liberty-1.0.0.rpm
```

---

## Testing the Build

### Test 1: Run AppImage

```bash
# Make executable
chmod +x releases/linux/x64/liberty-1.0.0.AppImage

# Run
./releases/linux/x64/liberty-1.0.0.AppImage
```

### Test 2: Install and Test .deb Package

```bash
# Install
sudo dpkg -i releases/linux/x64/liberty-1.0.0.deb

# Run from terminal
liberty

# Or find in applications menu
```

### Test 3: Install and Test Snap

```bash
# Install local snap
sudo snap install releases/linux/x64/liberty-1.0.0.snap --dangerous

# Run
snap run liberty
```

### Test 4: Verify Desktop Integration

After installing .deb or snap:
1. Open your application menu
2. Search for "Liberty"
3. Verify the icon appears correctly
4. Launch from the menu

### Test 5: Test on a Clean System

For accurate testing, use a fresh VM or container:

```bash
# Using Docker for quick testing
docker run -it --rm \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -v $(pwd)/releases/linux/x64:/app \
  ubuntu:22.04 bash

# Inside container
apt update && apt install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 libasound2 fuse libfuse2
chmod +x /app/liberty-1.0.0.AppImage
/app/liberty-1.0.0.AppImage --appimage-extract-and-run
```

---

## Distribution

### Option 1: Direct Download (Website)

1. Upload packages to your web server:
   - `liberty-1.0.0.AppImage`
   - `liberty-1.0.0.deb`
   - `liberty-1.0.0.snap`
   - `latest-linux.yml` (for auto-updates)

2. Provide download links on your website

### Option 2: GitHub Releases

```bash
# Install GitHub CLI
# Ubuntu: sudo apt install gh
# Fedora: sudo dnf install gh
# Arch: sudo pacman -S github-cli

# Login to GitHub
gh auth login

# Create a release
gh release create v1.0.0 \
  releases/linux/x64/liberty-1.0.0.AppImage \
  releases/linux/x64/liberty-1.0.0.deb \
  releases/linux/x64/liberty-1.0.0.snap \
  releases/linux/x64/latest-linux.yml \
  --title "Liberty v1.0.0" \
  --notes "Release notes here"
```

### Option 3: Snap Store

Publishing to the Snap Store:

1. **Create Snapcraft Account**
   - Go to https://snapcraft.io/
   - Create an account

2. **Login to Snapcraft**
   ```bash
   snapcraft login
   ```

3. **Register Your App Name**
   ```bash
   snapcraft register liberty
   ```

4. **Upload the Snap**
   ```bash
   snapcraft upload releases/linux/x64/liberty-1.0.0.snap --release=stable
   ```

5. **Users Can Then Install With:**
   ```bash
   sudo snap install liberty
   ```

### Option 4: Flathub (Flatpak)

Flatpak distribution requires creating a Flatpak manifest. This is more complex but reaches a wide audience.

1. Create a Flatpak manifest file
2. Submit to Flathub: https://github.com/flathub/flathub/wiki/App-Submission

### Option 5: AUR (Arch User Repository)

For Arch Linux users, create a PKGBUILD:

```bash
# Create PKGBUILD file
pkgname=liberty
pkgver=1.0.0
pkgrel=1
pkgdesc="An e-book reader application"
arch=('x86_64')
url="https://github.com/your-org/liberty-app"
license=('UNLICENSED')
depends=('gtk3' 'libnotify' 'nss' 'libxss' 'libxtst' 'alsa-lib')
source=("$pkgname-$pkgver.AppImage::https://github.com/your-org/liberty-app/releases/download/v$pkgver/liberty-$pkgver.AppImage")
sha256sums=('SKIP')

package() {
  install -Dm755 "$srcdir/$pkgname-$pkgver.AppImage" "$pkgdir/opt/$pkgname/$pkgname.AppImage"
  install -Dm644 "$srcdir/$pkgname.desktop" "$pkgdir/usr/share/applications/$pkgname.desktop"
}
```

---

## Troubleshooting

### Error: "EACCES: permission denied"

**Problem:** npm doesn't have write permissions.

**Solution:**
```bash
# Fix npm permissions
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Error: "Cannot open FUSE device"

**Problem:** FUSE not installed or not working.

**Solution:**
```bash
# Install fuse
sudo apt install fuse libfuse2  # Ubuntu/Debian
sudo dnf install fuse fuse-libs  # Fedora
sudo pacman -S fuse2  # Arch

# Load fuse module
sudo modprobe fuse

# Add user to fuse group
sudo usermod -aG fuse $USER
# Log out and log back in
```

### Error: AppImage won't run

**Problem:** Various AppImage issues.

**Solutions:**
```bash
# Make executable
chmod +x liberty-1.0.0.AppImage

# If FUSE fails, extract and run
./liberty-1.0.0.AppImage --appimage-extract
./squashfs-root/AppRun

# Or use --appimage-extract-and-run
./liberty-1.0.0.AppImage --appimage-extract-and-run
```

### Error: "Error while loading shared libraries"

**Problem:** Missing system libraries.

**Solution:**
```bash
# Ubuntu/Debian
sudo apt install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 libasound2

# Fedora
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst alsa-lib

# Check which library is missing
ldd releases/linux/x64/linux-unpacked/liberty | grep "not found"
```

### Error: Snap installation fails

**Problem:** Snap connection or signature issues.

**Solution:**
```bash
# For local snaps, use --dangerous flag
sudo snap install liberty-1.0.0.snap --dangerous

# If snapd isn't running
sudo systemctl start snapd
sudo systemctl enable snapd
```

### Error: "dpkg: error processing package"

**Problem:** Dependency issues with .deb package.

**Solution:**
```bash
# Fix broken dependencies
sudo apt install -f

# Or use apt to install (handles dependencies)
sudo apt install ./liberty-1.0.0.deb
```

### App Crashes on Launch

**Problem:** Missing dependencies or incompatible libraries.

**Solution:**
```bash
# Run from terminal to see error messages
./liberty-1.0.0.AppImage

# Or for installed version
/opt/Liberty/liberty

# Check for errors in system logs
journalctl -f

# Install missing dependencies based on error messages
```

### Sandbox/Permissions Issues

**Problem:** App can't access certain directories (especially with Snap).

**Solution:**
```bash
# For snap, grant permissions
sudo snap connect liberty:home
sudo snap connect liberty:removable-media

# Check current connections
snap connections liberty
```

### WASM Build Fails

**Problem:** Rust/wasm-pack issues.

**Solution:**
```bash
# Update Rust toolchain
rustup update

# Reinstall wasm-pack
cargo install wasm-pack --force

# Clean and rebuild
npm run wasm:clean
npm run wasm:build

# If still failing, check for missing system deps
# Ubuntu/Debian:
sudo apt install pkg-config libssl-dev
```

---

## Quick Reference

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run wasm:build` | Build WASM module (release) |
| `npm run build` | Build app (no packaging) |
| `npm run build:linux` | Build and package for Linux |

### Package Installation

| Format | Install Command |
|--------|-----------------|
| AppImage | `chmod +x liberty.AppImage && ./liberty.AppImage` |
| .deb | `sudo apt install ./liberty.deb` |
| .snap | `sudo snap install liberty.snap --dangerous` |
| .rpm | `sudo dnf install liberty.rpm` |

### Output Files

| File | Purpose |
|------|---------|
| `liberty-X.X.X.AppImage` | Universal package |
| `liberty-X.X.X.deb` | Debian/Ubuntu package |
| `liberty-X.X.X.snap` | Snap package |
| `latest-linux.yml` | Auto-update metadata |
| `linux-unpacked/` | Portable version (for testing) |

---

## Checklist Before Release

- [ ] Version number updated in `package.json`
- [ ] All dependencies installed without errors
- [ ] WASM module built in release mode
- [ ] Build completed without errors
- [ ] AppImage tested (runs without installation)
- [ ] .deb package tested (installs and runs)
- [ ] Snap package tested (installs and runs)
- [ ] Desktop integration works (menu, icons)
- [ ] Tested on multiple distributions
- [ ] Auto-update server configured (if applicable)
- [ ] Release notes prepared

---

## Distribution Summary

| Distribution Method | Best For | Effort |
|---------------------|----------|--------|
| GitHub Releases | Open source projects | Low |
| Direct Download | Any project | Low |
| Snap Store | Ubuntu-focused | Medium |
| Flathub | Universal Linux | High |
| AUR | Arch Linux users | Medium |

For most projects, **GitHub Releases + Snap Store** provides the best balance of reach and effort.

---

**Document Version:** 1.0  
**Last Updated:** December 2024

