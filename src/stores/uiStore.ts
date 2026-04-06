import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Progress bar
  progressExpanded: boolean;
  setProgressExpanded: (value: boolean) => void;
  toggleProgressExpanded: () => void;
  
  // Admin tab
  adminTab: 'settings' | 'manual';
  setAdminTab: (tab: 'settings' | 'manual') => void;
  
  // Main tab
  tab: 'plan' | 'equivalencias' | 'resumen' | 'compras';
  setTab: (tab: 'plan' | 'equivalencias' | 'resumen' | 'compras') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Progress bar
      progressExpanded: false,
      setProgressExpanded: (value: boolean) => set({ progressExpanded: value }),
      toggleProgressExpanded: () => set((state) => ({ 
        progressExpanded: !state.progressExpanded 
      })),
      
      // Admin tab
      adminTab: 'settings',
      setAdminTab: (tab) => set({ adminTab: tab }),
      
      // Main tab
      tab: 'plan',
      setTab: (tab) => set({ tab }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        adminTab: state.adminTab,
      }),
    }
  )
);
