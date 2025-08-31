# QueryCraft - Frontend

A Next.js frontend application with Tailwind CSS for the QueryCraft platform.

## Prerequisites

Before setting up the project, ensure you have:

- **Node.js 18+** installed on your system
- **npm** package manager
- **Git** for version control

## Setup Instructions

Follow these steps to set up your local development environment:

### 1. Clone the Repository

```bash
git clone https://github.com/Rifaque/querycraft-frontend.git
cd querycraft-frontend
```

### 2. Checkout Staging Branch

```bash
git checkout staging
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Configuration

**Important**: The `.env` file will be shared via WhatsApp by Rifaque. Once received:

- Place the file in the project root directory
- Rename it to `.env.local`

Sample `.env.local` structure:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
# Additional environment variables will be provided
```

*Note: The backend API URL will be provided via WhatsApp along with the environment file.*

## Development Commands

### Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build and Preview Production

```bash
npm run build && npm start
```

## Git Workflow

- **Base Branch**: Always work off the `staging` branch
- **Feature Development**: Create feature branches from staging
- **Pull Requests**: Open PRs back to the `staging` branch

Example workflow:

```bash
git checkout staging
git pull origin staging
git checkout -b feature/your-feature-name
# Make your changes
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
# Open PR to staging branch
```

## Troubleshooting

### Node Version Mismatch

If you encounter node version issues:

```bash
node --version  # Should be 18+
```

Consider using nvm to manage Node.js versions:

```bash
nvm install 18
nvm use 18
```

### API Connection Errors

- Verify `.env.local` file exists in project root
- Check `NEXT_PUBLIC_API_URL` matches the provided backend URL
- Ensure the backend service is running

### Tailwind CSS Issues

- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`
- Restart the development server

### Port Already in Use

If port 3000 is occupied:

```bash
npm run dev -- -p 3001
```

## Additional Notes

- **Environment Setup**: Rifaque will share the `.env` file and backend API details via WhatsApp
- **Questions**: Reach out on the team chat for any setup issues
- **Documentation**: Additional project documentation available in the `/docs` folder

---

*Ready to start developing! 🚀*
