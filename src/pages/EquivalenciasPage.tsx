import { motion } from 'framer-motion';
import { useAppContext } from '../AppContext';
import EquivalenciasCard from '../components/EquivalenciasCard';

export function EquivalenciasPage() {
  const {
    isAmbos,
    perfilesData,
    equivalenciasData,
    equivalencias,
    accentColors,
    ac,
    ambosSubTab,
    setAmbosSubTab,
  } = useAppContext();

  return (
    <motion.div
      key="equivalencias"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="space-y-6"
    >
      {isAmbos ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Combinar equivalencias de ambos perfiles en una sola lista compacta */}
          {equivalenciasData.el.map((eq, idx) => (
            <EquivalenciasCard
              key={'el-' + idx}
              equivalencia={eq}
              delay={idx * 0.03}
              compact
              accentClasses={{
                ...ac,
                bgLight: 'bg-blue-50',
                text: 'text-blue-600',
                tagBg: 'bg-blue-100',
                tagText: 'text-blue-700',
              }}
            />
          ))}
          {equivalenciasData.ella.map((eq, idx) => (
            <EquivalenciasCard
              key={'ella-' + idx}
              equivalencia={eq}
              delay={(equivalenciasData.el.length + idx) * 0.03}
              compact
              accentClasses={{
                ...ac,
                bgLight: 'bg-rose-50',
                text: 'text-rose-600',
                tagBg: 'bg-rose-100',
                tagText: 'text-rose-700',
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {equivalencias.map((eq, idx) => (
            <EquivalenciasCard
              key={idx}
              equivalencia={eq}
              delay={idx * 0.05}
              accentClasses={accentColors}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
