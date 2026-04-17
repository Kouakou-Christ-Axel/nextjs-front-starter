import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

type Listener = (event: { matches: boolean }) => void;

function mockMatchMedia(initialMatches: boolean) {
  const listeners: Listener[] = [];
  const mql = {
    matches: initialMatches,
    media: '(max-width: 768px)',
    addEventListener: vi.fn((type: string, l: Listener) => {
      if (type === 'change') listeners.push(l);
    }),
    removeEventListener: vi.fn((type: string, l: Listener) => {
      if (type === 'change') {
        const idx = listeners.indexOf(l);
        if (idx >= 0) listeners.splice(idx, 1);
      }
    }),
    dispatchChange(newMatches: boolean) {
      mql.matches = newMatches;
      listeners.forEach((l) => l({ matches: newMatches }));
    },
  };
  window.matchMedia = vi
    .fn()
    .mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return mql;
}

describe('useIsMobile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when the media query initially matches', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns false when the media query does not match', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('updates when the media query change event fires', () => {
    const mql = mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());

    act(() => mql.dispatchChange(true));
    expect(result.current).toBe(true);

    act(() => mql.dispatchChange(false));
    expect(result.current).toBe(false);
  });

  it('removes the change listener on unmount', () => {
    const mql = mockMatchMedia(false);
    const { unmount } = renderHook(() => useIsMobile());

    expect(mql.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('uses a custom breakpoint query when provided', () => {
    const mql = mockMatchMedia(true);
    renderHook(() => useIsMobile('(max-width: 1024px)'));
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 1024px)');
    expect(mql.addEventListener).toHaveBeenCalled();
  });
});
