# 🎨 NOVIQ Branding

## Files

### Logo
- `public/logo.svg` - Main logo
- `components/Logo.tsx` - React component

### Banner
- `public/banner-final.svg` - 2500x500px banner

## Colors

```css
/* Gradient */
--gradient: linear-gradient(135deg, #00d4ff 0%, #9945ff 100%);

/* Cyan to Purple */
--cyan: #00d4ff;
--purple: #9945ff;

/* Background */
--bg-dark: #000000;
--bg-subtle: #0a0a1a;
```

## Usage

```tsx
import Logo, { LogoIcon } from '@/components/Logo'

// Full logo with text
<Logo />

// Icon only
<LogoIcon className="h-8 w-8" />
```

## Style

- Minimal + Futuristic Tech
- Clean dark backgrounds
- Cyan-to-purple gradients
- Subtle tech accents
