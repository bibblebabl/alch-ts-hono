# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

The project uses Bun as the package manager and Turborepo for monorepo management.

### Core Development
- `bun dev`: Start all applications in development mode (web on :3001, server on :3000)
- `bun dev:web`: Start only the frontend application
- `bun dev:server`: Start only the backend server
- `bun build`: Build all applications
- `bun check-types`: TypeScript type checking across all apps
- `bun check`: Run Biome linting and formatting

### Database Operations
- `bun db:push`: Push schema changes to PostgreSQL database
- `bun db:studio`: Open Drizzle Studio for database management
- `bun db:generate`: Generate migration files
- `bun db:migrate`: Apply migrations to database

### Deployment (Alchemy)
- `bun deploy`: Deploy to cloud using Alchemy
- `bun destroy`: Destroy cloud resources
- `bun alchemy:dev`: Start Alchemy dev environment

## Project Architecture

This is a monorepo built with the Better-T-Stack, featuring:

### Tech Stack
- **Frontend**: React 19 with TanStack Start (SSR framework)
- **Backend**: Hono (lightweight server) with Cloudflare Workers
- **API**: ORPC for end-to-end type-safe APIs with OpenAPI integration
- **Database**: PostgreSQL with Drizzle ORM (TypeScript-first)
- **Authentication**: Better Auth with email/password
- **Styling**: TailwindCSS with shadcn/ui components
- **Build**: Turborepo with Vite and Wrangler

### Monorepo Structure
```
apps/
├── web/          # Frontend React application
│   ├── src/
│   │   ├── routes/      # TanStack Router route definitions
│   │   ├── components/  # React components (includes shadcn/ui)
│   │   ├── lib/         # Client-side utilities
│   │   └── utils/       # ORPC client setup
│   └── vite.config.ts
└── server/       # Backend Hono API
    ├── src/
    │   ├── routers/     # ORPC router definitions
    │   ├── db/          # Database schema and connection
    │   ├── lib/         # Server utilities (auth, context, orpc)
    │   └── index.ts     # Main Hono app
    ├── drizzle.config.ts
    └── wrangler.jsonc
```

### Key Architectural Patterns

**ORPC Integration**: The project uses ORPC for type-safe client-server communication:
- Server routers defined in `apps/server/src/routers/`
- Client configured in `apps/web/src/utils/orpc.ts`
- Procedures use `publicProcedure` or `protectedProcedure` from `apps/server/src/lib/orpc.ts`

**Authentication Flow**:
- Better Auth handles session management
- Context creation in `apps/server/src/lib/context.ts` extracts session from requests
- Protected routes use `protectedProcedure` middleware

**Database Schema**:
- Drizzle schema files in `apps/server/src/db/schema/`
- Database connection configured in `apps/server/src/db/index.ts`

## Code Conventions

- **Formatting**: Uses Biome with tab indentation and double quotes
- **Imports**: Auto-organized with Biome
- **TypeScript**: Strict mode enabled, exhaustive dependency checks as info level
- **Styling**: Tailwind classes sorted with `useSortedClasses` rule

## Environment Setup

The project requires:
1. PostgreSQL database configured in `apps/server/.env`
2. CORS origin configuration for cross-origin requests
3. Better Auth secret and URL configuration

Database schema must be pushed before first run: `bun db:push`