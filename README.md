# For PK — Nine Years, One Whole Universe

## Corrected UTF-8 build

This package restores the original Unicode text, Hindi birthday letter, emoji, decorative symbols, and interface arrows in `index.html` and `app.js`.

The CSS was not changed.

## Repository layout

This build matches the current flat-root GitHub repository. Keep these files together at the repository root:

- `index.html`
- `app.js`
- `styles.css`
- `favicon.svg`
- `birthday-surprise.mp3`
- `the-crew.webp`
- `pk-formal.webp`
- `pk-and-chou.webp`
- `blue-kurta.webp`
- `blue-suit.webp`
- `jnv-entrance.webp`
- `jnv-signboard.webp`
- `the-evidence.webp`

Do not move media files into `assets/` subfolders for this build.

## Deploy only the two corrected files

Replace `index.html` and `app.js` in the GitHub repository root. Keep `styles.css`, all image files, `birthday-surprise.mp3`, and `favicon.svg` unchanged.

Commit message suggestion: `Restore UTF-8 text, symbols and Hindi letter`.

## Local preview

Run from this folder:

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000`.

`index.html` declares UTF-8. The repaired text is now saved as UTF-8 bytes, including the Devanagari letter. If a particular device lacks a Devanagari font, its browser should use its installed system fallback.
