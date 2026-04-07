import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChefHat, FileText, Moon, Sun } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { downloadDaySelectionPdf, downloadDietPdf } from '../../services/pdfService';

export default function Header() {
  const [showPdfMenu, setShowPdfMenu] = React.useState(false);
  const pdfMenuRef = React.useRef<HTMLDivElement | null>(null);

  const {
    setPerfilActivo: setActiveProfile,
    perfilActivo: activeProfile,
    setDiaActivo: setActiveDay,
    setTab: setActiveTab,
    perfilesData: profilesData,
    diaActivo: activeDay,
    selecciones: selections,
    ac: accentColors,
    isDarkMode,
    setIsDarkMode,
  } = useDiet();

  React.useEffect(() => {
    if (!showPdfMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (pdfMenuRef.current?.contains(target)) return;
      setShowPdfMenu(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showPdfMenu]);

  const handleDownloadDayPdf = React.useCallback(() => {
    if (!activeProfile) return;

    if (activeProfile === 'ambos') {
      downloadDaySelectionPdf(
        activeDay,
        [
          { perfilData: profilesData.el, color: [37, 99, 235], planObj: profilesData.el.plan, perfilId: 'el' },
          { perfilData: profilesData.ella, color: [225, 29, 72], planObj: profilesData.ella.plan, perfilId: 'ella' },
        ],
        selections
      );
      return;
    }

    const isElla = activeProfile === 'ella';
    downloadDaySelectionPdf(
      activeDay,
      [
        {
          perfilData: profilesData[activeProfile],
          color: isElla ? [225, 29, 72] : [37, 99, 235],
          planObj: profilesData[activeProfile].plan,
          perfilId: activeProfile,
        },
      ],
      selections
    );
  }, [activeProfile, activeDay, profilesData, selections]);

  const handleDownloadFullPlanPdf = React.useCallback(() => {
    if (!activeProfile) return;

    if (activeProfile === 'ambos') {
      downloadDietPdf(profilesData.el, profilesData.el.plan, false);
      downloadDietPdf(profilesData.ella, profilesData.ella.plan, true);
      return;
    }

    downloadDietPdf(
      profilesData[activeProfile],
      profilesData[activeProfile].plan,
      activeProfile === 'ella'
    );
  }, [activeProfile, profilesData]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`sticky top-0 z-50 backdrop-blur-xl border-b shadow-[0_6px_20px_rgba(15,23,42,0.06)] ${
        isDarkMode
          ? 'bg-slate-950/95 border-slate-800'
          : 'bg-white/95 border-slate-200/60'
      }`}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setActiveProfile(null)}
            className="p-2.5 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all flex-shrink-0 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-200" />
          </button>

          <div
            className={`hidden sm:flex w-9 h-9 rounded-2xl bg-gradient-to-br ${accentColors.bgGradient} items-center justify-center shadow-sm`}
          >
            <ChefHat className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 relative" ref={pdfMenuRef}>
          <button
            type="button"
            onClick={() => setIsDarkMode((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold transition-colors ${
              isDarkMode
                ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden sm:inline">{isDarkMode ? 'Claro' : 'Oscuro'}</span>
          </button>

          <button
            onClick={() => setShowPdfMenu((value) => !value)}
            data-testid="header-pdf-button"
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all ${accentColors.border} ${accentColors.bgLight} ${accentColors.text}`}
            title="Descargar PDF"
          >
            <FileText className="w-4 h-4" />
            <span className="text-xs font-bold">PDF</span>
          </button>

          {showPdfMenu && (
            <div
              className={`absolute top-12 right-0 z-50 w-48 rounded-2xl border shadow-xl p-1.5 ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-950'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <button
                onClick={() => {
                  handleDownloadDayPdf();
                  setShowPdfMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${
                  isDarkMode
                    ? 'text-slate-100 hover:bg-slate-800'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                PDF del día
              </button>
              <button
                onClick={() => {
                  handleDownloadFullPlanPdf();
                  setShowPdfMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${
                  isDarkMode
                    ? 'text-slate-100 hover:bg-slate-800'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                PDF plan completo
              </button>
            </div>
          )}

          {(['el', 'ella', 'ambos'] as const).map((profileId) => {
            const isActive = activeProfile === profileId;

            return (
              <button
                key={profileId}
                onClick={() => {
                  setActiveProfile(profileId);
                  setActiveDay('Lunes');
                  setActiveTab('plan');
                }}
                data-testid={`header-profile-${profileId}`}
                className={`
                  px-3 py-1.5 sm:px-3.5 sm:py-2
                  rounded-2xl
                  text-[11px] sm:text-xs font-bold
                  transition-all duration-300
                  whitespace-nowrap
                  border
                  ${
                    isActive
                      ? `${accentColors.btnActive} shadow-sm scale-[1.03] border-transparent`
                      : accentColors.btnInactive
                  }
                `}
              >
                {profileId === 'ambos' ? 'Ambos' : profilesData[profileId]?.nombre || profileId}
              </button>
            );
          })}
        </div>
      </div>
    </motion.header>
  );
}
