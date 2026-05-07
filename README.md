# 🚀 AI Engineer Portfolio & Captain's Log

A next-generation portfolio and blog platform built with Next.js 15, React 19, and advanced AI integrations. Features a nautical-themed "Captain's Log" blog with a powerful AI-assisted admin dashboard ("Captain's Cabin").

<img width="1919" height="930" alt="image" src="https://github.com/user-attachments/assets/5ecb7233-388d-42a4-9a8e-8ad25eff51a3" />


## ✨ Key Features

### 🎨 Modern Portfolio
- **Premium Design**: Glassmorphism, smooth animations with Framer Motion, and distinct dark mode aesthetics.
- **Responsive**: Fully optimized for mobile, tablet, and desktop.
- **Dynamic Content**: Showcase projects, skills, and experience with interactive elements.

### ⚓ Captain's Log (Blog)
- **Themed Experience**: A unique nautical theme ("Log Entries", "Transmitted", "Vault").
- **MDX/Markdown Support**: Write in Markdown with full support for GFM.
- **Syntax Highlighting**: Automatic code highlighting for all major languages using `highlight.js`.
- **Smart Features**: 
  - Real-time Search & filtering by tags.
  - Estimated reading time.
  - Social sharing with AI-generated captions.
  - Reading progress bar.

### 🛂 Captain's Cabin (Admin Dashboard)
- **Route**: `/blog/captainscabin` (Hidden command deck).
- **Content Management**: 
  - Create, Edit, Delete, and **Schedule** posts.
  - Dual-pane Markdown editor with real-time preview.
  - Draft system ("The Vault") vs. Live posts ("Transmitted").
- **AI-Powered Assistant**:
  - **Writing Aid**: Improve grammar, summarize, expand, or simplify text on the fly.
  - **SEO Optimizer**: Get AI suggestions for better visibility.
  - **Social Media Genius**: Generate platform-specific captions (Twitter/X threads, LinkedIn posts) with "staircase" formatting and emojis.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **AI Integration**: [Groq SDK](https://groq.com/) (Qwen 3 32B)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown**: `remark`, `rehype`, `gray-matter`, `highlight.js`
- **Fonts**: Inter & JetBrains Mono

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/portfolio.git
   cd portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root:
   ```env
   # AI Features (Groq)
   GROQ_API_KEY=your_groq_api_key_here
   
   # Optional: Base URL for SEO
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) to see the portfolio.

## 📂 Project Structure

```
├── app/
│   ├── api/             # API Routes (AI assist, posts CRUD)
│   ├── blog/
│   │   ├── captainscabin/  # Admin Dashboard & Editor
│   │   ├── posts/          # Individual Blog Post Pages
│   │   └── page.tsx        # Main Blog Archive
│   ├── layout.tsx       # Root Layout
│   └── page.tsx         # Portfolio Home
├── components/
│   ├── blog/            # Blog-specific UI (Cards, AI Features, Social Share)
│   └── ui/              # Reusable UI components
├── lib/
│   ├── blog/            # Blog utilities (Markdown parsing, file system)
│   └── utils.ts         # Helper functions
├── data/
│   ├── posts/           # Published Markdown files
│   └── drafts/          # Draft Markdown files
└── public/              # Static assets
```

## 🗺️ Roadmap & Future Plans

- [x] **Phase 1: Foundation (Completed)**
  - [x] "Captain's Log" rebrand.
  - [x] File-based CMS architecture.
  - [x] Basic AI writing assistance.

- [x] **Phase 2: Enhanced Experience (Completed)**
  - [x] Syntax highlighting for code blocks.
  - [x] Scheduled posting capability.
  - [x] AI social media caption generator.
  - [x] Advanced search and filtering.

- [ ] **Phase 3: Community & Engagement (Coming Soon)**
  - [ ] **Comment System**: Integration with Giscus (GitHub Discussions) or simple database-backed comments.
  - [ ] **Newsletter**: Email subscription for "Weekly Log" updates.
  - [ ] **Interactive Reactions**: "Clap" or "Star" posts.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

