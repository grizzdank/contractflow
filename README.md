# ContractFlo

ContractFlo is a web-based platform built for small businesses to manage the entire lifecycle of their contracts. The platform simplifies daily operations by centralizing contract management, automating key reminders, and providing actionable insights to help users grow their business. At its core, ContractFlo tackles the challenge of inconsistent contract handling and the risk of missed deadlines by offering a structured, role-based approach to contract management. The platform is designed to modernize contract workflows while ensuring data security and compliance.

## Project Overview

ContractFlo tackles the challenge of inconsistent contract handling and the risk of missed deadlines by offering a structured, role-based approach to contract management. The platform is designed to modernize contract workflows while ensuring data security and compliance.

## Key Features

- **Role-Based Access Control:** Clear user roles with specific permissions
- **Centralized Contract Database:** Searchable repository with filtering options
- **Contract Lifecycle Management:** Creation, editing, approval workflows, and version tracking
- **E-Signature Integration:** Seamless integration with multiple e-signature platforms
- **Automated Reminders & Notifications:** Multi-channel notifications for important dates
- **Reporting Tools:** Generate and export actionable insights

## Technologies Used

- **Vite:** Modern build tool for frontend development
- **React:** Library for building user interfaces
- **React Router:** Client-side routing for single-page applications
- **TypeScript:** Strict type-checking for better code quality
- **Tailwind CSS:** Utility-first CSS framework
- **shadcn/UI & Radix UI:** Component libraries for consistent UI elements
- **Supabase:** Backend-as-a-Service for database, authentication, and storage
- **Bun:** Fast JavaScript runtime and package manager
- **Clerk:** Authentication component

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or higher)

### Installation

```sh
# Clone the repository
git clone https://github.com/yourusername/contractflow.git

# Navigate to the project directory
cd contractflow

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the development server
bun run dev
```

## Development

```sh
# Run development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Lint code
bun run lint
```

## Project Structure

- `src/pages/`: React components that represent different pages/routes
- `src/components/`: Reusable UI components
- `src/integrations/`: Integration with external services like Supabase
- `src/lib/`: Utility functions and helpers
- `src/hooks/`: Custom React hooks
- `src/types/`: TypeScript type definitions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
