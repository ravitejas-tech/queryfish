# queryfish.dev

The source for [queryfish.dev](https://queryfish.dev). It's a React Router app styled with Tailwind.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # output goes to build/
npm run typecheck
```

The page content lives in `app/pages/`, and each page's title and meta tags are in the matching file under
`app/routes/`. If you change something on the docs page, check whether the main [README](../README.md) says the same
thing and update both.
