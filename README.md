# Zidni AI Frontend

Frontend app for the Zidni AI platform.

## Requirements

- Node.js (LTS recommended)
- `pnpm` package manager

## Install

```bash
pnpm install
```

## Environment

Copy an example env file and edit values as needed:

```bash
cp .env.example .env
```

Other env templates are available:

- `.env.development`
- `.env.staging`
- `.env.production`
- `.env.test`

## Run Dev Server

```bash
pnpm run dev
```

### Local + SSH Tunnel (Fixed Host/Port)

Run the dev server:

```bash
pnpm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Example from PowerShell:

```powershell
PS E:\work\e-test\front> pnpm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Create SSH remote port forwarding:

```bash
ssh -R 5174:127.0.0.1:5174 root@72.61.18.248
```

### Troubleshooting

If `http://app-test.72.61.18.248.nip.io/` redirects to the production Zidni URL, do a hard refresh to clear cache/service worker:

- Windows: `Ctrl+Shift+R`
- macOS: `Cmd+Shift+R`

If SSH local port forwarding fails with `bind [127.0.0.1]:5174: Permission denied`, the port is already in use or blocked. Use a different local port or free it:

```bash
ssh -L 5175:127.0.0.1:5174 root@72.61.18.248
```

Check port usage on Windows PowerShell:

```powershell
netstat -ano | findstr :5174
```

## Build

```bash
pnpm run build
```

## Preview Production Build

```bash
pnpm run preview
```

## Lint

```bash
pnpm run lint
```

## Test

Unit tests:

```bash
pnpm run test:unit
```

E2E tests:

```bash
pnpm run test:e2e
```
