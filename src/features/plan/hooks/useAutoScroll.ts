import { useCallback, useRef } from 'react';
import { useUIStore } from '../../../stores/uiStore';

export function useAutoScroll() {
  const mealSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { progressExpanded, setProgressExpanded } = useUIStore();

  const scrollToMomento = useCallback((momentoKey: string, shouldCollapseProgress: boolean = true) => {
    const doScroll = () => {
      const el = mealSectionRefs.current[momentoKey];
      if (!el) return;
      
      // Offset = solo header sticky (~56px) + margen (12px)
      const offset = 56 + 12;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    };

    if (shouldCollapseProgress && progressExpanded) {
      // Close expanded panel first and wait for the animation to finish
      setProgressExpanded(false);
      setTimeout(doScroll, 260); // 260ms delay to account for the 0.25s animation
    } else {
      doScroll();
    }
  }, [progressExpanded, setProgressExpanded]);

  const setRef = useCallback((momentoKey: string) => (el: HTMLDivElement | null) => {
    mealSectionRefs.current[momentoKey] = el;
  }, []);

  const getRef = useCallback((momentoKey: string) => {
    return mealSectionRefs.current[momentoKey];
  }, []);

  return {
    mealSectionRefs,
    scrollToMomento,
    setRef,
    getRef,
    progressExpanded,
    setProgressExpanded,
  };
}
