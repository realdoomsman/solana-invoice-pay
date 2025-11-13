# 📱 Chrome Extension - Visual Setup Guide

## 🎯 3 Simple Steps

---

## Step 1️⃣: Create Icons

### Option A: Use the Icon Generator (Recommended)

1. **Open the icon generator:**
   ```bash
   # In your browser, open this file:
   chrome-extension/create-icons.html
   ```

2. **Download icons:**
   - Click "Download All" button
   - Save each file to `chrome-extension/icons/` folder
   - Files: icon16.png, icon48.png, icon128.png

### Option B: Quick Placeholder Icons

Just create 3 simple PNG files (any images work for testing):

```bash
# Create icons folder
mkdir -p chrome-extension/icons

# Option 1: Use any PNG images you have
# Just rename them to:
# - icon16.png
# - icon48.png  
# - icon128.png

# Option 2: Download from internet
# Search "lightning bolt icon png"
# Download and resize to 16x16, 48x48, 128x128
```

---

## Step 2️⃣: Load Extension in Chrome

### A. Open Extensions Page

**Method 1:** Type in address bar
```
chrome://extensions/
```

**Method 2:** Use menu
```
Chrome Menu (⋮) → Extensions → Manage Extensions
```

### B. Enable Developer Mode

Look at the **top-right corner** of the page:
- You'll see a toggle switch labeled "Developer mode"
- Click it to turn it **ON** (it will turn blue)

### C. Load Your Extension

1. Click the **"Load unpacked"** button (top-left area)
2. A file browser opens
3. Navigate to your project folder
4. Select the **`chrome-extension`** folder
5. Click **"Select Folder"** or **"Open"**

### D. Verify It Loaded

You should see:
- ✅ "NOVIQ - Quick Payment Links" card appears
- ✅ Extension icon in toolbar (or in puzzle menu 🧩)
- ✅ No error messages

---

## Step 3️⃣: Pin & Test

### A. Pin the Extension

1. Click the **puzzle piece icon** 🧩 in Chrome toolbar (top-right)
2. Find "NOVIQ - Quick Payment Links"
3. Click the **pin icon** 📌 next to it
4. Now it's always visible in your toolbar!

### B. Test It!

1. **Click the NOVIQ icon** in toolbar
2. **Enter your wallet address** (saved for future use)
3. **Enter amount:** Try 0.1
4. **Add description:** "Test payment"
5. **Click "Create Payment Link"**
6. **Success!** ✅ Link is copied to clipboard
7. **Paste** (Ctrl+V or Cmd+V) to see your link

---

## 🎉 You're Done!

Your extension is now installed and working!

---

## 🚀 How to Use

### Method 1: Click Icon
- Click NOVIQ icon in toolbar
- Fill in amount and description
- Create link instantly

### Method 2: Keyboard Shortcut
- Press `Ctrl+Shift+P` (Windows/Linux)
- Press `Cmd+Shift+P` (Mac)
- Extension opens instantly!

### Method 3: Smart Detection
- Go to any webpage
- Select text with amount (e.g., "5 SOL")
- Quick button appears
- Click to create payment with that amount

---

## 🔧 Troubleshooting

### ❌ "Cannot load extension"

**Problem:** Wrong folder selected

**Solution:**
- Make sure you selected the `chrome-extension` folder
- NOT the parent folder
- The folder should contain `manifest.json`

**Check:**
```bash
cd chrome-extension
ls manifest.json
# Should show: manifest.json
```

---

### ❌ Icons not showing

**Problem:** Icon files missing

**Solution:**
- Extension still works! Icons are optional for testing
- Create 3 PNG files (any images)
- Name them: icon16.png, icon48.png, icon128.png
- Put in `chrome-extension/icons/` folder
- Click reload icon ↻ on extension card

---

### ❌ Extension not appearing

**Problem:** Developer mode not enabled

**Solution:**
- Go to `chrome://extensions/`
- Make sure "Developer mode" toggle is ON (blue)
- Try clicking "Load unpacked" again

---

### ❌ Errors showing

**Problem:** Missing files or syntax error

**Solution:**
- Check all files exist in chrome-extension folder:
  - manifest.json ✓
  - popup.html ✓
  - popup.js ✓
  - background.js ✓
  - content.js ✓
- Click "Errors" button to see details
- Check console for error messages

---

## 📋 Checklist

Before loading extension:
- [ ] All files in `chrome-extension/` folder
- [ ] Icons created (or placeholder images)
- [ ] Chrome browser open
- [ ] Developer mode enabled

After loading:
- [ ] Extension appears in list
- [ ] No error messages
- [ ] Icon visible in toolbar (or puzzle menu)
- [ ] Can click and open popup

Testing:
- [ ] Enter wallet address
- [ ] Create test payment
- [ ] Link copied successfully
- [ ] Can paste link
- [ ] Link opens payment page

---

## 🎨 Customize Later

Once working, you can:
- Replace icons with your logo
- Change colors in popup.html
- Add more features
- Publish to Chrome Web Store

---

## 📞 Need Help?

**Quick fixes:**
```bash
# Verify files exist
ls chrome-extension/

# Should see:
# manifest.json
# popup.html
# popup.js
# background.js
# content.js
# icons/ (folder)
```

**Still stuck?**
- Check `QUICK_SETUP.md` for fastest setup
- Check `CHROME_EXTENSION_SETUP.md` for detailed guide
- Make sure you're using Chrome (not Firefox/Safari)
- Try restarting Chrome

---

## ✨ Success!

Once you see the extension working:
- ✅ Create your first payment link
- ✅ Try the keyboard shortcut
- ✅ Test smart detection on a webpage
- ✅ Share with your team!

**Enjoy your new superpower!** ⚡

---

## 🔄 Update Extension

Made changes to the code?

1. Go to `chrome://extensions/`
2. Find NOVIQ extension
3. Click the **reload icon** ↻
4. Changes applied!

---

## 🌐 Publish to Chrome Web Store (Optional)

When ready to share publicly:

1. Create better icons (professional design)
2. Take 5 screenshots of extension
3. Write detailed description
4. Go to Chrome Web Store Developer Dashboard
5. Pay $5 one-time fee
6. Upload ZIP of extension
7. Submit for review (2-3 days)
8. Published! 🎉

---

**That's it! You're all set!** 🚀
