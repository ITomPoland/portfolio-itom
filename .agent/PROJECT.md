# 🎨 Portfolio ITOM - Project Documentation

> **For AI Agents**: Read this file first to understand the project before making changes.

## 📋 Project Overview

This is an **immersive 3D portfolio website** built with React Three Fiber. The user navigates through an infinite corridor with doors leading to different "rooms" (sections). The entire visual style is **hand-drawn black/white sketch aesthetic**.

### Key Experience Flow
1. **Entrance** → User enters through an animated door
2. **Infinity Corridor** → Endless corridor with doors on both sides
3. **Rooms** → Each door leads to a unique interactive section:
   - 🖼️ **Gallery** - Projects hanging on clothesline
   - 💼 **Studio** - Infinite tower of content monitors
   - 👤 **About** - Flying through clouds/sky
   - 📬 **Contact** - Dock/pier with message in a bottle

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| React Three Fiber | 3D Rendering (Three.js wrapper) |
| @react-three/drei | R3F helpers (Text, useTexture, Html, etc.) |
| GSAP | Animations |
| Vite | Build tool & dev server |
| SCSS | Styling |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── canvas/           # All 3D components
│   │   ├── corridor/     # Corridor, doors, segments
│   │   ├── entrance/     # Entry experience
│   │   ├── rooms/        # Room interiors
│   │   │   ├── About/
│   │   │   ├── Contact/  # ⭐ Message paper feature
│   │   │   ├── Gallery/
│   │   │   └── Studio/
│   │   └── Experience.jsx  # Main 3D scene
│   └── dom/              # 2D UI overlays
├── context/
│   └── SceneContext.jsx  # Global state (room, overlay, etc.)
├── hooks/
│   └── useInfiniteCamera.js  # Scroll-based camera movement
└── styles/
```

---

## 🎨 Visual Style Guide

### Core Aesthetic
- **Hand-drawn / Sketchy** - Everything looks like pencil drawings
- **Black & White** with subtle gray tones
- **Paper textures** - Crumpled, torn edges
- **Fonts**: `CabinSketch-Regular.ttf`, `CabinSketch-Bold.ttf`

### Textures Location
```
public/textures/
├── corridor/      # Wall, floor, signs
├── doors/         # Door frames, handles
├── entrance/      # Entry scene assets
├── gallery/       # Project cards
├── studio/        # Monitor textures
├── contact/       # Paper, button (NEW)
└── paper-texture.webp  # General paper
```

### Colors Palette
- Background: `#f0f0f0` (off-white)
- Lines/Text: `#333333` (dark gray)
- Accents: `#666666`, `#888888`

---

## 🚪 Room System

### How Rooms Work
1. User approaches door in corridor
2. Click on door → Camera zooms in
3. Door opens → Camera enters room
4. Room component mounts and signals ready via `onReady()`
5. On exit → Camera backs out, door closes

### Room Component Pattern
```jsx
const ExampleRoom = ({ showRoom, onReady, isExiting }) => {
    // Signal ready after content loads
    useEffect(() => {
        if (showRoom) {
            // Load assets...
            onReady?.();
        }
    }, [showRoom]);

    return (
        <group>
            {/* Room content */}
        </group>
    );
};
```

---

## 📬 Contact Room - Message Paper Feature

### Current Implementation
- **Paper texture**: `public/textures/contact/paper_form.png`
- **Button texture**: `public/textures/contact/send_button.png`
- **Component**: `src/components/canvas/rooms/Contact/MessagePaper.jsx`

### Features
- 3 input fields: Email, Subject, Message
- Hidden HTML inputs with drei `<Html>` for keyboard capture
- Text rendered with `<Text>` component (CabinSketch font)
- Blinking cursor that follows text
- Word-wrap with long word breaking
- Hand-drawn send button with hover effect

### Key Files
| File | Purpose |
|------|---------|
| `ContactRoom.jsx` | Main room, camera animation |
| `MessagePaper.jsx` | Interactive paper form |
| `TornPaperGeometry.js` | Torn edge geometry generator |

---

## 🎥 Camera System

### Infinite Corridor Camera
- Controlled by `useInfiniteCamera.js`
- Scroll-based movement along corridor
- Mouse-look for subtle head movement
- Disabled when inside a room

### Room Camera
- Each room can control camera independently
- Uses GSAP for smooth animations
- Returns to corridor camera on exit

---

## 🔧 Common Patterns

### Loading Textures
```jsx
import { useTexture } from '@react-three/drei';
const texture = useTexture('/textures/example.webp');
```

### 3D Text
```jsx
import { Text } from '@react-three/drei';
<Text
    font="/fonts/CabinSketch-Regular.ttf"
    fontSize={0.05}
    color="#333333"
>
    Hello
</Text>
```

### Animation
```jsx
import gsap from 'gsap';
gsap.to(ref.current.position, { x: 1, duration: 0.5 });
```

---

## ⚠️ Important Notes

1. **No HTML inside Canvas** - Use `<Html>` from drei for DOM elements
2. **Textures must be WebP/PNG** - For transparency support
3. **Fonts in public/fonts/** - TTF format
4. **All coordinates are in Three.js units** - Not pixels
5. **Y is up** - Standard Three.js coordinate system

---

## 🚀 Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build
```

**Default port**: http://localhost:5173

---

## 📝 TODO / Future Features

- [ ] Connect contact form to email service (EmailJS/Formspree)
- [ ] Message rolls into bottle animation
- [ ] Throw bottle into sea animation
- [ ] Mobile optimization

---

*Last updated: 2026-01-22*
