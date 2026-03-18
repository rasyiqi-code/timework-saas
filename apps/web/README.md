# Timework Web Application

The frontend client for the **Timework** monorepo, built with **Next.js 16 (App Router)**. This application serves as the main interface for managing projects, protocols, and team collaborations.

## 🛠 Tech Stack

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Data Fetching**: Server Actions & React Server Components (RSC)
-   **Validation**: [Zod](https://zod.dev/)

## ✨ Key Features

### 📊 Dashboard
-   **Insight Charts**: operational analytics using Recharts.
-   **Recent Activities**: Real-time overview of ongoing tasks.

### 🚀 Project Management
-   **CRUD Operations**: Create, Read, Update, and Soft Delete projects.
-   **Protocol-Driven**: Projects are instantiated from defined Protocols (SOPs).
-   **Task Board**: Manage task statuses (LOCKED -> OPEN -> IN_PROGRESS -> DONE).

### 📂 File Manager
A centralized hub for all project assets.
-   **Explorer View**: Navigate projects like folders.
-   **Detailed List**: View 'Name', 'Size', 'Date Uploaded', 'Uploaded By', and 'Relations'.
-   **Data Safety**: 
    -   **Soft Delete**: Projects are moved to a temporary "Deleted" state.
    -   **Permanent Delete**: Admin-only action to wipe data from DB and Cloudflare R2.
-   **Search**: Interactive client-side filtering.

### 📜 Protocol Builder
-   **Visual Editor**: Define workflows with tasks, notes, and dependencies.
-   **Versioning**: Manage standard operating procedures.

## 🚀 Getting Started

Quick start for development:

```bash
# Verify you are in the root directory
pnpm dev
# The web app typically runs on http://localhost:3000
```

## 📁 Folder Structure

Key directories within `apps/web`:

```
src/
├── actions/        # Server Actions (Mutations & Data Fetching)
├── app/            # Next.js App Router Pages & Layouts
│   ├── (dashboard)/ # Authenticated routes layout
│   └── api/        # Route Handlers (e.g., File Proxy)
├── components/     # React Components
│   ├── ui/         # Reusable primitives (Shadcn)
│   ├── project/    # Project-specific components
│   └── file/       # File Manager components
├── hooks/          # Custom React Hooks
└── lib/            # Utilities (Auth, Formatter, etc.)
```

## 🔐 Security & Permissions

-   **Role-Based**: Admin vs Staff views.
-   **File Storage**: Files are stored in **Cloudflare R2** with organized paths (`projects/{projectId}/...`).
-   **Proxy Access**: Secure file delivery via `/api/file/[id]` endpoint.
