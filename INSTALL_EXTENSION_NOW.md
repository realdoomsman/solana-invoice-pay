# ⚡ Install Extension RIGHT NOW - 2 Minutes

## Copy-Paste These Commands:

### 1. Create Placeholder Icons (30 seconds)

```bash
# Create icons folder
mkdir -p chrome-extension/icons

# Open the icon generator in your browser
open chrome-extension/create-icons.html
# (On Linux: xdg-open chrome-extension/create-icons.html)
# (On Windows: start chrome-extension/create-icons.html)
```

Then:
1. Click "Download All" in the browser
2. Save the 3 files to `chrome-extension/icons/` folder

### 2. Load in Chrome (1 minute)

1. **Open Chrome**
2. **Type this in address bar:**
   ```
   chrome://extensions/
   ```
3. **Turn ON "Developer mode"** (toggle in top-right)
4. **Click "Load unpacked"** button
5. **Select the `chrome-extension` folder** from your project
6. **Done!** ✅

### 3. Test It (30 seconds)

1. Click the NOVIQ icon in Chrome toolbar
2. Enter your wallet address
3. Enter amount: `0.1`
4. Click "Create Payment Link"
5. Link copied! ✅

---

## 🎉 That's It!

Your extension is working!

---

## Quick Reference

### Open Extension
- **Click icon** in toolbar
- **Or press:** `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)

### Pin Extension
1. Click puzzle icon 🧩 in toolbar
2. Pin NOVIQ

### Reload Extension (after changes)
1. Go to `chrome://extensions/`
2. Click reload icon ↻ on NOVIQ card

---

## Troubleshooting One-Liners

**Can't find extension folder?**
```bash
pwd  # Make sure you're in project root
ls chrome-extension/  # Should show manifest.json
```

**Extension won't load?**
- Make sure Developer Mode is ON
- Select the `chrome-extension` folder (not parent)
- Check for error messages

**No icons?**
- Extension still works!
- Icons are optional for testing
- Just create 3 PNG files later

---

## What You Get

✅ Create payment links from anywhere  
✅ Auto-copy to clipboard  
✅ Keyboard shortcut  
✅ Smart amount detection  
✅ Saves your wallet address  

---

**Start using it now!** ⚡

Click the icon → Create payment → Done!
