# Tax Scratchpad

A local-first experimental workspace for exploring hypothetical 2025 U.S. federal tax scenarios.

Built with React, TypeScript, and Vlak.

Live demo: [https://taxscratchpad.npux.design](https://taxscratchpad.npux.design)

Design system: [https://github.com/Noord-Ventures/vlak](https://github.com/Noord-Ventures/vlak)

## What it explores

- Direct manipulation instead of a tax interview wizard
- Source forms and calculated forms in the same packet
- Transparent calculation provenance
- Scenario duplication and comparison
- Keyboard-first interaction
- Local-only persistence

## Vlak

The product uses Vlak as its visual grammar: paper/ink surfaces, hairline dividers, and selected states as a full fill or weight change rather than a leading stripe.

It extends Vlak only where the product requires it. The persistent return bar opens a menu upward via a local `DropdownMenu` wrapper (`side="top"`). That drop-up is a product-specific extension, not an official Vlak component or an accepted upstream contribution.

## Privacy

Scenario and taxpayer data are stored in this browser with IndexedDB. There is no backend, no account, and no tax API. Cloudflare Pages only serves the static application bundle.

## Development

Requires Node 20.19+ or 22.12+ (Vite 8). npm is the package manager.

```sh
npm install
npm run dev
npm run typecheck
npm test
npm run lint
npm run build
npm run preview
```

Keyboard shortcuts (when you are not typing in a field): `⌘/Ctrl+K` command palette, `?` shortcut overlay, `G` then `S`/`F`/`B` to go to Scratchpad, Form, or Basics, `N` add form, `D` duplicate, `C` compare. Esc closes overlays.

On first visit, if no scenarios are saved locally, a fictional **Baseline** demonstration is created. **More actions → Reset demo** loads a fresh copy without overwriting existing scenarios.

## Deployment

Hosted on Cloudflare Pages as a static Vite site.

- Production branch: `master`
- Build command: `npm run build`
- Build output directory: `dist`
- Custom domain: `taxscratchpad.npux.design`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for dashboard steps and a post-deploy checklist.

## Disclaimer

Experimental software for hypothetical tax scenarios. It does not prepare or file tax returns and is not tax advice.
