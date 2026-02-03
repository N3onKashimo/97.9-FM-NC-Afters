# 97.9 FM NCAfters— Self-Hosted Multi-Station Internet Radio

NCAfters is a self-hosted, multi-station internet radio platform built using Icecast, Liquidsoap, and a custom web player.

The project started as a personal system to curate and continuously play music across different moods, and was later extended into a public-facing service to explore real-world streaming infrastructure, deployment, and system reliability.

🌐 Live site: https://ncafters.live

---

## 🎧 Stations
- **Hot Topic** — Emo / Pop Punk / Scene
- **Miami Vice** — Retro / 80s / Dreamwave
- **Top Scrobbles** — Trending / Last.fm-style rotation

All stations run simultaneously from a single host and share a common streaming backend.

---

## 🧱 Architecture Overview


- **Liquidsoap** handles playlist logic, shuffling, and encoding
- **Icecast** serves live MP3 streams and metadata
- **NGINX** provides HTTPS termination and stream proxying
- **Frontend** is a lightweight vanilla HTML/CSS/JS player that consumes Icecast metadata

The entire system is designed to operate reliably on low-resource infrastructure.

---

## ⚙️ Tech Stack

**Backend / Infra**
- Icecast 2
- Liquidsoap 2.x
- NGINX
- Linux (Ubuntu)
- Oracle Cloud ARM (Always Free tier)

**Frontend**
- Vanilla JavaScript
- HTML / CSS
- iTunes Search API (album artwork + metadata enrichment)

---

## ✨ Features

- Multi-station live streaming
- Real-time metadata (track title, artist, listeners, uptime)
- Album artwork with automatic fallback
- True shuffle playback (server-side)
- Track history per station
- Like / dislike system for future curation
- Volume control with persistence
- Responsive desktop-style UI
- Designed for continuous uptime

---

## 📈 Project Milestones

- 10,000+ track plays
- 6,000+ hours streamed
- Publicly accessible, continuously running service
- Average memory usage under 1GB
- Stable operation on free-tier cloud infrastructure

---

## 🧠 Design Goals

- Keep infrastructure simple and observable
- Avoid unnecessary backend complexity
- Prioritize reliability over scale
- Make the system easy to reason about and modify
- Treat the project as a living system, not a static demo

---

## 📚 What This Project Demonstrates

- Operating real services, not just writing code
- Deploying and maintaining long-running processes
- Debugging streaming systems and metadata pipelines
- Working within hardware and cost constraints
- Translating personal requirements into usable systems

---

## 🚧 Current Limitations

- Single global stream per station (no per-user skipping)
- Track ratings influence future curation, not live playback
- No user authentication (by design)

These constraints are intentional to keep the system lightweight and maintainable.

---

## 📬 Author

Built and operated by **Idi Ooko**

Portfolio: https://ididevops.netlify.app
