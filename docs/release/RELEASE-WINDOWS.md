# Liberty App - Windows Release Guide

This guide provides detailed instructions for building and releasing Liberty for Windows.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Code Signing Setup](#code-signing-setup)
4. [Building the Application](#building-the-application)
5. [Testing the Build](#testing-the-build)
6. [Distribution](#distribution)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| Windows | 10/11 (64-bit) | - |
| Node.js | 18.x LTS or higher | https://nodejs.org/ |
| Git | Latest | https://git-scm.com/ |
| Visual Studio Build Tools | 2019 or later | https://visualstudio.microsoft.com/downloads/ |
| Rust | 1.70+ | https://rustup.rs/ |
| wasm-pack | 0.12+ | `cargo install wasm-pack` |

### Installing Visual Studio Build Tools

The Visual Studio Build Tools are required for compiling native Node.js modules (like SQLite3).

1. Download **Visual Studio Build Tools** from:
   https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

2. Run the installer and select:
   - **"Desktop development with C++"** workload
   
3. Under "Individual Components", ensure these are selected:
   - MSVC v143 - VS 2022 C++ x64/x86 build tools
   - Windows 10/11 SDK
   - C++ CMake tools for Windows

4. Click **Install** and wait for completion

5. Restart your computer after installation

### Installing Python (if needed)

Some native modules may require Python:

1. Download Python 3.x from https://www.python.org/downloads/
2. During installation, check **"Add Python to PATH"**
3. Verify installation:
   ```powershell
   python --version
   ```

---

## Development Environment Setup

### Step 1: Clone the Repository

```powershell
git clone https://github.com/your-org/liberty-app.git
cd liberty-app
```

### Step 2: Install Node.js Dependencies

```powershell
# Install all dependencies
npm install

# This also runs postinstall which builds native modules
```

### Step 3: Install Rust and wasm-pack

```powershell
# Download and run rustup-init.exe from https://rustup.rs/
# Or use winget:
winget install Rustlang.Rustup

# Restart PowerShell, then:
rustup target add wasm32-unknown-unknown
cargo install wasm-pack

# Verify installation
rustc --version
wasm-pack --version
```

### Step 4: Build the WASM Module

```powershell
npm run wasm:build
```

### Step 5: Test Development Build

```powershell
# Run the app in development mode
npm run dev
```

If everything works, you're ready to build for production.

---

## Code Signing Setup

### Why Code Signing Matters

- **Without signing**: Windows shows "Windows protected your PC" warning
- **With signing**: App appears trusted, no scary warnings

### Obtaining a Code Signing Certificate

#### Option 1: Purchase from a Certificate Authority (Recommended for Distribution)

Trusted CAs that issue Windows code signing certificates:

| Provider | Price Range | Notes |
|----------|-------------|-------|
| DigiCert | $400-600/year | Industry standard |
| Sectigo (Comodo) | $200-400/year | Good budget option |
| GlobalSign | $300-500/year | Established provider |
| SSL.com | $200-400/year | Developer-friendly |

**Steps to obtain:**
1. Choose a Certificate Authority
2. Complete identity verification (business or individual)
3. Receive the certificate file (.pfx or .p12)

#### Option 2: Self-Signed Certificate (Development Only)

**⚠️ Warning:** Self-signed certificates will still trigger Windows warnings. Use only for internal testing.

```powershell
# Create a self-signed certificate (PowerShell as Administrator)
$cert = New-SelfSignedCertificate `
  -Type CodeSigningCert `
  -Subject "CN=Liberty Development" `
  -KeyAlgorithm RSA `
  -KeyLength 2048 `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -NotAfter (Get-Date).AddYears(3)

# Export to PFX file
$password = ConvertTo-SecureString -String "YourPassword123!" -Force -AsPlainText
Export-PfxCertificate `
  -Cert $cert `
  -FilePath ".\liberty-dev-cert.pfx" `
  -Password $password
```

### Configuring Code Signing

#### Method 1: Environment Variables (Recommended)

Set these environment variables before building:

```powershell
# Set certificate path and password
$env:CSC_LINK = "C:\path\to\your-certificate.pfx"
$env:CSC_KEY_PASSWORD = "your-certificate-password"

# Now run the build
npm run build:win
```

#### Method 2: Add to electron-builder.yml

```yaml
win:
  executableName: Liberty
  icon: resources/app-icons/win/app-icon.ico
  certificateFile: path/to/certificate.pfx
  certificatePassword: ${env.CERT_PASSWORD}  # Use env var for password
  signingHashAlgorithms:
    - sha256
```

#### Method 3: Windows Certificate Store

If your certificate is installed in the Windows Certificate Store:

```yaml
win:
  certificateSubjectName: "Your Company Name"
  # or
  certificateSha1: "certificate-thumbprint-here"
```

### Verifying the Signature

After building, verify the signature:

```powershell
# Using signtool (from Windows SDK)
& "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe" verify /pa ".\releases\win\x64\liberty-1.0.0-setup.exe"

# Or right-click the .exe → Properties → Digital Signatures tab
```

---

## Building the Application

### Complete Build Process

```powershell
# Step 1: Clean previous builds
Remove-Item -Recurse -Force .\releases\win -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\out -ErrorAction SilentlyContinue

# Step 2: Install/update dependencies
npm install

# Step 3: Build WASM module (release mode)
npm run wasm:build

# Step 4: Build the application
npm run build:win
```

### What Happens During Build

1. **TypeScript Compilation**: All .ts/.tsx files are compiled
2. **Vite Bundling**: React app is bundled with assets
3. **Electron Packaging**: App is packaged with Electron runtime
4. **NSIS Installer Creation**: Windows installer is created
5. **Code Signing**: (If configured) Executable is signed

### Build Output

After successful build, you'll find:

```
releases/
└── win/
    └── x64/
        ├── liberty-1.0.0-setup.exe      # NSIS installer (distribute this)
        ├── liberty-1.0.0-setup.exe.blockmap  # For delta updates
        ├── latest.yml                   # Auto-update metadata
        └── win-unpacked/                # Unpacked app (for testing)
            ├── Liberty.exe
            ├── resources/
            └── ...
```

### Build Configuration Explained

The `electron-builder.yml` contains Windows-specific settings:

```yaml
# Windows executable settings
win:
  executableName: Liberty              # Name of the .exe file
  icon: resources/app-icons/win/app-icon.ico  # App icon

# NSIS installer settings
nsis:
  artifactName: ${name}-${version}-setup.${ext}  # Output filename
  shortcutName: ${productName}         # Start menu shortcut name
  uninstallDisplayName: ${productName} # Control Panel name
  createDesktopShortcut: always        # Always create desktop shortcut
  installerIcon: resources/app-icons/win/app-icon.ico  # Installer icon
```

---

## Testing the Build

### Test 1: Run the Unpacked Application

```powershell
# Run directly without installing
.\releases\win\x64\win-unpacked\Liberty.exe
```

### Test 2: Install and Test

1. Run `liberty-1.0.0-setup.exe`
2. Follow the installation wizard
3. Launch from Start Menu or Desktop
4. Test all major features:
   - Open a book
   - Navigate pages
   - Change settings
   - Search functionality

### Test 3: Test on a Clean Machine

For the most accurate test:
1. Create a Windows VM (or use a different PC)
2. Ensure Node.js is NOT installed
3. Run the installer
4. Verify the app works without development dependencies

### Test 4: Verify Auto-Updates

If you have an update server configured:
1. Build an older version first
2. Deploy the newer version to your update server
3. Install the older version
4. Check for updates (should find and install the new version)

---

## Distribution

### Option 1: Direct Download (Website)

1. Upload `liberty-1.0.0-setup.exe` to your web server
2. Provide download link on your website
3. If you have auto-updates, also upload:
   - `latest.yml`
   - `liberty-1.0.0-setup.exe.blockmap`

### Option 2: GitHub Releases

```powershell
# Install GitHub CLI if needed
winget install GitHub.cli

# Login to GitHub
gh auth login

# Create a release
gh release create v1.0.0 `
  .\releases\win\x64\liberty-1.0.0-setup.exe `
  .\releases\win\x64\latest.yml `
  --title "Liberty v1.0.0" `
  --notes "Release notes here"
```

### Option 3: Microsoft Store

Publishing to Microsoft Store requires:
1. Microsoft Partner Center account ($19 one-time fee)
2. MSIX package format (additional configuration needed)
3. Meeting Microsoft Store policies

Add to `electron-builder.yml` for MSIX:
```yaml
win:
  target:
    - nsis
    - appx  # For Microsoft Store

appx:
  applicationId: YourCompany.Liberty
  identityName: YourCompany.Liberty
  publisher: CN=YourPublisherID
  publisherDisplayName: Your Company Name
```

---

## Troubleshooting

### Error: "gyp ERR! find VS"

**Problem:** Node-gyp can't find Visual Studio Build Tools.

**Solution:**
```powershell
# Install windows-build-tools (run PowerShell as Administrator)
npm install --global windows-build-tools

# Or manually configure node-gyp
npm config set msvs_version 2022
```

### Error: "Cannot find module 'sqlite3'"

**Problem:** Native module not built correctly.

**Solution:**
```powershell
# Rebuild native modules
npm run postinstall

# Or force rebuild
npx electron-builder install-app-deps
```

### Error: "The specified module could not be found"

**Problem:** DLL dependencies missing.

**Solution:**
1. Ensure Visual C++ Redistributable is installed on target machine
2. Or include it in your installer:
   ```yaml
   nsis:
     include: "build/vc_redist.x64.exe"
     runAfterFinish: false
   ```

### Warning: "Windows protected your PC"

**Problem:** App is not code-signed.

**Solution:** Sign your application with a trusted certificate (see [Code Signing Setup](#code-signing-setup)).

### Error: "EPERM: operation not permitted"

**Problem:** File is locked or permission denied.

**Solution:**
```powershell
# Close any running instances of the app
Get-Process -Name "Liberty" | Stop-Process -Force

# Clear the releases folder
Remove-Item -Recurse -Force .\releases\win
```

### Build is Very Slow

**Solution:** Increase Node.js memory and disable antivirus temporarily:

```powershell
# Increase memory limit
$env:NODE_OPTIONS = "--max-old-space-size=8192"

# Exclude project folder from Windows Defender
Add-MpPreference -ExclusionPath "G:\code\liberty-app"
```

### WASM Build Fails

**Solution:**
```powershell
# Update Rust toolchain
rustup update

# Reinstall wasm-pack
cargo install wasm-pack --force

# Clear and rebuild
npm run wasm:clean
npm run wasm:build
```

---

## Quick Reference

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run wasm:build` | Build WASM module (release) |
| `npm run build` | Build app (no packaging) |
| `npm run build:win` | Build and package for Windows |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `CSC_LINK` | Path to code signing certificate (.pfx) |
| `CSC_KEY_PASSWORD` | Certificate password |
| `NODE_OPTIONS` | Node.js options (e.g., `--max-old-space-size=8192`) |

### Output Files

| File | Purpose |
|------|---------|
| `liberty-X.X.X-setup.exe` | Main installer (distribute this) |
| `latest.yml` | Auto-update metadata |
| `*.blockmap` | For efficient delta updates |
| `win-unpacked/` | Portable version (for testing) |

---

## Checklist Before Release

- [ ] Version number updated in `package.json`
- [ ] All tests passing
- [ ] WASM module built in release mode
- [ ] Code signing certificate configured
- [ ] Build completed without errors
- [ ] Tested on clean Windows installation
- [ ] Auto-update server configured (if applicable)
- [ ] Release notes prepared

---

**Document Version:** 1.0  
**Last Updated:** December 2024

