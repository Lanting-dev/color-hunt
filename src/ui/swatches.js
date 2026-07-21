// A palette strip: swatch widths proportional to each color's weight.

export function swatchStrip(palette) {
  const strip = document.createElement('div');
  strip.className = 'swatches';
  for (const c of palette) {
    const s = document.createElement('div');
    s.className = 'swatch';
    s.style.background = c.hex;
    s.style.flexGrow = String(Math.max(0.14, c.weight));
    s.title = c.hex;
    strip.appendChild(s);
  }
  return strip;
}
