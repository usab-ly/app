# Usably Browser

A modern desktop web browser built with **Electron** + **Next.js** + **TypeScript** + **Tailwind CSS**.

## 🎯 Features

- **Electron 30+** with TypeScript
- **Next.js 14** with App Router
- **Secure IPC** communication with `contextIsolation` and `preload`
- **BrowserView** for rendering web content
- **Sidebar navigation** with quick links (Google, YouTube, GitHub)
- **Tailwind CSS** for modern UI styling
- **Active link highlighting**

## 📁 Project Structure

```
usably/
├── app/                      # Next.js app (App Router)
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles with Tailwind
├── components/              # React components
│   └── Sidebar.tsx          # Navigation sidebar
├── electron/                # Electron main process
│   ├── main.ts              # Main process (BrowserWindow, BrowserView, IPC)
│   ├── preload.ts           # Preload script (IPC bridge)
│   └── tsconfig.json        # TypeScript config for Electron
├── dist/                    # Compiled Electron files (git-ignored)
├── types/                   # TypeScript definitions
│   └── electron.d.ts        # Window.api types
├── .next/                   # Next.js build output (git-ignored)
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript config for Next.js
├── tailwind.config.ts       # Tailwind CSS config
├── postcss.config.js        # PostCSS config
└── next.config.js           # Next.js config
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **pnpm**

Install pnpm if you don't have it:

```bash
npm install -g pnpm
```

### Installation

1. **Clone or navigate to the project directory**

```bash
cd usably
```

2. **Install dependencies**

```bash
pnpm install
```

### Development Mode

Run both Next.js dev server and Electron simultaneously:

```bash
pnpm dev
```

This will:

- Start Next.js dev server on `http://localhost:3000`
- Wait for Next.js to be ready
- Launch Electron window

### Production Build

Build the entire application:

```bash
pnpm build
```

This compiles both Next.js and Electron TypeScript code.

### Run Production Build

```bash
pnpm start
```

### Package the App

Create a distributable app:

```bash
pnpm package
```

Output will be in the `release/` directory.

## 🛠️ How It Works

### Architecture

1. **Electron Main Process** (`electron/main.ts`)
   - Creates a `BrowserWindow` that loads the Next.js app
   - Creates a `BrowserView` for rendering external websites
   - Positions BrowserView to the right of the 240px sidebar
   - Handles IPC messages to change the URL in BrowserView

2. **Preload Script** (`electron/preload.ts`)
   - Exposes a secure `window.api` object to Next.js
   - `window.api.setUrl(url)` - Navigate BrowserView to a URL
   - `window.api.getUrl()` - Get current URL from BrowserView

3. **Next.js UI** (`app/`, `components/`)
   - Sidebar with navigation buttons
   - Calls `window.api.setUrl()` when a link is clicked
   - Active link is highlighted
   - BrowserView renders on the right side (managed by Electron)

### IPC Communication Flow

```
User clicks "YouTube" in sidebar
    ↓
Sidebar.tsx calls window.api.setUrl('https://youtube.com')
    ↓
Preload.ts forwards to Main process via ipcRenderer.invoke('set-url')
    ↓
Main.ts receives IPC call, validates URL, and loads it in BrowserView
    ↓
BrowserView displays YouTube
```

### Security Features

- ✅ `contextIsolation: true` - Renderer and preload run in separate contexts
- ✅ `nodeIntegration: false` - No Node.js APIs exposed to renderer
- ✅ `webviewTag: false` - Using BrowserView instead for better security
- ✅ Preload script exposes only specific, safe APIs
- ✅ URL validation before loading

## 📝 Scripts

| Command               | Description                                  |
| --------------------- | -------------------------------------------- |
| `pnpm dev`            | Run Next.js and Electron in dev mode         |
| `pnpm dev:web`        | Run only Next.js dev server                  |
| `pnpm dev:electron`   | Run only Electron (requires Next.js running) |
| `pnpm build`          | Build both Next.js and Electron              |
| `pnpm build:web`      | Build only Next.js                           |
| `pnpm build:electron` | Compile Electron TypeScript                  |
| `pnpm start`          | Run production build                         |
| `pnpm package`        | Create distributable app                     |

## 🎨 Customization

### Add More Sidebar Links

Edit `components/Sidebar.tsx`:

```typescript
const sites: SiteLink[] = [
  { name: 'Google', url: 'https://www.google.com', icon: '🔍' },
  { name: 'YouTube', url: 'https://www.youtube.com', icon: '▶️' },
  { name: 'GitHub', url: 'https://github.com', icon: '💻' },
  { name: 'Twitter', url: 'https://twitter.com', icon: '🐦' }, // Add this
];
```

### Change Sidebar Width

Update `electron/main.ts` and Tailwind classes:

1. In `main.ts`, change `SIDEBAR_WIDTH`:

```typescript
const SIDEBAR_WIDTH = 300; // Change from 240
```

2. In `components/Sidebar.tsx`, update the width class:

```typescript
<aside className="w-[300px] h-screen ..."> // Change from w-[240px]
```

### Styling

Modify `app/globals.css` and Tailwind classes in components.

## 🔒 Notes on BrowserView vs WebView

This project uses **BrowserView** instead of the `<webview>` tag because:

- **Better security**: BrowserView runs in a separate process
- **Better performance**: No additional overhead from webview tag
- **Modern approach**: Recommended by Electron team
- **More control**: Programmatic positioning and bounds management

## 📦 Dependencies

### Production

- `next` - React framework
- `react` & `react-dom` - UI library

### Development

- `electron` - Desktop app framework
- `typescript` - Type safety
- `tailwindcss` - Utility-first CSS
- `concurrently` - Run multiple scripts
- `wait-on` - Wait for Next.js server
- `ts-node` - Run TypeScript directly
- `electron-builder` - Package the app

## 🐛 Troubleshooting

### Electron window is blank

- Ensure Next.js dev server is running on port 3000
- Check browser console for errors
- Try `pnpm dev:web` first, then `pnpm dev:electron`

### "window.api is not defined"

- Make sure preload script is loading correctly
- Check `webPreferences.preload` path in `main.ts`
- Rebuild: `pnpm build:electron`

### BrowserView not showing

- Ensure bounds are set correctly in `updateBrowserViewBounds()`
- Check that BrowserView is attached: `mainWindow.setBrowserView(browserView)`

## 📄 License

MIT

## 🤝 Contributing

Feel free to open issues or submit PRs!

---

Built with ❤️ using Electron + Next.js
