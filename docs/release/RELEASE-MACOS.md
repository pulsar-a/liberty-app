# Liberty App - macOS Release Guide

This guide provides detailed instructions for building and releasing Liberty for macOS.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Apple Developer Account Setup](#apple-developer-account-setup)
4. [Code Signing Setup](#code-signing-setup)
5. [Notarization Setup](#notarization-setup)
6. [Building the Application](#building-the-application)
7. [Testing the Build](#testing-the-build)
8. [Distribution](#distribution)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| macOS | 12.0 (Monterey) or later | - |
| Xcode | 14.0 or later | Mac App Store |
| Xcode Command Line Tools | Latest | `xcode-select --install` |
| Node.js | 18.x LTS or higher | https://nodejs.org/ or Homebrew |
| Git | Latest | Included with Xcode CLI Tools |
| Rust | 1.70+ | https://rustup.rs/ |
| wasm-pack | 0.12+ | `cargo install wasm-pack` |

### Hardware Requirements

- **Intel Mac**: Can build for Intel (x64) architecture
- **Apple Silicon Mac (M1/M2/M3)**: Can build for both ARM64 and Intel (with Rosetta)

### Installing Xcode Command Line Tools

```bash
xcode-select --install
```

A dialog will appear. Click "Install" and wait for completion.

### Installing Homebrew (Recommended)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Installing Node.js

```bash
# Using Homebrew (recommended)
brew install node

# Verify installation
node --version
npm --version
```

### Installing Rust and wasm-pack

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

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

If everything works, you're ready to build for production.

---

## Apple Developer Account Setup

### Why You Need a Developer Account

| Feature | Without Account | With Free Account | With Paid Account ($99/yr) |
|---------|----------------|-------------------|---------------------------|
| Run on your Mac | ✅ | ✅ | ✅ |
| Code signing | ❌ | ⚠️ (Ad-hoc only) | ✅ (Developer ID) |
| Notarization | ❌ | ❌ | ✅ |
| Distribution | ❌ | ❌ | ✅ |
| Mac App Store | ❌ | ❌ | ✅ |

**For public distribution, you need a paid Apple Developer Account.**

### Creating an Apple Developer Account

1. Go to https://developer.apple.com/programs/
2. Click "Enroll"
3. Sign in with your Apple ID (or create one)
4. Complete enrollment as:
   - **Individual**: Use your personal name
   - **Organization**: Requires D-U-N-S number
5. Pay the $99/year fee
6. Wait for approval (usually 24-48 hours)

---

## Code Signing Setup

### Understanding macOS Code Signing

macOS has strict security requirements:

- **Gatekeeper**: Blocks apps that aren't signed and notarized
- **Developer ID**: Certificate that identifies you as a trusted developer
- **Notarization**: Apple's malware scan that "staples" approval to your app

### Creating Signing Certificates

#### Step 1: Open Keychain Access

```bash
open /Applications/Utilities/Keychain\ Access.app
```

#### Step 2: Create Certificate Signing Request (CSR)

1. Go to **Keychain Access → Certificate Assistant → Request a Certificate From a Certificate Authority**
2. Enter your email address
3. Select "Saved to disk"
4. Click "Continue" and save the file

#### Step 3: Create Certificates in Apple Developer Portal

1. Go to https://developer.apple.com/account/resources/certificates/list
2. Click the "+" button
3. Create these certificates:
   - **Developer ID Application**: For signing the app
   - **Developer ID Installer**: For signing the DMG/PKG

4. For each certificate:
   - Select the certificate type
   - Upload your CSR file
   - Download the certificate (.cer file)
   - Double-click to install in Keychain

#### Step 4: Verify Certificates are Installed

```bash
# List all Developer ID certificates
security find-identity -v -p codesigning | grep "Developer ID"
```

You should see something like:
```
1) ABC123... "Developer ID Application: Your Name (TEAM_ID)"
2) DEF456... "Developer ID Installer: Your Name (TEAM_ID)"
```

### Configuring electron-builder for Signing

The app is already configured for signing in `electron-builder.yml`:

```yaml
mac:
  entitlementsInherit: build/entitlements.mac.plist
  extendInfo:
    - NSDocumentsFolderUsageDescription: Application requests access to the user's Documents folder.
    - NSDownloadsFolderUsageDescription: Application requests access to the user's Downloads folder.
  notarize: false  # We'll enable this later
  icon: resources/app-icons/mac/app-icon.icns
```

### Environment Variables for Signing

Set these before building:

```bash
# Your Apple Developer Team ID (found in developer portal)
export APPLE_TEAM_ID="YOUR_TEAM_ID"

# For automatic certificate selection (optional)
export CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"
```

Find your Team ID at: https://developer.apple.com/account → Membership → Team ID

---

## Notarization Setup

### What is Notarization?

Starting with macOS Catalina (10.15), apps distributed outside the Mac App Store must be notarized. Notarization:
1. Uploads your app to Apple
2. Apple scans for malware
3. Apple "staples" a ticket to your app
4. Users can open your app without security warnings

### Creating App-Specific Password

Apple requires an app-specific password for notarization (not your Apple ID password):

1. Go to https://appleid.apple.com/account/manage
2. Sign in with your Apple ID
3. Under "Sign-In and Security", click "App-Specific Passwords"
4. Click "+" to generate a new password
5. Name it "Liberty Notarization"
6. Copy the generated password (format: xxxx-xxxx-xxxx-xxxx)

### Storing Credentials Securely

Store credentials in Keychain (recommended):

```bash
# Store credentials for notarization
xcrun notarytool store-credentials "liberty-notarize" \
  --apple-id "your.email@example.com" \
  --team-id "YOUR_TEAM_ID" \
  --password "xxxx-xxxx-xxxx-xxxx"
```

When prompted, enter the app-specific password.

### Enabling Notarization in electron-builder

Update `electron-builder.yml`:

```yaml
mac:
  entitlementsInherit: build/entitlements.mac.plist
  extendInfo:
    - NSDocumentsFolderUsageDescription: Application requests access to the user's Documents folder.
    - NSDownloadsFolderUsageDescription: Application requests access to the user's Downloads folder.
  notarize:
    teamId: YOUR_TEAM_ID
  icon: resources/app-icons/mac/app-icon.icns
```

Or use environment variables:

```bash
export APPLE_ID="your.email@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
```

---

## Building the Application

### Understanding Architecture Targets

| Target | Description | Use Case |
|--------|-------------|----------|
| `arm64` | Apple Silicon (M1/M2/M3) | Native performance on new Macs |
| `x64` | Intel | Older Macs |
| `universal` | Both architectures in one file | Maximum compatibility (larger file) |

### Complete Build Process

```bash
# Step 1: Clean previous builds
rm -rf releases/mac
rm -rf out

# Step 2: Install/update dependencies
npm install

# Step 3: Build WASM module (release mode)
npm run wasm:build

# Step 4: Build the application
npm run build:mac
```

### Building for Specific Architectures

```bash
# For Apple Silicon only
npm run build:mac -- --arm64

# For Intel only
npm run build:mac -- --x64

# For Universal (both architectures)
npm run build:mac -- --universal
```

### What Happens During Build

1. **Vite Build**: Compiles TypeScript and bundles React app
2. **Electron Packaging**: Packages with Electron runtime
3. **Code Signing**: Signs with Developer ID certificate
4. **DMG Creation**: Creates disk image with background and icon
5. **Notarization**: (If enabled) Uploads to Apple for approval
6. **Stapling**: (If enabled) Attaches notarization ticket

### Build Output

After successful build:

```
releases/
└── mac/
    └── arm64/  (or x64, or universal)
        ├── liberty-1.0.0.dmg           # Distributable disk image
        ├── liberty-1.0.0.dmg.blockmap  # For delta updates
        ├── latest-mac.yml              # Auto-update metadata
        └── mac/                        # Unpacked app
            └── Liberty.app
```

### Build with Full Signing and Notarization

```bash
# Set environment variables
export APPLE_ID="your.email@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="YOUR_TEAM_ID"

# Build with notarization
npm run build:mac
```

**Note:** Notarization can take 5-15 minutes as Apple scans your app.

---

## Testing the Build

### Test 1: Verify Code Signature

```bash
# Check if app is signed
codesign --verify --deep --strict releases/mac/arm64/mac/Liberty.app

# Display signature details
codesign -dv --verbose=4 releases/mac/arm64/mac/Liberty.app
```

### Test 2: Verify Notarization

```bash
# Check notarization status
spctl --assess --verbose=4 releases/mac/arm64/mac/Liberty.app

# Expected output: "accepted"
# source=Notarized Developer ID
```

### Test 3: Test the DMG

1. Double-click the `.dmg` file
2. Verify the custom background appears
3. Drag Liberty.app to Applications
4. Open Liberty from Applications folder
5. Verify no security warnings appear

### Test 4: Test on a Clean Machine

For the most accurate test:
1. Use a Mac that has never run the development version
2. Download the DMG from your distribution location
3. Install and verify it opens without security prompts

### Test 5: Test Gatekeeper (First Launch)

```bash
# Simulate first launch quarantine
xattr -w com.apple.quarantine "0081;$(printf %x $(date +%s));Safari;$(uuidgen)" releases/mac/arm64/liberty-1.0.0.dmg

# Now test opening the DMG
open releases/mac/arm64/liberty-1.0.0.dmg
```

---

## Distribution

### Option 1: Direct Download (Website)

1. Upload `liberty-1.0.0.dmg` to your web server
2. Provide download link on your website
3. For auto-updates, also upload:
   - `latest-mac.yml`
   - `liberty-1.0.0.dmg.blockmap`

### Option 2: GitHub Releases

```bash
# Install GitHub CLI
brew install gh

# Login to GitHub
gh auth login

# Create a release
gh release create v1.0.0 \
  releases/mac/arm64/liberty-1.0.0.dmg \
  releases/mac/arm64/latest-mac.yml \
  --title "Liberty v1.0.0" \
  --notes "Release notes here"
```

### Option 3: Mac App Store

Publishing to the Mac App Store requires additional steps:

1. **Create App Store Connect Record**
   - Go to https://appstoreconnect.apple.com
   - Create a new app record

2. **Additional Certificates**
   - Create "Mac App Distribution" certificate
   - Create "Mac Installer Distribution" certificate

3. **Provisioning Profile**
   - Create Mac App Store provisioning profile

4. **Sandboxing**
   - Update entitlements for App Store requirements
   - Many Electron apps need modifications

5. **Build for App Store**
   ```yaml
   # In electron-builder.yml
   mac:
     target:
       - dmg
       - mas  # Mac App Store
   mas:
     entitlements: build/entitlements.mas.plist
     entitlementsInherit: build/entitlements.mas.inherit.plist
   ```

---

## Troubleshooting

### Error: "The application is damaged"

**Problem:** Code signature is invalid or missing.

**Solution:**
```bash
# Remove quarantine attribute
xattr -cr /Applications/Liberty.app

# Or re-sign the app
codesign --force --deep --sign "Developer ID Application: Your Name" /Applications/Liberty.app
```

### Error: "Cannot be opened because the developer cannot be verified"

**Problem:** App is not notarized.

**Solutions:**

1. **For users**: Right-click → Open → Open anyway
2. **For developers**: Enable notarization and rebuild

### Error: "No signing identity found"

**Problem:** Certificate not installed or not found.

**Solution:**
```bash
# List available identities
security find-identity -v -p codesigning

# If empty, reinstall certificates from developer portal
```

### Error: "Unable to notarize"

**Problem:** Notarization rejected by Apple.

**Solution:**
```bash
# Check notarization log
xcrun notarytool log <submission-id> --keychain-profile "liberty-notarize"
```

Common issues:
- Missing hardened runtime
- Unsigned frameworks or helpers
- Forbidden entitlements

### Error: "Code signature invalid for distribution"

**Problem:** Incorrect entitlements or missing hardened runtime.

**Solution:** Ensure `entitlements.mac.plist` contains required keys:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.allow-dyld-environment-variables</key>
    <true/>
  </dict>
</plist>
```

### Notarization Takes Too Long

**Problem:** Notarization is slow or times out.

**Solution:**
- Apple's service can be slow during peak times
- Check Apple's system status: https://developer.apple.com/system-status/
- Try again later

### Build Fails with "EACCES: permission denied"

**Problem:** File permission issues.

**Solution:**
```bash
# Fix permissions
sudo chown -R $(whoami) releases/
chmod -R 755 releases/

# Clear node_modules and rebuild
rm -rf node_modules
npm install
```

### Universal Build is Very Large

**Problem:** Universal binary doubles the app size.

**Solution:**
- Consider distributing separate ARM64 and x64 versions
- Or accept the size trade-off for user convenience

---

## Quick Reference

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run wasm:build` | Build WASM module (release) |
| `npm run build` | Build app (no packaging) |
| `npm run build:mac` | Build and package for macOS |
| `npm run build:mac -- --arm64` | Build for Apple Silicon only |
| `npm run build:mac -- --x64` | Build for Intel only |
| `npm run build:mac -- --universal` | Build Universal binary |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `APPLE_ID` | Your Apple ID email |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for notarization |
| `APPLE_TEAM_ID` | Your Apple Developer Team ID |
| `CSC_NAME` | Code signing certificate name |
| `CSC_LINK` | Path to .p12 certificate file |
| `CSC_KEY_PASSWORD` | Certificate password |

### Useful Commands

```bash
# Check code signature
codesign -dv --verbose=4 Liberty.app

# Check notarization
spctl --assess --verbose=4 Liberty.app

# List signing identities
security find-identity -v -p codesigning

# Check notarization history
xcrun notarytool history --keychain-profile "liberty-notarize"
```

---

## Checklist Before Release

- [ ] Apple Developer Account active
- [ ] Developer ID certificates installed
- [ ] Version number updated in `package.json`
- [ ] WASM module built in release mode
- [ ] Build completed without errors
- [ ] App code signature verified
- [ ] App notarization verified (if applicable)
- [ ] DMG opens and installs correctly
- [ ] Tested on clean macOS installation
- [ ] Auto-update server configured (if applicable)
- [ ] Release notes prepared

---

**Document Version:** 1.0  
**Last Updated:** December 2024

