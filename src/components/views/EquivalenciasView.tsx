import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat } from 'lucide-react';
import EquivalenciasCard from '../EquivalenciasCard';
import { useDiet } from '../../context/DietContext';
import { getAccentColors } from '../../utils/theme';
import SectionBackdrop from './SectionBackdrop';

export default function EquivalenciasView() {
  const { perfilActivo, perfilesData, equivalenciasData, ac, isAmbos, isDarkMode } = useDiet();
  const [ambosSubTab, setAmbosSubTab] = useState<'el' | 'ella'>('el');
  const elAccent = getAccentColors('el', isDarkMode);
  const ellaAccent = getAccentColors('ella', isDarkMode);

  const equivalencias =
    perfilActivo && perfilActivo !== 'ambos'
      ? equivalenciasData[perfilActivo as 'el' | 'ella']
      : [];

  return (
    <motion.div
      key="equivalencias"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="space-y-5"
    >
      {isAmbos ? (
        <>
          <SectionBackdrop
            eyebrow="Equivalencias"
            title="Cambios rapidos sin perder estructura"
            description="Ten a mano sustituciones utiles para mover tu plan con flexibilidad y seguir dentro de la misma logica nutricional."
            imageSrc="/images/hero.png"
            accentGradientClass={ac.bgGradient}
            icon={Repeat}
            aside={(
              <div className="flex w-full rounded-2xl border border-white/14 bg-white/12 p-1 backdrop-blur-md sm:w-auto sm:min-w-[220px]">
                <button
                  onClick={() => setAmbosSubTab('el')}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                    ambosSubTab === 'el'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-white/72'
                  }`}
                >
                  {perfilesData.el.nombre}
                </button>
                <button
                  onClick={() => setAmbosSubTab('ella')}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                    ambosSubTab === 'ella'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-white/72'
                  }`}
                >
                  {perfilesData.ella.nombre}
                </button>
              </div>
            )}
            stats={[
              { label: perfilesData.el.nombre, value: `${equivalenciasData.el.length}` },
              { label: perfilesData.ella.nombre, value: `${equivalenciasData.ella.length}` },
            ]}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={`${ambosSubTab === 'el' ? 'block' : 'hidden lg:block'}`}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1 xl:grid-cols-2">
                {equivalenciasData.el.map((eq, idx) => (
                  <EquivalenciasCard
                    key={`el-${idx}`}
                    equivalencia={eq}
                    delay={idx * 0.05}
                    accentClasses={{ ...elAccent }}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            </div>

            <div className={`${ambosSubTab === 'ella' ? 'block' : 'hidden lg:block'}`}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1 xl:grid-cols-2">
                {equivalenciasData.ella.map((eq, idx) => (
                  <EquivalenciasCard
                    key={`ella-${idx}`}
                    equivalencia={eq}
                    delay={idx * 0.05}
                    accentClasses={{ ...ellaAccent }}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <SectionBackdrop
            eyebrow="Equivalencias"
            title={`Ajustes para ${perfilActivo === 'ella' ? perfilesData.ella.nombre : perfilesData.el.nombre}`}
            description="Sustituye alimentos con referencias claras para mantener la experiencia simple y el plan consistente."
            imageSrc="/images/hero.png"
            accentGradientClass={ac.bgGradient}
            icon={Repeat}
            stats={[
              { label: 'Opciones', value: `${equivalencias.length}` },
              { label: 'Perfil', value: perfilActivo === 'ella' ? perfilesData.ella.nombre : perfilesData.el.nombre },
            ]}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {equivalencias.map((eq, idx) => (
              <EquivalenciasCard
                key={idx}
                equivalencia={eq}
                delay={idx * 0.05}
                accentClasses={ac}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
