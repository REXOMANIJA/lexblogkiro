# Personal Blog Setup Instructions

## Prerequisites
- Node.js (v20.17.0 or higher)
- npm (v10.8.2 or higher)
- A Supabase account

## Supabase Setup

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the project details:
   - Project name: `personal-blog` (or your preferred name)
   - Database password: Choose a strong password
   - Region: Select the closest region to you
5. Wait for the project to be created (this may take a few minutes)

### 2. Get Your API Keys
1. Once your project is created, go to Project Settings (gear icon in the sidebar)
2. Navigate to "API" section
3. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

### 3. Configure Environment Variables
1. Create a `.env` file in the root of this project
2. Copy the contents from `.env.example`
3. Replace the placeholder values with your actual Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Set Up Database (Next Task)
The database schema and storage buckets will be set up in the next implementation task.

## Local Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Project Structure

```
src/
├── components/     # React components
├── pages/          # Page components
├── services/       # API and service modules (Supabase client)
├── types/          # TypeScript type definitions
├── App.tsx         # Main app component
└── main.tsx        # Entry point
```

## Next Steps
1. Complete Supabase database setup (Task 2)
2. Implement core data types and services (Task 3)
3. Build authentication system (Task 4)
4. Create UI components (Tasks 5-7)
