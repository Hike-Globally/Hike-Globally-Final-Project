# Hike Globally — Final Project

This is a Hike Globally Final Project, which will be deployed ultimately.

## Tech Stack

| Concern | Choice |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, TypeScript) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Icons | [lucide-react](https://lucide.dev) |
| Animation | [GSAP](https://gsap.com) + [`@gsap/react`](https://gsap.com/resources/React), [Motion](https://motion.dev) |
| Smooth scroll | [Lenis](https://github.com/darkroomengineering/lenis) |
| Theming | [next-themes](https://github.com/pacocoursey/next-themes) (class-based dark mode) |
| Fonts | [Geist](https://vercel.com/font) — self-hosted via the `geist` package |

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Project Structure

```
src/
├── app/              # App Router: layout, pages, global styles
│   ├── globals.css   # Tailwind v4 theme tokens + base styles
│   ├── layout.tsx    # Root layout (fonts, metadata, ThemeProvider)
│   └── page.tsx      # Home page
└── components/
    └── theme-provider.tsx   # next-themes wrapper (dark/light mode)
```

## Scripts

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run start   # Serve the production build
npm run lint    # Run ESLint
```

## Notes

- **Fonts are self-hosted.** The app does not fetch from Google Fonts at build time, so
  builds work offline and in restricted network environments.
- **Dark mode** uses `attribute="class"`, so Tailwind's `dark:` variants respond to the
  `.dark` class on `<html>` rather than only `prefers-color-scheme`.
