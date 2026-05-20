// src/lib/media-scroll.ts
// Smooth-scroll a media element so its center matches the visible area's center,
// accounting for the sticky header. No-op if the element is already fully visible.

export function scrollMediaIntoCenter(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const header = document.querySelector('.site-header') as HTMLElement | null;
  const headerH = header ? header.offsetHeight : 0;
  const visibleTop = headerH;
  const visibleBottom = window.innerHeight;

  // Already fully visible below the header? Don't scroll.
  if (rect.top >= visibleTop && rect.bottom <= visibleBottom) return;

  const elCenter = rect.top + window.scrollY + rect.height / 2;
  const visibleCenter = headerH + (window.innerHeight - headerH) / 2;
  const targetY = Math.max(0, elCenter - visibleCenter);

  window.scrollTo({ top: targetY, behavior: 'smooth' });
}
