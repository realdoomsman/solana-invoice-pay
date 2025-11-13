# 🚀 NOVIQ Chrome Extension

Create Solana payment links instantly from anywhere on the web!

## ⚡ Quick Install

### 3 Steps:

1. **Create icons** → Open `chrome-extension/create-icons.html` in browser, download 3 files
2. **Load extension** → Go to `chrome://extensions/`, enable Developer mode, click "Load unpacked"
3. **Test it** → Click icon, create payment link!

**Detailed guides:**
- 📖 `INSTALL_EXTENSION_NOW.md` - Fastest way (2 min)
- 📖 `QUICK_SETUP.md` - Simple guide (3 min)
- 📖 `CHROME_EXTENSION_SETUP.md` - Detailed guide (5 min)
- 📖 `EXTENSION_INSTALL_STEPS.md` - Visual step-by-step

## ✨ Features

- ⚡ **Instant Creation** - Create payment links in 2 clicks
- 📋 **Auto-Copy** - Links automatically copied to clipboard
- ⌨️ **Keyboard Shortcut** - Press `Ctrl+Shift+P` to open
- 🎯 **Smart Detection** - Detects amounts on webpages
- 💾 **Remembers Wallet** - Saves your address
- 🎨 **Beautiful UI** - Modern dark theme
- 🚀 **Quick Amounts** - Buttons for 0.1, 0.5, 1, 5 SOL

## 🎯 How to Use

### Method 1: Click Icon
```
1. Click NOVIQ icon in toolbar
2. Enter amount and description
3. Click "Create Payment Link"
4. Link copied! ✅
```

### Method 2: Keyboard Shortcut
```
1. Press Ctrl+Shift+P (or Cmd+Shift+P on Mac)
2. Extension opens
3. Create payment
```

### Method 3: Smart Detection
```
1. Select "5 SOL" on any webpage
2. Quick button appears
3. Click to create payment with that amount
```

## 📁 Files

```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension UI
├── popup.js              # UI logic
├── background.js         # Background worker
├── content.js            # Page detection
├── create-icons.html     # Icon generator tool
└── icons/                # Extension icons
    ├── icon16.png       # 16x16 icon
    ├── icon48.png       # 48x48 icon
    └── icon128.png      # 128x128 icon
```

## 🔧 Development

### Load Extension
```bash
# 1. Open Chrome
# 2. Go to chrome://extensions/
# 3. Enable Developer mode
# 4. Click "Load unpacked"
# 5. Select chrome-extension folder
```

### Update Extension
```bash
# After making changes:
# 1. Go to chrome://extensions/
# 2. Click reload icon on NOVIQ card
```

### Debug Extension
```bash
# View console:
# 1. Go to chrome://extensions/
# 2. Click "background page" or "Errors"
# 3. See console logs
```

## 🎨 Customize

### Change Colors
Edit `popup.html` - look for gradient colors:
```css
background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
```

### Add Quick Amounts
Edit `popup.html` - add more buttons:
```html
<div class="quick-amount" data-amount="10">10 SOL</div>
```

### Change Keyboard Shortcut
Edit `manifest.json` - add commands section:
```json
"commands": {
  "_execute_action": {
    "suggested_key": {
      "default": "Ctrl+Shift+P"
    }
  }
}
```

## 🌐 Publish to Chrome Web Store

When ready:

1. **Prepare assets:**
   - Professional icons (128x128, 48x48, 16x16)
   - 5 screenshots (1280x800 or 640x400)
   - Promotional images
   - Detailed description

2. **Create ZIP:**
   ```bash
   cd chrome-extension
   zip -r noviq-extension.zip . -x "*.DS_Store" -x "README.md" -x "create-icons.html"
   ```

3. **Submit:**
   - Go to Chrome Web Store Developer Dashboard
   - Pay $5 one-time fee
   - Upload ZIP
   - Fill in details
   - Submit for review (2-3 days)

## 📊 Analytics (Optional)

Track usage:
```javascript
// In background.js
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'paymentCreated') {
    // Track event
    console.log('Payment created:', request.data)
  }
})
```

## 🔒 Privacy

- Wallet address stored locally in Chrome
- No data sent to external servers (except NOVIQ)
- Payment data in browser's local storage
- No tracking or analytics by default

## 🐛 Troubleshooting

### Extension won't load
- Check Developer mode is ON
- Verify manifest.json exists
- Look for error messages

### Icons not showing
- Extension still works without icons
- Create 3 PNG files (any images)
- Put in icons/ folder
- Reload extension

### Can't create payments
- Check wallet address is valid
- Verify amount is a number
- Check browser console for errors

## 📞 Support

- **Installation:** See `INSTALL_EXTENSION_NOW.md`
- **Detailed guide:** See `CHROME_EXTENSION_SETUP.md`
- **Issues:** Check browser console
- **Questions:** Open an issue on GitHub

## 🎉 Success Stories

Once installed, you can:
- ✅ Create payment links in seconds
- ✅ Work from any webpage
- ✅ Use keyboard shortcuts
- ✅ Share with team
- ✅ Boost productivity 10x

## 🚀 Roadmap

- [ ] Firefox extension
- [ ] Safari extension
- [ ] Split payment support
- [ ] Escrow payment support
- [ ] Payment templates
- [ ] QR code preview
- [ ] Payment history
- [ ] Dark/light theme toggle
- [ ] Multi-language support

## 📄 License

MIT License - See LICENSE file

## 🙏 Credits

Built with ❤️ for the Solana community

---

**Ready to install?** See `INSTALL_EXTENSION_NOW.md`

**Need help?** See `CHROME_EXTENSION_SETUP.md`

**Let's go!** ⚡
