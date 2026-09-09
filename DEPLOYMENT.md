# Deployment

Tax Scratchpad is a static Vite SPA. Cloudflare Pages should only serve the built files in `dist/`. Do not add Pages Functions, Workers, D1, KV, or authentication.

## Provider

Cloudflare Pages, Git-connected.

## Repository

- GitHub: [npuxdev/tax-scratchpad](https://github.com/npuxdev/tax-scratchpad)
- Production branch: `master`
- Root directory: `/`

## Build

| Field | Value |
| --- | --- |
| Framework preset | Vite (or None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Package manager | npm (`package-lock.json`) |

Node version: Vite 8 requires Node **20.19+** or **22.12+**. Cloudflare Pages v3 currently defaults to Node 22, which is sufficient. No `NODE_VERSION` override or `.nvmrc` is required unless the Pages default changes.

Do not set a subdirectory base path. The app is served at the root of `https://taxscratchpad.npux.design/`.

This app has no client-side URL router. Do not add a custom `404.html` or a catch-all `_redirects` rule; Cloudflare Pages already falls back to `index.html` for static SPAs when those files are absent.

`public/_headers` is copied into `dist/` by Vite and applies security headers, including a Content-Security-Policy that allows Vlak's StyleX inline styles and bundled Inter fonts while forbidding network `connect-src` at runtime.

## Cloudflare dashboard steps

1. Open **Workers & Pages**.
2. Choose **Create application**.
3. Select **Pages**.
4. **Connect to Git**.
5. Select **npuxdev/tax-scratchpad**.
6. Configure the build:
   - Production branch: `master`
   - Root directory: `/`
   - Build command: `npm run build`
   - Build output directory: `dist`
7. Deploy.
8. Add custom domain **taxscratchpad.npux.design**.
9. Verify HTTPS on the custom domain.
10. Verify the production deployment at `https://taxscratchpad.npux.design/`.
11. Verify preview deployments for non-`master` branches and pull requests.

## Post-deployment checklist

- Root `/` loads the application
- Refresh on the loaded application still works
- Favicon loads (`/favicon.svg` and `/favicon-32x32.png`)
- OG metadata is present in the document head (title, description, canonical, `og:*`, `twitter:card`)
- `_headers` applied (security headers visible on the HTML response)
- IndexedDB persists scenarios after refresh
- Browser network log shows no tax/scenario data leaving the origin
- Command palette (`⌘/Ctrl+K`) works
- Keyboard shortcuts work (`?`, `G` then `S`/`F`/`B`, `N`, `D`, `C`) and do not fire while typing in a field
- Forms drop-up on the return bar opens upward, stays in viewport, and dismisses with Escape / outside click
- Scenario duplication works
- Compare works
- Form / Scratchpad toggle works
- Mobile / basic responsive layout is not broken (packet moves into the drawer)

## Manual asset TODO

A 1200×630 (or similar) PNG social preview image does not exist in this repository. Do not invent a placeholder, and do not use SVG as the LinkedIn Open Graph image.

When a 1200×630 (or similar) PNG is ready, place it at `public/og.png` so it is served at:

`https://taxscratchpad.npux.design/og.png`

Then add to `index.html`:

```html
<meta property="og:image" content="https://taxscratchpad.npux.design/og.png" />
<meta name="twitter:image" content="https://taxscratchpad.npux.design/og.png" />
```

Raster app icons (`favicon-32x32.png`, `apple-touch-icon.png`) are generated from the stacked-form SVG mark in `public/favicon.svg`. That mark is a deployment stand-in; it is not a finished brand logo.
