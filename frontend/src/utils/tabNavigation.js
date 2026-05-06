const HORIZONTAL_TAB_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End']);

export const getNextHorizontalTabIndex = (length, currentIndex, key) => {
  if (!length || currentIndex < 0 || !HORIZONTAL_TAB_KEYS.has(key)) {
    return null;
  }

  if (key === 'ArrowRight') {
    return (currentIndex + 1) % length;
  }

  if (key === 'ArrowLeft') {
    return (currentIndex - 1 + length) % length;
  }

  if (key === 'Home') {
    return 0;
  }

  if (key === 'End') {
    return length - 1;
  }

  return null;
};

export const focusElementById = (elementId) => {
  if (!elementId || typeof window === 'undefined') {
    return;
  }

  window.requestAnimationFrame(() => {
    document.getElementById(elementId)?.focus();
  });
};
