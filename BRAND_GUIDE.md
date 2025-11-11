# NOVIQ Brand Guide

## 🎨 Visual Identity

### Logo
- **Primary Logo**: Full NOVIQ wordmark with gradient
- **Icon**: Stylized N+Q symbol in circle
- **Usage**: Logo appears in header, footer, and favicon

### Color Palette

#### Primary Colors
```
Purple:  #8B5CF6  (rgb(139, 92, 246))
Blue:    #3B82F6  (rgb(59, 130, 246))
Cyan:    #06B6D4  (rgb(6, 182, 212))
```

#### Gradients
```css
/* Primary Gradient */
background: linear-gradient(to right, #8B5CF6, #3B82F6, #06B6D4);

/* Hero Gradient */
background: linear-gradient(to bottom, #0f172a, #000000);
```

#### Neutral Colors
```
Black:       #000000
Slate 900:   #0f172a
Slate 800:   #1e293b
Slate 700:   #334155
Slate 400:   #94a3b8
White:       #ffffff
```

### Typography

#### Font Family
**Inter** - Modern, clean, professional
- Weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold), 800 (Extra-bold), 900 (Black)
- Features: Antialiased, optimized for screens

#### Type Scale
```
Hero:        text-7xl md:text-9xl (72px/144px)
H1:          text-5xl md:text-7xl (48px/72px)
H2:          text-4xl md:text-5xl (36px/48px)
H3:          text-2xl md:text-3xl (24px/30px)
Body:        text-base (16px)
Small:       text-sm (14px)
Tiny:        text-xs (12px)
```

### Design Elements

#### Glass Effect
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

#### Glow Effect
```css
box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
```

#### Animations
- Pulse: Status indicators
- Hover: Scale 1.1 on icons
- Transitions: 200ms ease

## 🎯 Brand Voice

### Tone
- **Professional** but not corporate
- **Innovative** but not gimmicky
- **Confident** but not arrogant
- **Technical** but accessible

### Key Messages
1. "Enterprise-grade payment infrastructure"
2. "Lightning-fast settlements"
3. "Built on Solana"
4. "Non-custodial security"

## 📐 Layout Principles

### Spacing
- Consistent padding: 4, 6, 8, 12, 16, 20, 24, 32
- Section gaps: 20, 32
- Component gaps: 4, 6, 8

### Borders
- Radius: rounded-lg (8px), rounded-xl (12px), rounded-2xl (16px)
- Width: 1px for dividers, 2-4px for emphasis

### Shadows
- Subtle: shadow (default)
- Medium: shadow-lg
- Strong: shadow-2xl

## 🖼️ Components

### Header
- Fixed top navigation
- Logo + Navigation links
- Glass effect background
- Height: 64px (py-4)

### Cards
- Dark background (slate-900/50)
- Border: slate-800
- Hover: Border color changes to brand color
- Padding: p-6 or p-8

### Buttons
- Primary: Gradient (blue → purple)
- Secondary: Outline
- Sizes: sm, md, lg
- Rounded: rounded-lg

### Status Indicators
- Green dot + "Live" text
- Pulse animation
- Inline with text

## 🚀 Usage Examples

### Hero Section
```tsx
<h1 className="text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
  NOVIQ
</h1>
```

### Feature Card
```tsx
<div className="glass rounded-2xl p-8 hover:border-blue-500/50 transition-all">
  {/* Content */}
</div>
```

### CTA Button
```tsx
<button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all">
  Get Started
</button>
```

---

**Built with care for NOVIQ** 🎨
