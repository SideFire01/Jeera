# Jeera

A lightweight task management board with real-time multi user collaborations.

## Features
- **Responsive Kanban Board:** Snappy drag & drop cards with custom status columns.
- **Real-time Collaboration:** Instant updates across users using Supabase Realtime.
- **User Authentication:** Secure sign-up, sign-in, and password reset powered by Supabase Auth.
- **Team/Organization Management:** Create teams, switch between organizations, and manage members.
- **Invite via Join Codes:** Generate and use secure codes to invite members to organizations.
- **Interactive Dashboard:** Real time analytics and statistics of tasks.
- **Scopes & Tagging:** Keep tasks categorized under custom scopes.

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Spin up the dev server:
   ```bash
   npm run dev
   ```
