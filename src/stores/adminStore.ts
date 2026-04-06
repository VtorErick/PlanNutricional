import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminState {
  // Gemini API
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  
  // Gemini Model
  geminiModel: string;
  setGeminiModel: (model: string) => void;
  
  // Data versions
  dataVersions: { el: 'original' | 'custom'; ella: 'original' | 'custom' };
  setDataVersion: (profile: 'el' | 'ella', version: 'original' | 'custom') => void;
  
  // Custom data
  customData: Record<string, unknown>;
  setCustomData: (data: Record<string, unknown>) => void;
  updateCustomData: (profile: 'el' | 'ella', data: unknown) => void;
}

const validModels = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.5-pro',
  'gemini-2.5-flash'
];

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // Gemini API
      geminiApiKey: '',
      setGeminiApiKey: (key: string) => set({ geminiApiKey: key }),
      
      // Gemini Model
      geminiModel: 'gemini-2.5-flash',
      setGeminiModel: (model: string) => {
        if (validModels.includes(model)) {
          set({ geminiModel: model });
        }
      },
      
      // Data versions
      dataVersions: { el: 'original', ella: 'original' },
      setDataVersion: (profile, version) => {
        set((state) => ({
          dataVersions: { ...state.dataVersions, [profile]: version }
        }));
      },
      
      // Custom data
      customData: {},
      setCustomData: (data) => set({ customData: data }),
      updateCustomData: (profile, data) => {
        set((state) => ({
          customData: { ...state.customData, [profile]: data }
        }));
      },
    }),
    {
      name: 'admin-storage',
    }
  )
);
