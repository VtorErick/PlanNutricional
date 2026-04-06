import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface QuestionnaireState {
  // Target profile
  targetProfile: 'el' | 'ella' | 'ambos';
  setTargetProfile: (target: 'el' | 'ella' | 'ambos') => void;
  
  // Step index
  stepIdx: number;
  setStepIdx: (idx: number | ((prev: number) => number)) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetStep: () => void;
  
  // El data
  el: Record<string, unknown>;
  setEl: (data: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void;
  updateEl: (key: string, value: unknown) => void;
  
  // Ella data
  ella: Record<string, unknown>;
  setElla: (data: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void;
  updateElla: (key: string, value: unknown) => void;
  
  // Portion mode
  portionMode: 'auto' | 'manual';
  setPortionMode: (mode: 'auto' | 'manual') => void;
  
  // Manual portions
  manualPortions: Record<string, Record<string, number>>;
  setManualPortions: (portions: Record<string, Record<string, number>> | ((prev: Record<string, Record<string, number>>) => Record<string, Record<string, number>>)) => void;
  updateManualPortion: (momento: string, grupo: string, value: number) => void;
  
  // Additional notes
  additionalNotes: string;
  setAdditionalNotes: (notes: string | ((prev: string) => string)) => void;
  
  // Generation state
  generationLoading: boolean;
  setGenerationLoading: (loading: boolean) => void;
  generationError: string;
  setGenerationError: (error: string) => void;
  lastGeneratedData: unknown;
  setLastGeneratedData: (data: unknown) => void;
  
  // Reset all
  resetAll: () => void;
}

const defaultEl = {
  age: '',
  currentWeightKg: '70',
  heightCm: '165',
  targetWeightKg: '',
  objectives: [],
  objectiveTimeline: '12 sem',
  diagnostics: '',
  allergies: '',
  medications: '',
  intolerances: '',
  digestiveSymptoms: '',
  favoriteFoods: '',
  dislikedFoods: '',
  favoriteCuisineStyles: '',
  cookingTime: '',
  activityLevel: 'Moderado',
  wakeTime: '',
  sleepTime: '',
  trainingFrequency: ''
};

const defaultElla = {
  age: '',
  currentWeightKg: '60',
  heightCm: '160',
  targetWeightKg: '',
  objectives: [],
  objectiveTimeline: '12 sem',
  diagnostics: '',
  allergies: '',
  medications: '',
  intolerances: '',
  digestiveSymptoms: '',
  favoriteFoods: '',
  dislikedFoods: '',
  favoriteCuisineStyles: '',
  cookingTime: '',
  activityLevel: 'Moderado',
  wakeTime: '',
  sleepTime: '',
  trainingFrequency: ''
};

export const useQuestionnaireStore = create<QuestionnaireState>()(
  persist(
    (set, get) => ({
      targetProfile: 'ambos',
      setTargetProfile: (target) => set({ targetProfile: target }),
      
      stepIdx: 0,
      setStepIdx: (idx) => set((state) => ({ 
        stepIdx: typeof idx === 'function' ? idx(state.stepIdx) : idx 
      })),
      nextStep: () => set((state) => ({ stepIdx: state.stepIdx + 1 })),
      prevStep: () => set((state) => ({ stepIdx: Math.max(0, state.stepIdx - 1) })),
      resetStep: () => set({ stepIdx: 0 }),
      
      el: defaultEl,
      setEl: (data) => set((state) => ({ 
        el: typeof data === 'function' ? (data as (prev: Record<string, unknown>) => Record<string, unknown>)(state.el) : data 
      })),
      updateEl: (key, value) => {
        set((state) => ({ el: { ...state.el, [key]: value } }));
      },
      
      ella: defaultElla,
      setElla: (data) => set((state) => ({ 
        ella: typeof data === 'function' ? (data as (prev: Record<string, unknown>) => Record<string, unknown>)(state.ella) : data 
      })),
      updateElla: (key, value) => {
        set((state) => ({ ella: { ...state.ella, [key]: value } }));
      },
      
      portionMode: 'auto',
      setPortionMode: (mode) => set({ portionMode: mode }),
      
      manualPortions: {},
      setManualPortions: (portions) => set((state) => ({ 
        manualPortions: typeof portions === 'function' 
          ? (portions as (prev: Record<string, Record<string, number>>) => Record<string, Record<string, number>>)(state.manualPortions)
          : portions 
      })),
      updateManualPortion: (momento, grupo, value) => {
        set((state) => ({
          manualPortions: {
            ...state.manualPortions,
            [momento]: { ...state.manualPortions[momento], [grupo]: value }
          }
        }));
      },
      
      additionalNotes: '',
      setAdditionalNotes: (notes) => set((state) => ({ 
        additionalNotes: typeof notes === 'function' 
          ? (notes as (prev: string) => string)(state.additionalNotes)
          : notes 
      })),
      
      generationLoading: false,
      setGenerationLoading: (loading) => set({ generationLoading: loading }),
      generationError: '',
      setGenerationError: (error) => set({ generationError: error }),
      lastGeneratedData: null,
      setLastGeneratedData: (data) => set({ lastGeneratedData: data }),
      
      resetAll: () => set({
        targetProfile: 'ambos',
        stepIdx: 0,
        el: defaultEl,
        ella: defaultElla,
        portionMode: 'auto',
        manualPortions: {},
        additionalNotes: '',
        generationLoading: false,
        generationError: '',
        lastGeneratedData: null,
      }),
    }),
    {
      name: 'questionnaire-storage',
      partialize: (state) => ({
        el: state.el,
        ella: state.ella,
        portionMode: state.portionMode,
        manualPortions: state.manualPortions,
      }),
    }
  )
);
