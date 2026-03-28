# 🎬 VortxStream — Movies & Series

A sleek, dark-themed movie and series streaming discovery platform built with vanilla HTML, CSS, and JavaScript. Browse trending content, search titles, manage your watchlist, and stream directly in the browser.

---

## 🌐 Live Preview

> Hosted on Cloudflare Pages  
> 👤 Portfolio: [vortx.pages.dev](https://vortx.pages.dev/)

---

## ✨ Features

- 🏠 **Home Page** — Hero banner with auto-rotating featured content, Top 10 today, Trending, Top Rated, and Genre sections
- 🎥 **Movies Page** — Browse movies with sort and genre filters, infinite scroll pagination
- 📺 **Series Page** — Browse TV series with the same filtering options
- 🔍 **Search** — Real-time search across movies and series
- 🎞️ **Detail Page** — Full detail view with cast, episodes (for TV), similar titles, and an embedded player
- ▶️ **Dual Player** — Stream via VidKing (primary) or VidSrc (backup)
- 🔖 **Watchlist** — Save titles to a personal watchlist (requires login)
- ▶ **Continue Watching** — Resume from where you left off (requires login)
- 👤 **Auth System** — Login / Sign Up via Cloudflare Worker backend
- 📱 **Responsive** — Mobile-friendly with a hamburger menu
- 🌑 **Dark Theme** — Default dark UI with smooth transitions

---

## 🗂️ Project Structure

```
VortxStream/
├── index.html       # Main HTML — all pages (home, movies, series, detail) + modals
├── style.css        # All styles — dark theme, layout, components, responsive
├── script.js        # App logic — TMDB API, auth, watchlist, player, navigation
└── Main.png         # App logo / favicon
```

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| HTML5 | Structure & layout |
| CSS3 | Styling, animations, dark theme |
| Vanilla JavaScript (ES6+) | All app logic |
| [TMDB API](https://www.themoviedb.org/documentation/api) | Movie & series data |
| Cloudflare Workers | Auth backend (login/signup) |
| Google Fonts | Bebas Neue + Outfit typefaces |

---

## 🚀 Getting Started

### Prerequisites
- A modern browser (Chrome, Firefox, Edge, Safari)
- A local server (e.g. VS Code Live Server)

### Run Locally

```bash
# Clone the repo
git clone https://github.com/your-username/vortxstream.git

# Open in VS Code
cd vortxstream
code .

# Launch with Live Server
# Right-click index.html → Open with Live Server
```

> ⚠️ Opening `index.html` directly via `file://` may cause API or favicon issues. Always use a local server.

---

## 🔑 API Configuration

The app uses the **TMDB API** for all movie and series data. The key is set in `script.js`:

```js
const TMDB_KEY  = 'your_tmdb_api_key_here';
const TMDB_BASE = 'https://api.themoviedb.org/3';
```

To get your own key, sign up at [themoviedb.org](https://www.themoviedb.org/) and generate an API key from your account settings.

---

## 📱 Pages & Sections

### Home
- Auto-rotating hero banner
- Top 10 content today
- Trending (Movies / Series tabs)
- Top Rated (Movies / Series tabs)
- Genres: Action, Comedy, Horror, Romance, Sci-Fi, Drama, Animation
- Continue Watching *(logged-in users)*

### Movies / Series
- Sort by: Popular, Top Rated, Now Playing / Airing, Upcoming
- Filter by genre
- Load More pagination

### Detail
- Full backdrop hero with title, rating, genres, overview
- Embedded video player (VidKing / VidSrc)
- Season & episode selector for TV shows
- Cast grid
- Episode list with search
- Similar titles row

---

## 🔐 Authentication

Auth is handled via a **Cloudflare Worker** at:

```
https://vortxstream-auth.russiandekho.workers.dev
```

- Login and Sign Up via email & password
- Session persisted in `localStorage`
- Profile dropdown with Watchlist and Continue Watching access

---
## 📄 License

This project is for personal/educational use.  
All movie data is sourced from [TMDB](https://www.themoviedb.org/).

---

## 🙌 Credits

Made with ❤️ by [Subhankar](https://www.instagram.com/vortx_43) © 2026
