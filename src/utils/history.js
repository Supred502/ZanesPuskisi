export function replaceUrlPreserveScroll(nextUrl) {
  try {
    const x = window.scrollX;
    const y = window.scrollY;
    window.history.replaceState(null, "", nextUrl);
    // Some browsers may adjust scroll on hash changes; restore next frame.
    requestAnimationFrame(() => {
      try {
        window.scrollTo(x, y);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
}

export function pushUrlPreserveScroll(nextUrl) {
  try {
    const x = window.scrollX;
    const y = window.scrollY;
    window.history.pushState(null, "", nextUrl);
    requestAnimationFrame(() => {
      try {
        window.scrollTo(x, y);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
}
