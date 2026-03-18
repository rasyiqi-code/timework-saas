# Timework SaaS

**AI-Powered, Protocol-Driven Multi-Tenant Workspace & Project Management**

Timework is an advanced, production-ready B2B Software as a Service (SaaS) monorepo. It is designed to manage complex projects through rigorously defined Standard Operating Procedures (Protocols) while natively supporting multi-company isolation, real-time tracking, and multi-model AI logic generation.

## 🚀 Tech Stack
-   **Framework**: Next.js (App Router)
-   **Architecture**: Turborepo (Monorepo)
-   **Language**: TypeScript (Strict 100% Type-Safe)
-   **Database**: PostgreSQL + Prisma ORM (Edge-ready)
-   **Styling**: Tailwind CSS + Shadcn UI + Framer Motion
-   **Auth**: Stack Auth (RBAC & Teams Multi-Tenancy)
-   **AI Integration**: Vercel AI SDK (Gemini, OpenRouter, Groq)

## 🏢 Key Features

### 1. Natively Multi-Tenant (B2B SaaS Ready)
- Fully isolated work environments (Organizations/Teams).
- Data boundary at the database level (`organizationId` strictly enforced on Projects, Tasks, Protocols, and Files).
- Staff can join multiple workspaces and seamlessly switch context without logging out.

### 2. AI Protocol Generator
- Build complex standard operating procedures in seconds using natural language.
- Generates required intake form variables, tasks, duration heuristics, dependencies, and validation strictness automatically.
- Multi-vendor support: Connect to Google Gemini, OpenRouter (Llama 3, Qwen, etc.), and Groq natively from the Builder.

### 3. Protocol Management
- Define reusable SOPs (Protocols) with Sub-tasks, Notes, and Checklists.
- Directed Acyclic Graph (DAG) task dependencies – Enforce chronological completion order (e.g. Task B cannot start until A is finished).
- Custom variables and intake forms to initialize project instances.

### 4. Interactive Project Board
- Fast-track boards or continuous timeline views.
- Real-time status updates and file attachments.
- Strict visibility modes to hide upcoming tasks from assignees until prerequisites are complete.

### 5. Insight Dashboard & Reporting
- Track organizational ROI, completion velocity, and project bottlenecks.
- Real-time productivity metrics segmented by team and specific assignees.

## ⚙️ Project Structure
-   `apps/web`: The main Next.js web application frontend and API.
-   `packages/database`: Shared Prisma Postgres database schema and types.
-   `packages/project-service`: Core domain business logic, strictly typed validations, and backend automations.
-   `packages/config`: Shared configurations (eslint, typescript).

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- Bun (\`curl -fsSL https://bun.sh/install | bash\`)
- PostgreSQL Database

### Installation

1.  **Install dependencies**:
    \`\`\`bash
    bun install
    \`\`\`

2.  **Environment Setup**:
    Copy \`.env.example\` to \`.env\` and populate your \`DATABASE_URL\`, \`NEXT_PUBLIC_STACK_PROJECT_ID\`, and AI Provider API Keys.

3.  **Database Migration**:
    \`\`\`bash
    bun db:push
    bun run type-check # Ensures Prisma client is strictly generated
    \`\`\`

4.  **Launch Local Server**:
    \`\`\`bash
    bun dev
    \`\`\`

## 🛡️ Best Practices Enforced
- 100% Type-Safe via strict \`tsc\` compiler checks.
- ESLint enforced across all workspaces (Zero-warning tolerance policy).
- Zero \`any\` or \`eslint-disable\` overrides in production logic.
