# 🚀 NOVIQ Chrome Extension

Create Solana payment links instantly from anywhere on the web!

## Features

- ⚡ **Quick Payment Creation** - Create payment links in seconds
- 📋 **Auto Copy** - Links automatically copied to clipboard
- 🎯 **Smart Detection** - Detects amounts on webpages
- ⌨️ **Keyboard Shortcut** - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
- 💾 **Saved Wallet** - Remembers your wallet address
- 🎨 **Beautiful UI** - Modern, dark-themed interface

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit Chrome Web Store
2. Search for "NOVIQ"
3. Click "Add to Chrome"

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `chrome-extension` folder
6. Done! The extension icon will appear in your toolbar

## Usage

### Method 1: Extension Popup
1. Click the NOVIQ icon in your toolbar
2. Enter your wallet address (saved for future use)
3. Enter amount and description
4. Click "Create Payment Link"
5. Link is automatically copied to clipboard!

### Method 2: Keyboard Shortcut
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Extension popup opens
3. Create your payment link

### Method 3: Smart Detection
1. Select any amount on a webpage (e.g., "5 SOL" or "100 USDC")
2. A quick action button appears
3. Click to create payment link with pre-filled amount

### Method 4: Context Menu
1. Select any number on a webpage
2. Right-click
3. Select "Create NOVIQ Payment Link"
4. Extension opens with pre-filled amount

## Quick Amounts

The extension includes quick amount buttons for common values:
- 0.1 SOL
- 0.5 SOL
- 1 SOL
- 5 SOL

Click any button to instantly fill the amount field.

## Settings

- **Wallet Address**: Saved automatically after first use
- **Default Token**: SOL (can be changed per payment)
- **Dashboard**: Quick access to your NOVIQ dashboard

## Keyboard Shortcuts

- `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac) - Open quick payment

## Permissions

The extension requires these permissions:
- **activeTab** - To detect amounts on current page
- **storage** - To save your wallet address
- **clipboardWrite** - To copy payment links

## Privacy

- Your wallet address is stored locally in Chrome
- No data is sent to external servers except NOVIQ
- Payment data is stored in your browser's local storage

## Support

- **Website**: https://noviq.fun
- **Dashboard**: https://noviq.fun/dashboard
- **Issues**: Open an issue on GitHub

## Development

### Build from Source

```bash
# Clone repository
git clone https://github.com/yourusername/noviq.git
cd noviq/chrome-extension

# No build step needed - pure JavaScript!
```

### File Structure

```
chrome-extension/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
├── background.js      # Background service worker
├── content.js         # Content script for page detection
├── icons/             # Extension icons
└── README.md          # This file
```

## Roadmap

- [ ] Firefox extension
- [ ] Safari extension
- [ ] Split payment support
- [ ] Escrow payment support
- [ ] Payment templates
- [ ] QR code preview
- [ ] Payment history in extension
- [ ] Dark/light theme toggle

## License

MIT License - See LICENSE file for details

## Credits

Built with ❤️ for the Solana community

---

**Made by NOVIQ** - Fast, secure Solana payments
