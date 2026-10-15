# 🎬 EntropyTube - YouTube Fork

A modern, high-performance video sharing and streaming platform built with Next.js (App Router), Tailwind CSS, Prisma ORM, and HLS adaptive bitrate streaming, optimized for **Vercel** deployment.

---

## ✨ Features

- **📺 Adaptive Bitrate Streaming**: Built-in HLS video player with quality selector (1080p, 720p, 480p, 360p, Auto), theater mode, and scrubber previews.
- **📱 Responsive YouTube UI**: YouTube-like layout featuring collapsible sidebar, top navigation, search bar, and category filter chips.
- **🎬 Watch Page**: Complete watch experience with like/dislike interactions, channel subscription toggle, expandable descriptions, and nested comment section.
- **🗄️ Scalable Database Schema**: Prisma ORM with PostgreSQL models for users, channels, videos, subscriptions, likes, comments, playlists, and watch history.
- **🚀 Vercel Ready**: Optimized for serverless and edge deployment on Vercel with zero runtime dependency issues.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Player**: [Hls.js](https://github.com/video-dev/hls.js)
- **Database ORM**: [Prisma](https://www.prisma.io/) (PostgreSQL)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/Pwooooo/...git
cd Entropy
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and provide your database credentials:
```bash
cp .env.example .env
```

### 3. Generate Prisma Client & Migrate
```bash
npx prisma generate
# When database is connected:
# npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## ☁️ Deploying to Vercel

1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Import the repository in [Vercel](https://vercel.com/new).
3. Connect a PostgreSQL database (e.g. Vercel Postgres, Neon, or Supabase) in the **Storage** tab.
4. Set the `DATABASE_URL` environment variable.
5. Deploy! Vercel will automatically build and deploy the app.
