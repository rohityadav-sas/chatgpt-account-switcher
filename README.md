# ChatGPT Account Switcher - Chrome Extension

This Chrome extension allows users to switch between multiple ChatGPT accounts instantly without logging out. It automatically detects your current ChatGPT account and provides a streamlined way to manage and switch between different OpenAI accounts.

## Table of Contents

- [Installation](#installation)

- [Usage](#usage)
  - [Adding Accounts](#adding-accounts)
  - [Switching Between Accounts](#switching-between-accounts)
  - [Managing Your Accounts](#managing-your-accounts)
- [Features](#features)
- [Technical Details](#technical-details)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Contributing](#contributing)

## Installation

1. Download or clone this repository.

2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the folder containing the extension files.
5. The extension will appear in your Chrome toolbar.

## Usage

1. Log in to ChatGPT normally in your browser.

2. Click on the extension icon in the Chrome toolbar.
3. Click "Add Current Account" to save your logged-in account.
4. Repeat for additional accounts you want to manage.
5. Click on any saved account to switch instantly.

### Adding Accounts

1. Visit ChatGPT (```chatgpt.com```) and log in normally

2. Click the extension icon in the Chrome toolbar
3. Click "Add Current Account" to save it
4. Wait for "Account added successfully!" confirmation

### Switching Between Accounts

1. Click the extension icon in the Chrome toolbar

2. Click on any saved account to switch instantly
3. ChatGPT will reload with the selected account
4. No need to log out or enter credentials again

### Managing Your Accounts

1. **Delete accounts** - Click the trash icon next to any account

2. **Export accounts** - Use the export button to backup your account list
3. **Import accounts** - Use the import button to restore from backup files

## Features

### Account Management
- **Multiple Account Storage** - Save unlimited ChatGPT/OpenAI accounts

- **One-Click Switching** - Switch between accounts instantly
- **Auto Account Detection** - Automatically detects your current logged-in account
- **Session Management** - Preserves login sessions for quick switching

### Data Management
- **Import/Export Accounts** - Backup and restore your account list

- **JSON Format Support** - Standard JSON format for easy data portability
- **Account Validation** - Verifies account data integrity
- **Batch Operations** - Import multiple accounts at once

### Privacy & Security
- **Local Storage Only** - All data stored locally on your device

- **No Data Collection** - Zero telemetry or external data sharing
- **Secure Session Handling** - Safe cookie and session token management
- **No External Dependencies** - Works completely offline

## Technical Details

### File Structure

```
chatgpt-switcher/
├── manifest.json          # Extension configuration
├── import.html            # Import page interface
├── import.js              # Import functionality
├── background/
│   └── background.js      # Service worker
├── content/
│   └── content.js         # Content script for ChatGPT detection
├── popup/
│   ├── popup.html         # Main popup interface
│   ├── popup.css          # Popup styling
│   └── popup.js           # Popup logic and functionality
├── utils/
│   ├── storage.js         # Storage operations
│   ├── cookies.js         # Cookie management utilities
│   └── ui.js              # UI helper functions
├── types/
│   └── types.js           # Type definitions and validation
└── icons/
    ├── icon16.png         # Extension icons (16x16, 48x48, 64x64, 128x128)
    ├── icon48.png
    ├── icon64.png
    └── icon128.png
```

### Browser Support

- ✅ Chrome 88+ (Manifest V3)
- ✅ Edge 88+ (Chromium-based browsers)

### Permissions

- `activeTab` - Access current ChatGPT page content
- `storage` - Save accounts to local browser storage
- `cookies` - Manage ChatGPT session cookies
- `*://chatgpt.com/*` - Access ChatGPT pages for account switching

## Troubleshooting

**Extension not detecting account:**
- Make sure you're logged into ChatGPT

- Refresh the ChatGPT page and try again
- Check that you're on chatgpt.com (not other OpenAI sites)

**Account switching not working:**
- Your session may have expired - try logging in again

- Re-add the account if it continues to fail
- Clear browser cookies and cache if problems persist

**Import/Export issues:**
- Only JSON files are supported

- File size must be under 5MB
- Check that your browser allows file downloads

## License

This project is licensed under the ISC License. See the [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


