import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlanState {
  // Selecciones de comidas
  selecciones: Record<string, boolean>;
  toggleSeleccion: (key: string) => void;
  clearSelecciones: () => void;
  
  // Día activo
  diaActivo: string;
  setDiaActivo: (dia: string) => void;
  
  // Momentos en edición
  momentosEnEdicion: Record<string, boolean>;
  setMomentoEnEdicion: (momento: string, value: boolean) => void;
  toggleMomentoEnEdicion: (momento: string) => void;
  resetMomentosEnEdicion: () => void;
  
  // Momentos colapsados
  momentosColapsados: Record<string, boolean>;
  setMomentoColapsado: (momento: string, value: boolean) => void;
  toggleMomentoColapsado: (momento: string) => void;
  resetMomentosColapsados: () => void;
  
  // Lista de compras checks
  comprasCheck: Record<string, boolean>;
  toggleCompraCheck: (key: string) => void;
  setCompraCheck: (key: string, value: boolean) => void;
  clearComprasCheck: () => void;
  
  // Perfil activo
  perfilActivo: 'el' | 'ella' | 'ambos' | null;
  setPerfilActivo: (perfil: 'el' | 'ella' | 'ambos' | null) => void;
  
  // Subtab para modo ambos
  ambosSubTab: 'el' | 'ella';
  setAmbosSubTab: (tab: 'el' | 'ella') => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      // Selecciones
      selecciones: {},
      toggleSeleccion: (key: string) => {
        set((state) => ({
          selecciones: { ...state.selecciones, [key]: !state.selecciones[key] }
        }));
      },
      clearSelecciones: () => set({ selecciones: {} }),
      
      // Día activo
      diaActivo: 'Lunes',
      setDiaActivo: (dia: string) => set({ diaActivo: dia }),
      
      // Momentos en edición
      momentosEnEdicion: {},
      setMomentoEnEdicion: (momento: string, value: boolean) => {
        set((state) => ({
          momentosEnEdicion: { ...state.momentosEnEdicion, [momento]: value }
        }));
      },
      toggleMomentoEnEdicion: (momento: string) => {
        set((state) => ({
          momentosEnEdicion: { 
            ...state.momentosEnEdicion, 
            [momento]: !state.momentosEnEdicion[momento] 
          }
        }));
      },
      resetMomentosEnEdicion: () => set({ momentosEnEdicion: {} }),
      
      // Momentos colapsados
      momentosColapsados: {},
      setMomentoColapsado: (momento: string, value: boolean) => {
        set((state) => ({
          momentosColapsados: { ...state.momentosColapsados, [momento]: value }
        }));
      },
      toggleMomentoColapsado: (momento: string) => {
        set((state) => ({
          momentosColapsados: { 
            ...state.momentosColapsados, 
            [momento]: !state.momentosColapsados[momento] 
          }
        }));
      },
      resetMomentosColapsados: () => set({ momentosColapsados: {} }),
      
      // Compras check
      comprasCheck: {},
      toggleCompraCheck: (key: string) => {
        set((state) => ({
          comprasCheck: { ...state.comprasCheck, [key]: !state.comprasCheck[key] }
        }));
      },
      setCompraCheck: (key: string, value: boolean) => {
        set((state) => ({
          comprasCheck: { ...state.comprasCheck, [key]: value }
        }));
      },
      clearComprasCheck: () => set({ comprasCheck: {} }),
      
      // Perfil activo
      perfilActivo: null,
      setPerfilActivo: (perfil) => set({ perfilActivo: perfil }),
      
      // Ambos subtab
      ambosSubTab: 'el',
      setAmbosSubTab: (tab) => set({ ambosSubTab: tab }),
    }),
    {
      name: 'plan-storage',
      partialize: (state) => ({
        selecciones: state.selecciones,
        diaActivo: state.diaActivo,
        comprasCheck: state.comprasCheck,
        perfilActivo: state.perfilActivo,
      }),
    }
  )
);
