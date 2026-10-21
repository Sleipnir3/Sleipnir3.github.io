## Development

Use npm for all package management and scripts. Do not introduce other package managers (pnpm, yarn, bun).

When starting the dev server, use background mode:

```
npm run dev:bg
```

Manage the background server with `npm run dev:stop`, `npm run dev:status`, and `npm run dev:logs`.

Note: `--host 127.0.0.1` is required on this machine (IPv6 loopback is broken); the dev scripts already include it. Use http://127.0.0.1:4321/ to browse.

Common scripts: `npm run new "标题"` (create draft), `npm run publish "说明"` (commit & push).

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
