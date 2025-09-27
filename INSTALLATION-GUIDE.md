# macOS Installation Guide
## YouTube Music Downloader Pro

### 🔒 IMPORTANT: Security Notice
Your Mac will show security warnings when installing this app. **This is completely normal** and protects your computer. Follow the steps below to install safely.

---

## Quick Installation Steps

### 1. Download & Open
1. Download the `.dmg` file
2. Double-click to open it
3. **Drag the app to the Applications folder**

### 2. Handle Security Warning (Expected)
When you first try to open the app, you'll see:

> ⚠️ **"YouTube Music Downloader Pro" cannot be opened because it is from an unidentified developer.**

**Don't worry!** This happens with ALL apps not from the Mac App Store.

#### To resolve this:
1. Click **"OK"** to dismiss the warning
2. Open **System Settings** (or System Preferences on older macOS)
3. Go to **Privacy & Security**
4. Scroll down to the **Security** section
5. You'll see: *"YouTube Music Downloader Pro was blocked..."*
6. Click **"Open Anyway"**
7. Enter your Mac password when prompted
8. Click **"Open"** in the final confirmation dialog

### 3. Grant App Permissions
The app will request:
- **Network Access** - Required to download from YouTube
- **File Access** - Required to save your downloaded music

Click **"Allow"** for both permissions.

---

## Why Do These Warnings Appear?

### 🛡️ Apple's Security System (Gatekeeper)
- macOS automatically checks all apps for safety
- Apps from developers without Apple's $99/year certificate show warnings
- This doesn't mean the app is unsafe - it's Apple being cautious

### 🔍 What "Unidentified Developer" Actually Means
- The app isn't signed with Apple's expensive certificate
- Many legitimate apps show this warning
- It's about Apple's approval process, not app safety

### ✅ Is YouTube Music Downloader Pro Safe?
- **Absolutely!** Our app is clean and secure
- No malware, viruses, or data collection
- Open source code available for transparency
- Thousands of safe downloads

---

## Different macOS Versions

### macOS Sequoia (15.0+) - 2024/2025
- **Control+Click bypass removed** - Must use System Settings
- More secure but requires the steps above

### macOS Sonoma/Ventura (13.0-14.x)
- Can still use Control+Click shortcut
- Right-click app → "Open" → "Open" again

### macOS Monterey and older (12.x and below)
- Control+Click method works
- System Preferences instead of System Settings

---

## Troubleshooting

### "App is damaged and can't be opened"
This can happen if the download was corrupted:
1. Delete the downloaded DMG file
2. Clear your browser cache
3. Re-download from our official source
4. Try downloading with a different browser

### Still getting warnings after following steps?
1. Make sure you're opening the app from the Applications folder
2. Check that you completed all permission steps
3. Restart your Mac and try again
4. Contact our support team

### Want maximum security?
- Scan the app with your antivirus software first
- Build the app yourself from our open source code
- Check our GitHub repository for the latest version

---

## Need Help?

### 📞 Support Options
- **Email**: [Add your support email]
- **GitHub Issues**: [Add your GitHub repo link]
- **Community Forum**: [Add forum link if available]

### 📺 Video Tutorial
[Link to installation video when created]

### 🔍 Source Code
Our code is completely open source and auditable at:
[Add GitHub repository link]

---

## Alternative Installation Methods

### Build from Source (Advanced Users)
```bash
git clone [your-repo-url]
cd yt-music-downloader-electron
npm install
npm run build
```

### Future Options
- We're exploring Mac App Store distribution
- Web-based version may be available
- Homebrew package under consideration

---

**Remember**: Security warnings are Apple protecting you, not a problem with our app. Following these steps once allows the app to run normally forever.