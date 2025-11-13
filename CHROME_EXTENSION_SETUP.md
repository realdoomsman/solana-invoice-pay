# ⚡ Chrome Extension Setup - 5 Minutes

## Step 1: Create the Icons (2 minutes)

You need 3 icon files. Here are the easiest ways:

### Option A: Use Online Tool (Recommended)
1. Go to https://favicon.io/favicon-converter/
2. Upload any logo image (or use a simple emoji like ⚡)
3. Click "Download"
4. Extract the ZIP
5. Rename these files:
   - `favicon-16x16.png` → `icon16.png`
   - `favicon-32x32.png` → `icon48.png` (yes, use 32x32)
   - `android-chrome-192x192.png` → `icon128.png`
6. Copy all 3 to `chrome-extension/icons/` folder

### Option B: Use Emoji (Super Quick!)
1. Go to https://emojipedia.org/
2. Search for "lightning bolt" ⚡
3. Right-click the big emoji → Save image
4. Go to https://www.iloveimg.com/resize-image
5. Upload the emoji image
6. Resize to 128x128, download
7. Resize to 48x48, download
8. Resize to 16x16, download
9. Name them `icon128.png`, `icon48.png`, `icon16.png`
10. Put in `chrome-extension/icons/` folder

### Option C: I'll Create Simple Ones for You
Run this command:

```bash
# Create icons folder
mkdir -p chrome-extension/icons

# I'll create simple colored squares as placeholders
# (You can replace these later with proper icons)
```

## Step 2: Load Extension in Chrome (2 minutes)

1. **Open Chrome Extensions Page**
   - Type in address bar: `chrome://extensions/`
   - Or: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Look for toggle in top-right corner
   - Click to turn ON (it will turn blue)

3. **Load the Extension**
   - Click "Load unpacked" button (top-left)
   - Navigate to your project folder
   - Select the `chrome-extension` folder
   - Click "Select Folder"

4. **Done!**
   - You should see "NOVIQ - Quick Payment Links" appear
   - The extension icon appears in your toolbar

## Step 3: Pin the Extension (30 seconds)

1. Click the puzzle piece icon 🧩 in Chrome toolbar
2. Find "NOVIQ - Quick Payment Links"
3. Click the pin icon 📌 next to it
4. Now it's always visible!

## Step 4: Test It! (1 minute)

1. **Click the extension icon** in toolbar
2. **Enter your wallet address** (it will be saved)
3. **Enter amount**: Try 0.1
4. **Click "Create Payment Link"**
5. **Success!** Link is copied to clipboard
6. **Paste** (Ctrl+V) to see your payment link

## Troubleshooting

### "Cannot load extension" error
- Make sure you selected the `chrome-extension` folder, not the parent folder
- Check that `manifest.json` is in the folder

### Icons not showing
- That's OK! Extension still works
- Just create 3 PNG files (any images) named:
  - `icon16.png`
  - `icon48.png`
  - `icon128.png`
- Put them in `chrome-extension/icons/`
- Click reload icon on extension

### Extension doesn't appear
- Make sure Developer Mode is ON
- Try reloading the page
- Check for error messages in red

## Quick Commands

### Keyboard Shortcut
Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open extension instantly!

### Smart Detection
1. Go to any webpage
2. Select text with a number (like "5 SOL")
3. A button appears to create payment with that amount!

## What's Next?

### Customize It
- Replace icons with your logo
- Change colors in `popup.html`
- Add more quick amount buttons

### Publish It
When ready to share:
1. Create better icons
2. Take screenshots
3. Go to Chrome Web Store Developer Dashboard
4. Pay $5 one-time fee
5. Upload and publish!

## Need Help?

**Extension won't load?**
```bash
# Check files exist
ls chrome-extension/
# Should see: manifest.json, popup.html, popup.js, etc.
```

**Want to see errors?**
1. Go to `chrome://extensions/`
2. Find NOVIQ extension
3. Click "Errors" button if it appears
4. Or click "background page" to see console

**Still stuck?**
- Check `CHROME_EXTENSION_GUIDE.md` for detailed info
- Make sure all files are in `chrome-extension/` folder
- Try creating simple placeholder icons first

---

## 🎉 That's It!

You now have a working Chrome extension that creates payment links instantly!

**Try it:**
1. Click the icon
2. Enter amount
3. Create link
4. Done! ⚡

**Share it:**
- Send to your team
- Use it yourself daily
- Publish to Chrome Web Store later

Enjoy! 🚀
