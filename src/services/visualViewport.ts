// iOS can shrink and pan the visual viewport while the fixed layout viewport stays in place.
export function trackVisualViewport() {
  const viewport = window.visualViewport;
  if (!viewport) return;

  const update = () => {
    const style = document.documentElement.style;
    if (viewport.scale === 1) {
      style.setProperty('--visible-height', `${viewport.height}px`);
      style.setProperty('--visible-top', `${viewport.offsetTop}px`);
    } else {
      style.removeProperty('--visible-height');
      style.removeProperty('--visible-top');
    }
  };

  viewport.addEventListener('resize', update);
  viewport.addEventListener('scroll', update);
  update();
}
