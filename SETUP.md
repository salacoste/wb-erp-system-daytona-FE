# Project Setup Guide

This guide provides step-by-step instructions for setting up the WB Repricer System Frontend project from scratch.

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** 24.18.0 ([Download](https://nodejs.org/))
- **npm** 11.11.0
- **Git** for version control
- **Code Editor** (VS Code recommended)

---

## Step 1: Clone Repository

```bash
git clone https://github.com/salacoste/wb-erp-system-daytona.git
cd wb-erp-system-daytona/frontend
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This will install all dependencies listed in `package.json`, including:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui dependencies
- Testing libraries (Vitest, Playwright)
- And more...

---

## Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your settings
# At minimum, set:
# NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Required Variables:**
- `NEXT_PUBLIC_API_URL` - Backend API URL

**Optional Variables:**
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_APP_VERSION` - Application version
- `NEXT_PUBLIC_ENABLE_DEV_TOOLS` - Enable React Query DevTools

---

## Step 4: Initialize shadcn/ui

The `components.json` file is already configured. To add shadcn/ui components:

```bash
# Add a component (example: button)
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add button card input table
```

**Note:** Components will be installed to `src/components/ui/` and can be customized.

---

## Step 5: Verify Setup

```bash
# Run type checking
npm run type-check

# Run linter
npm run lint

# Start development server
npm run dev
```

Visit `http://localhost:3100` to see the application.

---

## Step 6: Verify Configuration Files

Ensure these files exist and are properly configured:

- ✅ `tailwind.config.ts` - Tailwind CSS configuration
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `next.config.ts` - Next.js configuration
- ✅ `components.json` - shadcn/ui configuration
- ✅ `.eslintrc.json` - ESLint rules
- ✅ `vitest.config.ts` - Test configuration
- ✅ `src/styles/globals.css` - Global styles

---

## Step 7: Test the Setup

```bash
# Run unit tests
npm test

# Run live E2E only after the prerequisites below are available
npm run test:e2e
```

Live E2E requires `.env.e2e` with `E2E_TEST_EMAIL` and
`E2E_TEST_PASSWORD`, the backend on `localhost:3000`, and the frontend on
`localhost:3100`. Ordinary runs exclude mutating scenarios; see
[`e2e/README.md`](e2e/README.md) before enabling any sandbox mutations. If
these local prerequisites are unavailable, record live E2E as unavailable and
do not report the suite as passed.

---

## Common Setup Issues

### Issue: TypeScript Errors

**Solution:**
```bash
npm run type-check
# Fix any type errors before proceeding
```

### Issue: ESLint Errors

**Solution:**
```bash
npm run lint:fix
# This will auto-fix many issues
```

### Issue: Module Not Found

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port Already in Use

**Solution:**
```bash
# Inspect the process occupying the configured frontend port.
lsof -nP -iTCP:3100 -sTCP:LISTEN
# Stop that local process, then restart the frontend on localhost:3100.
npm run dev
```

`localhost:3000` is reserved for the backend.

---

## Next Steps

After successful setup:

1. **Read the Architecture Document**
   - Review `docs/front-end-architecture.md`
   - Understand project structure and patterns

2. **Review UI/UX Specifications**
   - Study `docs/front-end-spec.md`
   - Understand design system and component requirements

3. **Check Backend API**
   - Ensure backend is running
   - Verify API URL in `.env.local`
   - Test API connection

4. **Start Development**
   - Follow story requirements from PRD
   - Use architecture patterns and templates
   - Keep files under 200 lines

---

## Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop Following Standards**
   - Use TypeScript strictly
   - Keep files under 200 lines
   - Follow component templates
   - Write tests

3. **Test Your Changes**
   ```bash
   npm run lint
   npm run type-check
   npm test
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

---

## IDE Setup (VS Code)

### Recommended Extensions

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript and JavaScript Language Features** - TypeScript support
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **Error Lens** - Inline error display

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## Troubleshooting

### Problem: Can't find module '@/...'

**Solution:** Ensure `tsconfig.json` has correct path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Problem: Tailwind classes not working

**Solution:** 
1. Check `tailwind.config.ts` content paths
2. Ensure `src/styles/globals.css` imports Tailwind
3. Restart dev server

### Problem: shadcn/ui components not found

**Solution:**
1. Verify `components.json` exists
2. Run `npx shadcn@latest init` to verify configuration
3. Check that components are installed in `src/components/ui/`

---

## Getting Help

- **Architecture Questions:** See `docs/front-end-architecture.md`
- **UI/UX Questions:** See `docs/front-end-spec.md`
- **API Questions:** Check backend documentation in `../docs/frontend-po/`
- **General Questions:** Review `README.md`

---

**Setup Complete!** You're ready to start development. 🚀
