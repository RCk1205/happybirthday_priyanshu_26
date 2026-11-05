# For PK — Nine Years, One Whole Universe

This is the final audio-and-wish fix for the immersive PK birthday website.

## Files and deployment

Keep the project structure intact:

- `index.html`
- `styles.css`
- `app.js`
- `assets/favicon.svg`
- `assets/photos/` — enhanced original photographs
- `assets/audio/birthday-surprise.mp3` — party boom followed immediately by Jaane Kyun

For GitHub Pages, upload the contents of this folder to the repository root, preserving the `assets/` subfolders. Remove the old `style.css`, `script.js`, and the previous root-level image/audio copies so the old site files cannot be served by mistake.

## Local preview

From this folder, run:

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000`.

The previous audio loader used `fetch()` to turn the MP3 into a Blob. Chromium can block `fetch()` for a local `file://` page, leaving the sound indicator locked. This version uses the browser's native `<audio src>` loading path with `preload="auto"`; it works with a normal local web server and is compatible with static hosting.

## Cake, wish and sound sequence

1. The MP3 is preloaded before the wish control is unlocked. The button reports `SOUND READY` rather than remaining labelled `SOUND LOCKED`.
2. The visitor taps the cake or the wish button. A single `audio.play()` call is made directly inside that tap handler, so browser user-gesture audio restrictions are respected.
3. The combined soundtrack begins with the supplied party boom (1.15 seconds). The first 2 seconds of silent lead-in were removed from the Jaane Kyun source, so the music follows the boom without the previous silent gap.
4. The candles light and remain lit through the party boom and the continuing song. After a 5.2-second minimum wish window, the button changes to “BLOW OUT THE CANDLES”. The flames and celebration change only after PK explicitly taps that button. There is no automatic candle extinguishing timer.
5. The song loops from its own beginning after the first playthrough; the party boom is not replayed on each loop.

No website can override a device mute switch, OS-level audio restriction, or a visitor explicitly pausing the soundtrack. If playback is rejected by the browser, the wish sequence resets and displays a retry message instead of pretending that sound played.
