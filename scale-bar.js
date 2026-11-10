// Choose a readable 1–2–5 interval and express its length in an appropriate unit.
export function scaleLength(mmPerPixel, targetPixels) {
  const target = mmPerPixel * targetPixels;
  const decade = 10 ** Math.floor(Math.log10(target));
  const multiplier = target >= 5 * decade ? 5 : target >= 2 * decade ? 2 : 1;
  const mm = multiplier * decade;
  const [unit, mmPerUnit] = mm >= 10 ? ['cm', 10] : mm >= 1 ? ['mm', 1] : mm >= .001 ? ['µm', .001] : ['nm', .000001];
  return { pixels: mm / mmPerPixel, label: `${Number((mm / mmPerUnit).toPrecision(3))} ${unit}` };
}

export function renderScaleBar(bar, mmPerPixel, targetPixels, approximate = false) {
  if (!(mmPerPixel > 0) || !Number.isFinite(mmPerPixel)) return;
  const { pixels, label } = scaleLength(mmPerPixel, targetPixels);
  const text = approximate ? `≈ ${label}` : label;
  if (bar.lastElementChild.textContent !== text) bar.lastElementChild.textContent = text;
  const width = `${pixels.toFixed(1)}px`;
  if (bar.style.getPropertyValue('--scale-width') !== width) bar.style.setProperty('--scale-width', width);
  if (bar.classList.contains('hidden')) bar.classList.remove('hidden');
}
