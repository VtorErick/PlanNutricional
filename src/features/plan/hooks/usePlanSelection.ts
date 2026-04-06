import { useCallback, useMemo } from 'react';
import { usePlanStore } from '../../../stores/planStore';
import type { Profile } from '../../../data';

export function usePlanSelection(profile: Profile, perfilId: 'el' | 'ella') {
  const { 
    selecciones, 
    toggleSeleccion: storeToggleSeleccion, 
    diaActivo 
  } = usePlanStore();

  // Get selections for current day and profile
  const daySelections = useMemo(() => {
    const result: Record<string, boolean> = {};
    if (!profile?.plan?.[diaActivo]) return result;
    
    Object.entries(profile.plan[diaActivo]).forEach(([momento, comidas]) => {
      if (!Array.isArray(comidas)) return;
      comidas.forEach((comida: { nombre: string }) => {
        const key = `${perfilId}-${diaActivo}-${momento}-${comida.nombre}`;
        result[key] = selecciones[key] || false;
      });
    });
    return result;
  }, [selecciones, diaActivo, profile, perfilId]);

  // Check if a specific meal is selected
  const isSelected = useCallback((momento: string, nombre: string) => {
    const key = `${perfilId}-${diaActivo}-${momento}-${nombre}`;
    return selecciones[key] || false;
  }, [selecciones, diaActivo, perfilId]);

  // Check if a momento is completed (has any selection)
  const isMomentoCompleted = useCallback((momento: string) => {
    const comidas = profile?.plan?.[diaActivo]?.[momento] || [];
    return comidas.some((comida: { nombre: string }) => {
      const key = `${perfilId}-${diaActivo}-${momento}-${comida.nombre}`;
      return selecciones[key];
    });
  }, [selecciones, diaActivo, profile, perfilId]);

  // Get completed momentos for the day
  const completedMomentos = useMemo(() => {
    const result: Record<string, boolean> = {};
    if (!profile?.momentos) return result;
    
    profile.momentos.forEach((m) => {
      result[m.key] = isMomentoCompleted(m.key);
    });
    return result;
  }, [profile, isMomentoCompleted]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (!profile?.momentos?.length) return 0;
    const completed = Object.values(completedMomentos).filter(Boolean).length;
    return Math.round((completed / profile.momentos.length) * 100);
  }, [completedMomentos, profile]);

  // Toggle selection with auto-deselect of other meals in same momento
  const toggleSeleccion = useCallback((momento: string, nombre: string) => {
    const key = `${perfilId}-${diaActivo}-${momento}-${nombre}`;
    const comidas = profile?.plan?.[diaActivo]?.[momento] || [];
    const isCurrentlySelected = selecciones[key];
    
    // If selecting (not deselecting), first deselect other meals in same momento
    if (!isCurrentlySelected) {
      comidas.forEach((comida: { nombre: string }) => {
        const otherKey = `${perfilId}-${diaActivo}-${momento}-${comida.nombre}`;
        if (otherKey !== key && selecciones[otherKey]) {
          storeToggleSeleccion(otherKey);
        }
      });
    }
    
    // Toggle the current meal
    storeToggleSeleccion(key);
  }, [selecciones, diaActivo, profile, perfilId, storeToggleSeleccion]);

  // Get selected meal for a momento
  const getSelectedMeal = useCallback((momento: string) => {
    const comidas = profile?.plan?.[diaActivo]?.[momento] || [];
    return comidas.find((comida: { nombre: string }) => {
      const key = `${perfilId}-${diaActivo}-${momento}-${comida.nombre}`;
      return selecciones[key];
    });
  }, [selecciones, diaActivo, profile, perfilId]);

  return {
    selecciones,
    daySelections,
    isSelected,
    isMomentoCompleted,
    completedMomentos,
    progressPercentage,
    toggleSeleccion,
    getSelectedMeal,
  };
}
