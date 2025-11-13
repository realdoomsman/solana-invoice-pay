# 🚀 NOVIQ Chrome Extension - Installation Guide

## What You Get

A powerful Chrome extension that lets you create Solana payment links instantly from anywhere on the web!

### Features
- ⚡ Create payment links in 2 clicks
- 📋 Auto-copy to clipboard
- 🎯 Detect amounts on webpages
- ⌨️ Keyboard shortcut: `Ctrl+Shift+P`
- 💾 Remembers your wallet
- 🎨 Beautiful dark UI

## Installation Steps

### 1. Prepare the Extension

The extension files are in the `chrome-extension/` folder. You need to:

```bash
cd chrome-extension
```

### 2. Create Extension Icons

You need to create 3 icon sizes. Use any image editor or online tool:

**Option A: Use an online tool**
1. Go to https://www.favicon-generator.org/
2. Upload your logo (the NOVIQ logo from `public/logo.svg`)
3. Generate icons
4. Download and rename:
   - 16x16 → `icon16.png`
   - 48x48 → `icon48.png`
   - 128x128 → `icon128.png`
5. Place in `chrome-extension/icons/` folder

**Option B: Use ImageMagick (if installed)**
```bash
# Create icons folder
mkdir -p icons

# Convert logo to icons (if you have ImageMagick)
convert ../public/logo.svg -resize 16x16 icons/icon16.png
convert ../public/logo.svg -resize 48x48 icons/icon48.png
convert ../public/logo.svg -resize 128x128 icons/icon128.png
```

### 3. Load Extension in Chrome

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the `chrome-extension` folder
6. Done! 🎉

### 4. Pin the Extension

1. Click the puzzle icon in Chrome toolbar
2. Find "NOVIQ - Quick Payment Links"
3. Click the pin icon to keep it visible

## How to Use

### Quick Start
1. Click the NOVIQ icon in toolbar
2. Enter your wallet address (first time only)
3. Enter amount and description
4. Click "Create Payment Link"
5. Link is copied automatically!

### Keyboard Shortcut
Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the extension instantly.

### Smart Detection
1. Select any amount on a webpage (e.g., "5 SOL")
2. A button appears
3. Click to create payment with that amount

## Testing the Extension

1. Click the extension icon
2. Enter a test wallet address
3. Set amount to 0.1 SOL
4. Add description: "Test payment"
5. Click "Create Payment Link"
6. You should see: "✓ Payment link created and copied!"
7. Paste the link in a new tab to verify

## Troubleshooting

### Extension won't load
- Make sure you're in the correct folder
- Check that `manifest.json` exists
- Verify all files are present

### Icons not showing
- Create the icons folder: `mkdir icons`
- Add placeholder icons (any PNG files)
- Reload the extension

### Can't create payments
- Check your wallet address is valid
- Make sure amount is a number
- Try refreshing the extension

## Publishing to Chrome Web Store

When ready to publish:

1. **Create a ZIP file**
```bash
cd chrome-extension
zip -r noviq-extension.zip . -x "*.DS_Store" -x "README.md"
```

2. **Go to Chrome Web Store Developer Dashboard**
   - Visit: https://chrome.google.com/webstore/devconsole
   - Pay one-time $5 developer fee
   - Upload ZIP file
   - Fill in details
   - Submit for review

3. **Required Information**
   - Name: NOVIQ - Quick Payment Links
   - Description: Create Solana payment links instantly
   - Category: Productivity
   - Screenshots: Take 3-5 screenshots of the extension
   - Privacy policy: Link to your privacy page

## Extension Updates

To update the extension:

1. Make changes to files
2. Increment version in `manifest.json`
3. Go to `chrome://extensions/`
4. Click reload icon on NOVIQ extension
5. Test the changes

## Security Notes

- Extension only stores wallet address locally
- No private keys are ever stored
- All payment data stays in your browser
- Only communicates with noviq.fun

## Next Steps

After installation:
1. ✅ Test creating a payment
2. ✅ Try the keyboard shortcut
3. ✅ Test smart detection on a webpage
4. ✅ Share with your team
5. 🚀 Publish to Chrome Web Store

## Support

Need help?
- Check the extension README
- Visit https://noviq.fun/faq
- Open an issue on GitHub

---

**Enjoy fast payment link creation! ⚡**
