# 👾 Canvas Canvas

> **A Premium Neo-Brutalist Pixel Art & SVG Editor**

Welcome to **Canvas Canvas**, an interactive web-based pixel art editor and animation suite built with a striking Neo-Brutalist design language. Create retro graphics, choreograph frame-by-frame sprite sheet loops, and export your creations directly to clean SVG code, single-element CSS box-shadow configurations, or crisp high-resolution PNGs.

Ideal for frontend developers, game artists, and retro enthusiasts, and perfectly designed to run fully client-side (no build steps, zero dependencies) for direct hosting on **GitHub Pages**.

---

## ✨ Features

- **🎮 Neo-Brutalist Aesthetic**: Saturated neon accents, sharp high-contrast grid layouts, thick outlines, and heavy-offset drop shadows.
- **🖌️ Creative Tool suite**:
  - **Draw (D / 1)**: Traditional pixel pencil.
  - **Flood Fill (F / 2)**: Quick flood fill color bucket.
  - **Eraser (E / 3)**: Erase pixels back to empty.
  - **Eyedropper (P / 4)**: Sample canvas colors directly.
- **⏱️ Frame-by-Frame Timeline**: Add, duplicate, and delete sprite frames. Includes a live animation preview panel with adjustable FPS (1-20).
- **🎨 Neo-Brutalist Palette Presets**: Curated high-impact swatches + a customizable HTML color input selector.
- **⌨️ Pro Keyboard Shortcuts**: Navigate your canvas tools, trigger undo/redo, toggle grid lines, and play/pause previews instantly with fast keyboard bindings.
- **🚀 Advanced Code & File Exports**:
  - **Download PNG**: Scaled up to `512x512` pixels to ensure a sharp, crisp, pixelated image output.
  - **Get SVG Code**: Full inline `<svg>` code using optimized `<rect>` nodes.
  - **Get CSS Code**: A single `<div class="pixel-art">` styling block using chained CSS `box-shadow` properties to draw your artwork.

---

## ⚡ Keyboard Shortcuts

Maximize your productivity with native editor shortcuts:

| Action | Shortcut Key |
| :--- | :--- |
| **Draw Tool** | `D` or `1` |
| **Bucket (Fill) Tool** | `F` or `2` |
| **Eraser Tool** | `E` or `3` |
| **Picker (Eyedropper) Tool** | `P` or `4` |
| **Toggle Grid Lines** | `G` |
| **Play/Pause Animation Loop** | `Spacebar` |
| **Undo Stroke** | `Ctrl + Z` |
| **Redo Stroke** | `Ctrl + Y` |

---

## 📁 Project Structure

```bash
canvas-canvas/
├── index.html     # Semantic structure and export modals
├── style.css      # Core Neo-Brutalist styling & custom variables
├── app.js         # Canvas events, frame history & export algorithms
└── README.md      # Setup, guides, and documentation
```

---

## 💻 Running Locally

Since this app uses pure vanilla web standard features, it doesn't require any bundlers or node installs to run!

### Method 1: Double Click
You can simply open `index.html` directly in any modern browser by double-clicking the file in your explorer.

### Method 2: Local HTTP Server (Recommended)
To prevent CORS blockages on advanced features or to test fully:
1. Open terminal inside the workspace.
2. Run one of these commands:
   * **Node.js**: `npx serve`
   * **Python**: `python -m http.server 8000`
3. Visit the local address displayed in your console (e.g. `http://localhost:3000` or `http://localhost:8000`).

---

## 🚀 How to Host on GitHub Pages (Free)

Hosting **Canvas Canvas** to GitHub is incredibly fast because it is a static website:

1. **Create a GitHub Repository**:
   - Go to [GitHub](https://github.com) and click **New Repository**.
   - Name it `canvas-canvas`.
   - Leave it public and do not initialize with a README.

2. **Push the Code**:
   - Open your terminal in the `canvas-canvas` directory.
   - Run the following git commands:
     ```bash
     git init
     git add .
     git commit -m "Initial commit: Canvas Canvas pixel art editor"
     git branch -M main
     git remote add origin https://github.com/<your-username>/canvas-canvas.git
     git push -u origin main
     ```

3. **Enable GitHub Pages**:
   - In your GitHub Repository, click the **Settings** tab.
   - On the left sidebar, click **Pages**.
   - Under **Build and deployment**, set Source to **Deploy from a branch**.
   - Under **Branch**, select `main` and click **Save**.
   - Wait 1-2 minutes, and GitHub will provide a live hosting link: `https://<your-username>.github.io/canvas-canvas/`

---

*Made with 👾 and CSS by Antigravity.*
