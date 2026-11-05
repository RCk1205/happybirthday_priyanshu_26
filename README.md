# PK Birthday — Flat Root Media Fix

This package fixes the asset-layout mismatch for the `happybirthday_priyanshu_26` GitHub repository.

## Required flat-root layout

Keep every file directly in the repository root:

- `index.html`
- `styles.css`
- `app.js`
- `favicon.svg`
- `birthday-surprise.mp3`
- `pk-formal.webp`
- `jnv-entrance.webp`
- `the-crew.webp`
- `pk-and-chou.webp`
- `the-evidence.webp`
- `blue-suit.webp`
- `blue-kurta.webp`
- `jnv-signboard.webp`

The HTML and JavaScript use these root-level filenames. There is intentionally no `assets/photos/` or `assets/audio/` directory in this package.

## Local preview

Run from this folder:

```powershell
py -m http.server 8000
```

Open `http://localhost:8000`.

## GitHub Pages

Upload the contents of this folder to the repository root, preserving the flat layout. If the repository already contains the same root-level media files, do not create nested `assets` folders. Commit the updated `index.html`, `app.js`, and `styles.css` together with any media files that are missing.

The sound is loaded by the native `<audio>` element from `birthday-surprise.mp3`. Browser playback remains subject to user gesture and device audio permissions.
