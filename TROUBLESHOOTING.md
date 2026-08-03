# Frontend Local Troubleshooting

## Frontend does not start

Confirm the expected toolchain and port:

```bash
node --version
npm --version
lsof -i :3100
```

The repository expects Node `24.18.0`, npm `11.11.0`, and a free frontend port
`3100`.

## Blank page or stale Next.js bundle

Stop the local dev server, clean generated caches, and start it again:

```bash
npm run clean
npm run dev
```

If dependencies are also stale:

```bash
npm run clean:full
```

`clean:full` reinstalls dependencies and is intentionally slower.

## Frontend cannot reach the backend

Verify `.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Then check both localhost services:

```bash
curl -I http://localhost:3100
curl -I http://localhost:3000
```

Restart the frontend after changing `.env.local`. The base URL must not contain
an `/api` suffix; frontend clients add their `/v1/...` paths.

## Local quality failure

Run the smallest failing check directly:

```bash
npm run type-check
npm run lint
npm test -- --run
npm run check:privacy
npm run build
```

For browser-test setup and mutation safety, see [`e2e/README.md`](e2e/README.md).
