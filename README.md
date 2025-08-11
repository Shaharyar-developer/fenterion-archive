  ███████╗███████╗███╗   ██╗████████╗███████╗██████╗ ██╗ ██████╗ ███╗   ██╗
  ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██╔════╝██╔══██╗██║██╔═══██╗████╗  ██║
  █████╗  █████╗  ██╔██╗ ██║   ██║   █████╗  ██████╔╝██║██║   ██║██╔██╗ ██║
  ██╔══╝  ██╔══╝  ██║╚██╗██║   ██║   ██╔══╝  ██╔═══╝ ██║██║   ██║██║╚██╗██║
  ██║     ███████╗██║ ╚████║   ██║   ███████╗██║     ██║╚██████╔╝██║ ╚████║
  ╚═╝     ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
                          The Fenterion Codex


---

## Fenterion Codex

A self-hosted archive for my novels, poems, and fanfics — because Webnovel's ToS is sus, AO3 is chaos, and I wanted my own literary vault.

Built with Next.js + Bun + TailwindCSS, deployed on Vercel (frontend) with backend services hosted on a local server (Coolify + Postgres + Drizzle).

Dark theme: Black & Gold
Light theme: White & Rose Gold
Font: Monospaced, archivist-core.

📜 Features (Current & Planned)

- Minimal, distraction-free reading experience.
- Dark/Light theme with brand colors.
- All content stored in Postgres (covers in base64, because S3 is overrated here).
- Fully self-owned — no middlemen, no sketchy ToS.

🛠️ Tech Stack

- Framework: Next.js (App Router)
- Runtime: Bun
- Styling: TailwindCSS
- ORM: Drizzle
- DB: PostgreSQL
- Deployment:
    Frontend: Vercel
    Backend: Self-hosted via Coolify
- DNS/SSL: Cloudflare

📂 Project Structure
```
.
|-- src/
|   |-- app/           # Next.js app router pages/layouts
|   |-- components/    # UI components
|   |-- constants/     # Static site config
|   |-- lib/           # Utilities/helpers
|-- public/            # Static assets
```
🚀 Development
```bash
# Install dependencies
bun install

# Run dev server
bun dev
```
