# roads.walt.online

An interactive explorer of New Zealand’s Roads of National Significance (RoNS) and Roads of Regional Significance (RoRS), covering project locations, available costs and delivery status. Built with React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Mapbox GL JS, and Cloudflare Workers.

## Run with Wrangler

Requires Node.js 22.12 or later.

```sh
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

`npm run dev` builds the React app and starts **Wrangler**. Open `http://localhost:5178`. An existing local `.dev.vars` is already prepared; preserve it when adding your token.

For frontend hot reload, leave Wrangler running and run `npm run dev:ui` in a second terminal. Open Vite at `http://localhost:5177`; it proxies `/api` to Wrangler. Rebuild with `npm run build` to update the Wrangler-served frontend.

## Mapbox configuration

Put your **public browser token** in `.dev.vars`:

```dotenv
MAPBOX_TOKEN="pk.your_public_token"
```

Wrangler loads this file for local development. Restart Wrangler after changing it. `.dev.vars` is ignored and excluded from the source archive. `MAPBOX_ACCESS_TOKEN` and the earlier `VITE_MAPBOX_TOKEN` key are accepted as aliases.

The Worker exposes only the public Mapbox token through `/api/config`. Other environment values stay on the server. Secret Mapbox tokens starting with `sk.` are rejected. The token is read at runtime, so changing it does not require rebuilding the frontend. Restrict the public token to `https://roads.walt.online` and test the map on the deployed site. Localhost is intentionally excluded from the token's allowed URLs; the local UI remains usable while Mapbox requests are denied. See [Mapbox URL restrictions](https://docs.mapbox.com/accounts/guides/tokens/).

Without a token, the map shows a waiting state; project search, filters, and details remain usable. The map uses Mapbox only, with no substitute geography.

For production, configure `MAPBOX_TOKEN` as a Worker runtime variable in Cloudflare, or save it with:

```sh
npx wrangler secret put MAPBOX_TOKEN
```

The public token is still visible to the browser; storing it as a Worker secret only keeps it out of source configuration. `.dev.vars` is local and is not uploaded during deployment.

## Google Analytics

The `roads.walt.online` GA4 property uses measurement ID `G-12FKZ6G5YF` and web stream `16094639557`, under the existing Walter Lim account. Reporting uses New Zealand time and NZD. The Google tag in `index.html` loads only on `roads.walt.online`, keeping local development and preview traffic out of the property. Deploy the built site to activate collection.

## Interface

The floating left panel contains the name, compact totals, methodology, search, and unified filter dropdown. Selecting a project slides the list out and the detail card into the same top-left position. **Back to projects** reverses the transition while preserving filters, list position, and keyboard focus. Reduced-motion preferences disable the animation.

## Deploy with Wrangler

`wrangler.jsonc` configures the Worker entrypoint, static assets from `dist`, SPA fallback, Worker-first `/api/*` routes, and the `roads.walt.online` custom domain. Development commands do not deploy.

```sh
npm run build
npx wrangler login
npx wrangler deploy
```

Or run `npm run deploy` to build and deploy together. Cloudflare Git builds can use `npm run build` followed by `npx wrangler deploy`. Configure the Mapbox token as a runtime variable, not a Vite build variable. Wrangler manages the configured custom domain. The alternate workers.dev endpoint is disabled.

## Checks

```sh
npm run typecheck
npm test
npm run build
npx wrangler deploy --dry-run
```

Data tests cover duplicate exclusions, weighted rates, filters, Māori macrons, and missing costs. Worker tests cover runtime configuration, token handling, API routing, and assets. For browser checks, run `npx playwright install chromium` once, then `npm run test:e2e`.

## Source

- `src/App.tsx`: sidebar, totals, filters, and list/detail navigation.
- `src/components/road-map.tsx`: runtime configuration, Mapbox, and animated details.
- `src/components/project-filters.tsx`: programme/island/status dropdown.
- `src/components/road-detail.tsx`: costs, scope, lifecycle, and public sources.
- `src/components/ui/`: editable shadcn/ui primitives.
- `src/data/roads.json`: all 35 entries with expanded public references and research notes.
- `src/lib/roads.ts`: types, formatting, filtering, and totals.
- `src/index.css`: Tailwind theme, responsive layout, and transitions.
- `worker/index.ts`: runtime config API and asset handling.
- `.dev.vars.example`: local configuration template.

## Data

References were reviewed on 9 October 2026, prioritising the ten entries without costs. NZTA project pages, investment cases, maps and updates were added across all 35 entries, with selected status and timeline corrections. The surviving 34-page National 2023 policy is preserved unmodified in `public/sources/national-transport-for-the-future-2023.pdf`, with source and SHA-256 recorded alongside it. Policy amounts were checked against page 32, corrected where mismatched, and removed where unsupported; rates require a matching verified length. These remain historical estimates, not current approved budgets. See [policy costing audit](docs/policy-costing-audit-2026-10-09.md). See [research notes](docs/project-research-2026-10-09.md) for scope matches and unresolved costs. Headline totals exclude three explicitly overlapping entries. Costed length and blended cost per kilometre only use projects with both a cost and comparable length. Costs mix estimates, allocations, and packages and do not represent a complete programme budget. All figures are NZD. Map coordinates and corridor lines are approximate.

Cloudflare references: [local environment variables](https://developers.cloudflare.com/workers/local-development/environment-variables/), [static asset bindings](https://developers.cloudflare.com/workers/static-assets/binding/), and [Worker routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/).
