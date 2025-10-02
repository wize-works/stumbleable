# Stumbleable

> A StumbleUpon-style serendipity engine for discovering interesting content across the web

## 🚀 Quick Start

### One-Command Setup
```bash
# Install all dependencies and set up environment files
npm run setup

# Start all services (UI + APIs)
npm run dev

# Check if all services are running
npm run health
```

### Manual Setup
```bash
# Install root dependencies
npm install

# Install dependencies for all services
npm run install:all

# Start development environment
npm run dev
```

## 📁 Project Structure

```
stumbleable/
├── ui/
│   └── portal/          # Next.js 15 frontend (Port 3000)
├── apis/
│   ├── discovery-service/    # Discovery API (Port 7001)
│   └── interaction-service/  # Interaction API (Port 7002)
├── scripts/             # Development utilities
├── docs/               # Documentation
└── package.json        # Monorepo configuration
```

## 🛠 Available Scripts

### Development
- `npm run dev` - Start all services in development mode
- `npm run dev:ui` - Start only the UI portal
- `npm run dev:discovery` - Start only the discovery service
- `npm run dev:interaction` - Start only the interaction service

### Setup & Installation
- `npm run setup` - Full development environment setup
- `npm run install:all` - Install dependencies for all services

### Production
- `npm run build` - Build all services for production
- `npm run start` - Start all services in production mode

### Utilities
- `npm run health` - Check if all services are running
- `npm run lint` - Run linting on all services
- `npm run test` - Run tests for all services

## 🌐 Service URLs

| Service | Development | Production |
|---------|-------------|------------|
| **UI Portal** | http://localhost:3000 | TBD |
| **Discovery API** | http://localhost:7001 | TBD |
| **Interaction API** | http://localhost:7002 | TBD |

## 🏗 Architecture

### Frontend (UI Portal)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom theme system
- **Features**: Discovery interface, user reactions, saved items

### Backend Services
- **Discovery Service**: Handles content recommendations and scoring
- **Interaction Service**: Manages user feedback, saves, and analytics

### Key Features
- **Wildness Control**: Adjust how far recommendations stray from user interests
- **Real-time Reactions**: Like, skip, save, and share discoveries
- **Keyboard Navigation**: Full keyboard support for fast browsing
- **Responsive Design**: Works on desktop and mobile

## 🔧 Environment Configuration

Each service has its own `.env.example` file. Copy these to `.env` and customize:

```bash
# In each service directory
cp .env.example .env
```

### Key Environment Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Service port (see DEVELOPMENT_PORTS.md)
- `NEXT_PUBLIC_DISCOVERY_API_URL` - Discovery service URL
- `NEXT_PUBLIC_INTERACTION_API_URL` - Interaction service URL

## 📚 Documentation

- [Development Ports](./DEVELOPMENT_PORTS.md) - Port assignments and service URLs
- [Copilot Instructions](./docs/copilot_prompt_stumbleable_web_ui_ui_first_mock_data_in_data.md) - AI development guidelines

## 🤝 Development Workflow

1. **Setup**: Run `npm run setup` to install dependencies
2. **Develop**: Use `npm run dev` to start all services
3. **Health Check**: Run `npm run health` to verify services are running
4. **Build**: Run `npm run build` before deploying

## 🛡 Requirements

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0

## 📝 License

MIT License - see LICENSE file for details