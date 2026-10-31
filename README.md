# Piksel

A small browser pixel editor for sprites, icons, and patterns, with local saving and crisp PNG export.

[Open editor](https://atmajadesna.github.io/piksel/)

![Piksel editor](docs/screenshot.jpg)

## Features

- Canvas sizes of 16, 24, 32, and 48 pixels.
- Pencil, eraser, flood fill, line, and eyedropper tools.
- Horizontal mirroring and optional grid.
- Undo and redo with up to 60 snapshots.
- Local gallery for the latest 18 saved drawings.
- PNG export at 1×, 8×, and 16× without smoothing.

## Shortcuts

- `B`, `E`, `G`, `L`, `I`: pencil, eraser, fill, line, eyedropper.
- `X`: horizontal mirror; `K`: grid.
- `Ctrl/Cmd + Z`: undo; `Ctrl/Cmd + Shift + Z`: redo.
- `Ctrl/Cmd + S`: save to the local gallery.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. No build step is required. Fonts load from Google Fonts.

## Implementation

Pixel data is rendered at native canvas resolution and enlarged with pixelated CSS rendering. A separate preview layer displays line previews. Flood fill uses an explicit stack, lines use Bresenham's algorithm, and PNG export disables image smoothing.

## Limitations

Drawings are stored in the browser, not backed up to a server. Export important work before clearing site data or changing devices. The canvas is primarily a pointer/touch drawing surface; keyboard tool shortcuts do not make every drawing operation keyboard accessible.

## License

Application code: [MIT](LICENSE). Artwork created in the editor belongs to its creator.
