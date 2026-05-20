// src/lib/photoswipe.ts
// Initializes PhotoSwipe for every [data-pswp-gallery] container on the page.
//
// Markup contract:
//   <div data-pswp-gallery>
//     <a href="<full-image-src>" data-pswp-width? data-pswp-height? data-pswp-caption?>
//       <img src="<thumb>" alt="…" />
//     </a>
//     ...
//   </div>
//
// Width/height are optional — if missing we derive an aspect ratio from the
// visible thumb's naturalWidth/Height and assume a 1920px wide display.

import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

const initialized = new WeakSet<HTMLElement>();

export function initPhotoSwipe(root: ParentNode = document) {
  const galleries = root.querySelectorAll<HTMLElement>('[data-pswp-gallery]');
  galleries.forEach((gallery) => {
    if (initialized.has(gallery)) return;
    initialized.add(gallery);

    const lightbox = new PhotoSwipeLightbox({
      gallery,
      children: 'a[href]',
      pswpModule: () => import('photoswipe'),
      bgOpacity: 0.95,
      showHideAnimationType: 'fade',
      padding: { top: 24, bottom: 60, left: 16, right: 16 },
    });

    lightbox.addFilter('domItemData', (itemData, element) => {
      if (itemData.width && itemData.height) return itemData;
      const img = element.querySelector<HTMLImageElement>('img');
      if (img && img.naturalWidth && img.naturalHeight) {
        const ar = img.naturalWidth / img.naturalHeight;
        itemData.width = 1920;
        itemData.height = Math.round(1920 / ar);
      } else {
        itemData.width = 1920;
        itemData.height = 1080;
      }
      return itemData;
    });

    // Optional caption — read data-pswp-caption off the anchor
    lightbox.on('uiRegister', () => {
      lightbox.pswp?.ui?.registerElement({
        name: 'caption',
        order: 9,
        isButton: false,
        appendTo: 'root',
        html: '',
        onInit: (el) => {
          el.className = 'pswp__custom-caption';
          lightbox.pswp?.on('change', () => {
            const link = lightbox.pswp?.currSlide?.data?.element as HTMLAnchorElement | undefined;
            const cap = link?.getAttribute('data-pswp-caption') ?? '';
            el.innerHTML = cap;
            el.style.display = cap ? 'block' : 'none';
          });
        },
      });
    });

    lightbox.init();
  });
}

if (typeof window !== 'undefined') {
  const run = () => initPhotoSwipe();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
  // Hook for React islands to trigger a re-scan after they mount new galleries
  document.addEventListener('pswp:refresh', run);
}
