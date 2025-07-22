<div align="center">

# 🚀 ChatGPT Account Switcher

### ⚡ Switch between ChatGPT accounts instantly with one click!

<img src="https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome Extension">
<img src="https://img.shields.io/badge/Manifest-V3-FF6B35?style=for-the-badge" alt="Manifest V3">
<img src="https://img.shields.io/badge/Version-2.0.0-00D9FF?style=for-the-badge" alt="Version">

---

**🎯 Seamlessly manage multiple ChatGPT accounts without the hassle of logging in and out repeatedly. Auto-detect your current account and switch between different OpenAI profiles in seconds.**

[📥 Installation](#-installation) • [🎮 Usage](#-usage) • [✨ Features](#-features) • [🔧 Technical](#-technical-details) • [🐛 Troubleshooting](#-troubleshooting)

</div>

---

## 📥 Installation

> **⚡ Quick Setup in 60 seconds**

### 🎯 Download or clone this repository
```bash
git clone https://github.com/rohityadav-sas/chatgpt-account-switcher.git
```

1. **🌐 Open Chrome** → Navigate to `chrome://extensions/`
2. **🔧 Enable Developer Mode** → Toggle switch in top-right corner  
3. **📁 Load Extension** → Click "Load unpacked" → Select the extension folder
4. **✅ Done!** → Extension appears in your Chrome toolbar

### 🛡️ Browser Compatibility

| Browser | Support | Version |
|---------|---------|---------|
| ![Chrome](https://img.shields.io/badge/-Chrome-4285F4?style=flat&logo=googlechrome&logoColor=white) | ✅ Full Support | 88+ |
| ![Edge](https://img.shields.io/badge/-Edge-0078D4?style=flat&logo=microsoftedge&logoColor=white) | ✅ Full Support | 88+ |
| ![Firefox](https://img.shields.io/badge/-Firefox-FF7139?style=flat&logo=firefox&logoColor=white) | ❌ Not Compatible | Manifest V2 Only |

---

## 🎮 Usage

### 🚀 Quick Start Guide

<table>
<tr>
<td width="50%">

#### 1️⃣ **Initial Setup**
```
🌐 Visit chatgpt.com
🔐 Login normally  
🔌 Click extension icon
➕ Click "Add Current Account"
✅ Wait for success message
```

</td>
<td width="50%">

#### 2️⃣ **Switch Accounts**
```  
🔌 Click extension icon
👤 Click any saved account
⚡ Instant account switch
🎉 ChatGPT reloads automatically
```

</td>
</tr>
</table>

---

### 📝 Detailed Walkthrough

<details>
<summary><strong>🏷️ Adding New Accounts</strong></summary>

1. **🌐 Navigate to ChatGPT** → Visit `chatgpt.com` and log in normally
2. **🔌 Open Extension** → Click the extension icon in Chrome toolbar  
3. **➕ Add Account** → Click "Add Current Account" button
4. **✅ Confirmation** → Wait for "Account added successfully!" message
5. **🔄 Repeat** → Add as many accounts as needed

</details>

<details>
<summary><strong>⚡ Switching Between Accounts</strong></summary>

1. **🔌 Open Extension** → Click the extension icon in Chrome toolbar
2. **👤 Select Account** → Click on any saved account from the list
3. **⚡ Instant Switch** → ChatGPT automatically reloads with selected account
4. **✅ No Re-login** → No need to enter credentials again

</details>

<details>
<summary><strong>🛠️ Managing Your Accounts</strong></summary>

| Action | Icon | Description |
|--------|------|-------------|
| **Delete Account** | 🗑️ | Remove account from saved list |
| **Export Data** | 📤 | Backup your account list as JSON |
| **Import Data** | 📥 | Restore accounts from backup file |
| **Refresh List** | 🔄 | Reload and update account information |

</details>

---

## ✨ Features

<div align="center">

### 🏆 **Core Capabilities**

</div>

<table>
<tr>
<td width="33%" align="center">

### 👥 **Account Management**
---
🔐 **Unlimited Storage** - Save infinite ChatGPT accounts  
⚡ **One-Click Switch** - Instant account switching  
🤖 **Auto Detection** - Detects current logged account  
💾 **Session Persistence** - Maintains login sessions  

</td>
<td width="33%" align="center">

### 📊 **Data Management**  
---
📤 **Import/Export** - Backup & restore account lists  
📄 **JSON Format** - Standard format for portability  
✅ **Data Validation** - Ensures account integrity  
📦 **Batch Operations** - Import multiple accounts  

</td>
<td width="33%" align="center">

### 🔒 **Privacy & Security**
---
💻 **Local Storage** - All data stays on your device  
🚫 **Zero Telemetry** - No external data sharing  
🛡️ **Secure Sessions** - Safe cookie management  
🔌 **Offline Ready** - Works without internet  

</td>
</tr>
</table>

---

### 🎨 **User Experience**

```diff
+ 🚀 Lightning-fast account switching (< 2 seconds)
+ 🎯 Clean, modern interface with dark theme
+ 📱 Responsive design works on all screen sizes  
+ 🔔 Smart notifications for all actions
+ 💫 Smooth animations and transitions
+ 🎮 Intuitive drag-and-drop file imports
```

---

## 🔧 Technical Details

### 📁 **Project Architecture**

<details>
<summary><strong>🏗️ File Structure</strong></summary>

```
chatgpt-account-switcher/
├── 📄 manifest.json              # Extension configuration & permissions
├── 🌐 import.html                # Drag-and-drop import interface  
├── ⚙️ import.js                  # Import functionality & validation
├── 📁 background/
│   └── 🔧 background.js          # Service worker & cookie management
├── 📁 content/  
│   └── 🕵️ content.js             # ChatGPT account detection script
├── 📁 popup/
│   ├── 🎨 popup.html             # Main extension popup UI
│   ├── 💅 popup.css              # Modern dark theme styling
│   └── ⚡ popup.js               # Core functionality & event handlers
├── 📁 utils/
│   ├── 💾 storage.js             # Local storage operations
│   ├── 🍪 cookies.js             # Session cookie management
│   └── 🎯 ui.js                  # UI helpers & notifications
└── 📁 icons/
    ├── 🎨 icon16.png             # Extension icons (16x16)
    ├── 🎨 icon48.png             # (48x48)  
    ├── 🎨 icon64.png             # (64x64)
    └── 🎨 icon128.png            # (128x128)
```

</details>

---

### 🛡️ **Security & Permissions**

<table>
<tr>
<td width="50%">

#### **Required Permissions**
```json
{
  "activeTab": "Access current ChatGPT page",
  "storage": "Save accounts locally", 
  "cookies": "Manage session cookies",
  "notifications": "Show status updates",
  "downloads": "Export account data"
}
```

</td>
<td width="50%">

#### **Host Permissions**  
```json
{
  "https://chatgpt.com/*": "ChatGPT domain access"
}
```

**🔒 Security Features:**
- ✅ Manifest V3 compliance
- ✅ Minimal permission scope
- ✅ Local-only data storage
- ✅ No external API calls

</td>
</tr>
</table>

---

### ⚙️ **Technical Specifications**

| Aspect | Details |
|--------|---------|
| **Manifest Version** | ![V3](https://img.shields.io/badge/V3-Latest-brightgreen) |
| **Bundle Size** | `< 50KB` |
| **Storage Type** | `chrome.storage.local` |
| **Max Accounts** | `Unlimited` |
| **File Support** | `JSON only` |
| **Max File Size** | `5MB` |

---

## 🐛 Troubleshooting

<details>
<summary><strong>🔍 Extension Not Detecting Account</strong></summary>

**Possible Solutions:**
```diff
+ ✅ Ensure you're logged into ChatGPT at chatgpt.com
+ ✅ Refresh the ChatGPT page and try again  
+ ✅ Verify you're on chatgpt.com (not other OpenAI sites)
+ ✅ Check if extension has proper permissions enabled
```

**Step-by-step fix:**
1. 🌐 Navigate to `chatgpt.com`
2. 🔐 Log in completely (don't just visit the page)
3. 🔄 Refresh the page once logged in
4. 🔌 Click extension icon and try "Add Current Account"

</details>

<details>
<summary><strong>⚡ Account Switching Not Working</strong></summary>

**Common Causes & Fixes:**
```diff
+ 🕐 Session expired → Log in manually and re-add account
+ 🍪 Corrupted cookies → Clear browser cookies for chatgpt.com  
+ 📡 Network issues → Check internet connection
+ 🔄 Cache problems → Hard refresh (Ctrl+F5) ChatGPT page
```

**Advanced Solutions:**
1. **Clear Extension Data:** Remove and re-add problematic accounts
2. **Browser Cache:** Clear all browsing data for chatgpt.com
3. **Extension Reset:** Disable and re-enable the extension

</details>

<details>
<summary><strong>📁 Import/Export Issues</strong></summary>

**File Requirements:**
```json
{
  "format": "JSON only",
  "max_size": "5MB", 
  "encoding": "UTF-8",
  "structure": "[{\"username\": \"email\", \"sessionToken\": \"token\"}]"
}
```

**Common Issues:**
- ❌ **Invalid Format:** Only `.json` files supported
- ❌ **File Too Large:** Must be under 5MB  
- ❌ **Corrupted Data:** Verify JSON structure is valid
- ❌ **Browser Restrictions:** Enable downloads in browser settings

</details>

<details>
<summary><strong>🚨 Emergency Fixes</strong></summary>

**Complete Reset (Nuclear Option):**
```bash
# 1. Remove extension from Chrome
# 2. Clear all chatgpt.com cookies and data
# 3. Restart browser
# 4. Reinstall extension
# 5. Start fresh with account setup
```

**Still Having Issues?** 
[🐛 Report a Bug](https://github.com/rohityadav-sas/chatgpt-account-switcher/issues/new?template=bug_report.md) • [💡 Feature Request](https://github.com/rohityadav-sas/chatgpt-account-switcher/issues/new?template=feature_request.md)

</details>

---

<div align="center">

## 📄 License & Contributing

**📜 Licensed under [ISC License](./LICENSE) - Free for personal and commercial use**

<table>
<tr>
<td align="center">

### 🤝 **Contributing**
```
1. 🍴 Fork the repository
2. 🌿 Create feature branch  
3. 💻 Make your changes
4. ✅ Test thoroughly
5. 🚀 Submit pull request
```

[**📚 Contributing Guide**](./CONTRIBUTING.md)

</td>
<td align="center">

### ⭐ **Show Your Support**
```
🌟 Star this repository
🐛 Report bugs & issues  
💡 Suggest new features
📢 Share with friends
💝 Sponsor development
```

[**⭐ Star on GitHub**](https://github.com/rohityadav-sas/chatgpt-account-switcher)

</td>
</tr>
</table>

---

**Made with ❤️ for the ChatGPT community**

![Footer](https://img.shields.io/badge/Built%20with-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Footer](https://img.shields.io/badge/Powered%20by-Chrome%20Extensions-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)

</div>


