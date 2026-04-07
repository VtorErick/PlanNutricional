import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChefHat, FileText } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { downloadDaySelectionPdf, downloadDietPdf } from '../../services/pdfService';

export default function Header() {
  const [showPdfMenu, setShowPdfMenu] = React.useState(false);
  const {
    setPerfilActivo,
    perfilActivo,
    setDiaActivo,
    setTab,
    perfilesData,
    diaActivo,
    selecciones,
    ac,
  } = useDiet();

  const handleDownloadDayPdf = React.useCallback(() => {
    if (!perfilActivo) return;

    if (perfilActivo === 'ambos') {
      downloadDaySelectionPdf(
        diaActivo,
        [
          { perfilData: perfilesData.el, color: [37, 99, 235], planObj: perfilesData.el.plan, perfilId: 'el' },
          { perfilData: perfilesData.ella, color: [225, 29, 72], planObj: perfilesData.ella.plan, perfilId: 'ella' },
        ],
        selecciones
      );
      return;
    }

    const isElla = perfilActivo === 'ella';
    downloadDaySelectionPdf(
      diaActivo,
      [
        {
          perfilData: perfilesData[perfilActivo],
          color: isElla ? [225, 29, 72] : [37, 99, 235],
          planObj: perfilesData[perfilActivo].plan,
          perfilId: perfilActivo,
        },
      ],
      selecciones
    );
  }, [perfilActivo, diaActivo, perfilesData, selecciones]);

  const handleDownloadFullPlanPdf = React.useCallback(() => {
    if (!perfilActivo) return;
    if (perfilActivo === 'ambos') {
      downloadDietPdf(perfilesData.el, perfilesData.el.plan, false);
      downloadDietPdf(perfilesData.ella, perfilesData.ella.plan, true);
      return;
    }
    downloadDietPdf(perfilesData[perfilActivo], perfilesData[perfilActivo].plan, perfilActivo === 'ella');
  }, [perfilActivo, perfilesData]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_6px_20px_rgba(15,23,42,0.06)]"
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        
        {/* LEFT */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setPerfilActivo(null)}
            className="p-2.5 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>

          {/* Logo (solo en sm+) */}
          <div
            className={`hidden sm:flex w-9 h-9 rounded-2xl bg-gradient-to-br ${ac.bgGradient} items-center justify-center shadow-sm`}
          >
            <ChefHat className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* RIGHT - perfiles */}
        <div className="flex items-center gap-1.5 sm:gap-2 relative">
          <button
            onClick={() => setShowPdfMenu((v) => !v)}
            className={`p-2 rounded-2xl border transition-all ${ac.border} ${ac.bgLight} ${ac.text}`}
            title="Descargar PDF"
          >
            <FileText className="w-4 h-4" />
          </button>

          {showPdfMenu && (
            <div className="absolute top-12 right-0 z-50 w-44 rounded-2xl border border-slate-200 bg-white shadow-xl p-1.5">
              <button
                onClick={() => {
                  handleDownloadDayPdf();
                  setShowPdfMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                PDF del día
              </button>
              <button
                onClick={() => {
                  handleDownloadFullPlanPdf();
                  setShowPdfMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                PDF plan completo
              </button>
            </div>
          )}

          {(['el', 'ella', 'ambos'] as const).map((p) => {
            const isActive = perfilActivo === p;

            return (
              <button
                key={p}
                onClick={() => {
                  setPerfilActivo(p);
                  setDiaActivo('Lunes');
                  setTab('plan');
                }}
                className={`
                  px-3 py-1.5 sm:px-3.5 sm:py-2
                  rounded-2xl
                  text-[11px] sm:text-xs font-bold
                  transition-all duration-300
                  whitespace-nowrap
                  border
                  ${
                    isActive
                      ? `${ac.btnActive} shadow-sm scale-[1.03] border-transparent`
                      : `${ac.btnInactive} border-slate-200 hover:bg-slate-100`
                  }
                `}
              >
                {p === 'ambos'
                  ? 'Ambos'
                  : perfilesData[p]?.nombre || p}
              </button>
            );
          })}
        </div>
      </div>
    </motion.header>
  );
}
