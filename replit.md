# Overview

Slate Arcade is a web-based casino gaming platform that offers multiple gambling games with fake money. The application features a dark-themed UI with games like Dice, Mines, Crash, Plinko, Limbo, Blackjack, Roulette, Keno, Hi-Lo, and Towers. Built as a full-stack TypeScript application with React frontend and Express backend, it provides an immersive gaming experience with sound effects, animations, and local storage for game state persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom dark theme color palette optimized for gaming aesthetics
- **State Management**: Local state with React hooks and custom localStorage hook for persistence
- **Routing**: Wouter for lightweight client-side routing
- **Data Fetching**: TanStack Query (React Query) for server state management with custom query client configuration

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Development**: TSX for development server with hot reload
- **Build**: ESBuild for production bundling
- **Storage Interface**: Abstracted storage layer with in-memory implementation (MemStorage class)

## Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Type-safe database schema with Zod validation
- **Migration**: Drizzle Kit for schema migrations
- **Provider**: Configured for Neon Database (serverless PostgreSQL)
- **Schema Structure**: Users table with UUID primary keys, username/password authentication

## Styling and Design System
- **Theme**: Custom dark theme with gaming-focused color palette (slate, accent greens/blues, warning/danger colors)
- **Typography**: Inter font family with multiple weights
- **Component System**: Comprehensive shadcn/ui component library with consistent styling
- **Animations**: CSS keyframe animations for game interactions (pop, glow, pulse effects)
- **Responsive**: Mobile-first responsive design with breakpoint utilities

## Game Logic Architecture
- **Game State**: Local component state for individual game sessions
- **Audio System**: Web Audio API integration for sound effects (click, win, lose sounds)
- **Animation System**: Custom hooks for managing UI animations and transitions
- **Persistence**: localStorage integration for preserving game state and user preferences
- **Game Engine**: Pure client-side game logic with configurable house edge

## Development Environment
- **Hot Reload**: Vite dev server with React Fast Refresh
- **Type Safety**: Strict TypeScript configuration with path mapping
- **Error Handling**: Runtime error overlay for development
- **Replit Integration**: Custom plugins for Replit environment compatibility

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection for Neon
- **drizzle-orm & drizzle-kit**: Type-safe ORM and migration toolkit
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React routing library

## UI and Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives (dialogs, dropdowns, forms, etc.)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx & tailwind-merge**: Conditional className utilities

## Development Tools
- **vite**: Modern frontend build tool with ES modules
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development plugins

## Form and Validation
- **react-hook-form**: Performant form library with validation
- **@hookform/resolvers**: Form validation resolvers
- **zod**: TypeScript-first schema validation

## Additional Features
- **date-fns**: Date manipulation utilities
- **cmdk**: Command palette component
- **embla-carousel-react**: Carousel/slider component
- **lucide-react**: Icon library
- **nanoid**: URL-safe unique string generator