# ⚡ Super Quick Setup - Chrome Extension

## 🎯 Goal: Get extension working in 3 minutes

### Step 1: Create Icons (1 minute)

**Easiest way:**

1. Open this file in your browser:
   ```
   chrome-extension/create-icons.html
   ```

2. Click "Download All" button

3. Save the 3 files to `chrome-extension/icons/` folder:
   - icon16.png
   - icon48.png
   - icon128.png

**Alternative - Use any images:**
- Just grab ANY 3 PNG images
- Rename them to icon16.png, icon48.png, icon128.png
- Put in chrome-extension/icons/ folder
- Extension will work fine!

### Step 2: Load in Chrome (1 minute)

1. Open Chrome
2. Type in address bar: `chrome://extensions/`
3. Turn ON "Developer mode" (top-right toggle)
4. Click "Load unpacked" button
5. Select your `chrome-extension` folder
6. Done!

### Step 3: Test It (30 seconds)

1. Click the extension icon in toolbar
2. Enter your wallet address
3. Enter amount: 0.1
4. Click "Create Payment Link"
5. Link copied! ✅

## 🎉 That's It!

Your extension is working!

### Quick Tips:

**Pin it:**
- Click puzzle icon 🧩 in toolbar
- Pin NOVIQ extension

**Keyboard shortcut:**
- Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
- Extension opens instantly!

**Smart detection:**
- Select "5 SOL" on any webpage
- Button appears to create payment

## 🐛 Troubleshooting

**Can't load extension?**
```bash
# Make sure you're in the right folder
cd chrome-extension
ls
# Should see: manifest.json, popup.html, etc.
```

**No icons?**
- Extension still works!
- Just create 3 PNG files (any images)
- Name them icon16.png, icon48.png, icon128.png
- Put in icons/ folder
- Reload extension

**Extension not appearing?**
- Make sure Developer Mode is ON
- Try refreshing chrome://extensions/
- Check for error messages

## 📁 File Structure

Your chrome-extension folder should have:
```
chrome-extension/
├── manifest.json       ✅
├── popup.html         ✅
├── popup.js           ✅
├── background.js      ✅
├── content.js         ✅
├── icons/
│   ├── icon16.png     ← Create these
│   ├── icon48.png     ← Create these
│   └── icon128.png    ← Create these
└── create-icons.html  ✅ (helper tool)
```

## 🚀 Next Steps

Once working:
1. Use it daily
2. Share with team
3. Get feedback
4. Publish to Chrome Web Store (optional)

---

**Need more help?** See `CHROME_EXTENSION_SETUP.md` for detailed guide.

**Ready to go!** 🎉
