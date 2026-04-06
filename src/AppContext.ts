import { useOutletContext } from 'react-router';
import type { Profile, Equivalencia } from './data';

export interface AppContext {
  // Perfil y navegación
  perfilActivo: 'el' | 'ella' | 'ambos' | null;
  setPerfilActivo: (p: 'el' | 'ella' | 'ambos' | null) => void;
  isEl: boolean;
  isAmbos: boolean;
  
  // Datos de perfiles
  perfilesData: Record<string, Profile>;
  equivalenciasData: Record<string, Equivalencia[]>;
  perfil: Profile | null;
  perfilBase: Profile | null;
  equivalencias: Equivalencia[];
  
  // Día activo
  diaActivo: string;
  setDiaActivo: (d: string) => void;
  diasDisponibles: string[];
  
  // Tabs y navegación
  tab: 'plan' | 'equivalencias' | 'resumen' | 'compras';
  navigateToTab: (t: 'plan' | 'equivalencias' | 'resumen' | 'compras') => void;
  
  // Colores/accentos
  accentColors: {
    bg: string;
    bgLight: string;
    bgGradient: string;
    text: string;
    border: string;
    borderAccent: string;
    tagBg: string;
    tagText: string;
  };
  ac: {
    color500: string;
    bg: string;
    bgLight: string;
    bgGradient: string;
    bgGradientLight: string;
    text: string;
    textDark: string;
    border: string;
    borderAccent: string;
    tagBg: string;
    tagText: string;
    progressBg: string;
    progressFill: string;
    btnActive: string;
    btnInactive: string;
    dot: string;
    cardDone: string;
    cardPending: string;
    iconDone: string;
    iconPending: string;
    iconColorPending: string;
    momentoIconBgDone: string;
    momentoIconColorDone: string;
    momentoIconBgPending: string;
    momentoIconColorPending: string;
    headerBg: string;
  };
  
  // Subtabs para modo ambos
  ambosSubTab: 'el' | 'ella';
  setAmbosSubTab: (t: 'el' | 'ella') => void;
  
  // Selecciones de comidas
  selecciones: Record<string, boolean>;
  toggleSeleccion: (perfilId: string, dia: string, momento: string, nombre: string) => void;
  
  // Compras
  listaCompras: { ingrediente: string; usos: { texto: string; perfil: string }[] }[];
  comprasCheck: Record<string, boolean>;
  setComprasCheck: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  
  // Admin y cuestionario
  setShowAdmin: (show: boolean) => void;
  setShowQuestionnaire: (show: boolean) => void;
  setQuestionnaireTargetProfile: (target: 'el' | 'ella' | 'ambos') => void;
  navigate: (path: string) => void;
  
  // Progreso y momentos
  progresoDia: number;
  momentoCompletado: Record<string, boolean>;
  momentoCompletadoEl: Record<string, boolean>;
  momentoCompletadoElla: Record<string, boolean>;
  completadosCount: number;
  totalMomentosProgress: number;
  setProgressExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  progressExpanded: boolean;
  scrollToMomento: (momentoKey: string, isExpanded: boolean) => void;
  
  // Estados de edición y colapso
  momentosEnEdicion: Record<string, boolean>;
  setMomentosEnEdicion: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  momentosColapsados: Record<string, boolean>;
  setMomentosColapsados: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  mealSectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  
  // Funciones
  notify: (title: string, message: string) => Promise<void>;
  confirmAction: (title: string, message: string) => Promise<boolean>;
  handleDownloadDayPdf: () => void;
  
  // Admin
  adminTab: 'settings' | 'manual';
  setAdminTab: (t: 'settings' | 'manual') => void;
  closeAdmin: () => void;
  geminiApiKey: string;
  setGeminiApiKey: React.Dispatch<React.SetStateAction<string>>;
  geminiModel: string;
  setGeminiModel: (m: string) => void;
  rawData: Record<string, string>;
  customData: Record<string, string>;
  setCustomData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  dataVersions: Record<string, 'original' | 'custom'>;
  setDataVersions: React.Dispatch<React.SetStateAction<Record<string, 'original' | 'custom'>>>;
  origPerfilesData: Record<string, Profile>;
  
  // Ready states
  elReady: boolean;
  ellaReady: boolean;
  hasCustomPlan: boolean;
  
  // Utils
  getMomentMacroPortions: (profile: Profile, momentoKey: string) => { key: string; label: string; icon: string; cantidad: number }[];
  getNextMomentoKey: (momentoKey: string) => string | null;
  momentoIcons: Record<string, React.ComponentType<{ className?: string }>>;
}

export function useAppContext(): AppContext {
  return useOutletContext<AppContext>();
}
