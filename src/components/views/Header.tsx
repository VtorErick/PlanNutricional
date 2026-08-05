import React from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, FileText, Leaf, Moon, Settings, Sparkles, Sun } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { getProfileLabel } from '../../utils/profileLabels';

export default function Header() {
  const [showPdfMenu, setShowPdfMenu] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const pdfMenuRef = React.useRef<HTMLDivElement | null>(null);
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null);

  const {
    setPerfilActivo: setActiveProfile,
    setTab,
    perfilActivo: activeProfile,
    tab: activeTab,
    perfilesData: profilesData,
    profileLabels,
    diaActivo: activeDay,
    selecciones: selections,
    ac: accentColors,
    isDarkMode,
    setIsDarkMode,
    notify,
    setShowAdmin: setIsAdminOpen,
  } = useDiet();

  const menuProfileLabel = (profileId: 'el' | 'ella' | 'ambos') =>
    profileId === 'ambos' ? 'Ambos' : getProfileLabel(profileLabels, profileId);
  const activeProfileLabel = activeProfile ? menuProfileLabel(activeProfile) : 'Perfil';
  const profileOptions = (['el', 'ella', 'ambos'] as const).map((profileId) => ({
    id: profileId,
    label: menuProfileLabel(profileId),
  }));

  const profileDot: Record<string, string> = {
    el: 'bg-ocean-500',
    ella: 'bg-coral-500',
    ambos: 'bg-pine-600',
  };

  React.useEffect(() => {
    if (!showPdfMenu && !showProfileMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (pdfMenuRef.current?.contains(target) || profileMenuRef.current?.contains(target)) return;
      setShowPdfMenu(false);
      setShowProfileMenu(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showPdfMenu, showProfileMenu]);

  const handleDownloadDayPdf = React.useCallback(async () => {
    if (!activeProfile) return;
    try {
      const { downloadDaySelectionPdf } = await import('../../services/pdfService');

      if (activeProfile === 'ambos') {
        downloadDaySelectionPdf(
          activeDay,
          [
            { perfilData: profilesData.el, color: [33, 80, 196], planObj: profilesData.el.plan, perfilId: 'el' },
            { perfilData: profilesData.ella, color: [192, 34, 68], planObj: profilesData.ella.plan, perfilId: 'ella' },
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
            color: isElla ? [192, 34, 68] : [33, 80, 196],
            planObj: profilesData[activeProfile].plan,
            perfilId: activeProfile,
          },
        ],
        selections
      );
    } catch (error: any) {
      await notify('Error al exportar PDF', error?.message || 'No fue posible generar el PDF del día.');
    }
  }, [activeProfile, activeDay, notify, profilesData, selections]);

  const handleDownloadFullPlanPdf = React.useCallback(async () => {
    if (!activeProfile) return;
    try {
      const { downloadCombinedDietPdf, downloadDietPdf } = await import('../../services/pdfService');

      if (activeProfile === 'ambos') {
        downloadCombinedDietPdf([
          { perfilData: profilesData.el, planObj: profilesData.el.plan, isVA: false },
          { perfilData: profilesData.ella, planObj: profilesData.ella.plan, isVA: true },
        ]);
        return;
      }

      downloadDietPdf(
        profilesData[activeProfile],
        profilesData[activeProfile].plan,
        activeProfile === 'ella'
      );
    } catch (error: any) {
      await notify('Error al exportar PDF', error?.message || 'No fue posible generar el plan completo en PDF.');
    }
  }, [activeProfile, notify, profilesData]);

  const iconButtonClass = `inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition active:scale-90 ${
    isDarkMode
      ? 'border-ink-700 bg-ink-900 text-cream-200 hover:bg-ink-800'
      : 'border-cream-200 bg-white text-ink-500 hover:bg-cream-100 hover:text-ink-700'
  }`;

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`sticky top-0 z-50 w-full overflow-x-clip border-b backdrop-blur-xl ${
        isDarkMode
          ? 'border-ink-700/70 bg-ink-950/85'
          : 'border-cream-200/70 bg-cream-50/85'
      }`}
    >
      <div className="mx-auto max-w-7xl px-3 py-2.5 min-[380px]:px-4 sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          {/* Left: Logo and Profile */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Logo */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setTab('inicio')}
                data-testid="header-home-button"
                aria-label="Ir a Inicio"
                title="Ir a Inicio"
              className="group relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-ink-950 text-white shadow-sm transition hover:bg-ink-800 active:scale-95 sm:h-11 sm:w-11"
            >
                <Leaf className="h-5 w-5 -rotate-12 text-apricot-300 transition-transform group-hover:rotate-0" strokeWidth={2.4} />
                <Sparkles className="absolute right-1.5 top-1.5 h-2.5 w-2.5 text-white/85" strokeWidth={2.5} />
              </button>
              <div className="min-w-0 hidden min-[420px]:block">
                <p className="font-display text-[15px] sm:text-base font-bold leading-none text-ink-900 dark:text-cream-100">
                  Plan Nutricional
                </p>
                <p className="mt-1 hidden text-xs font-semibold uppercase tracking-[0.16em] text-ink-400 dark:text-ink-400 sm:block">
                  Tu plan diario
                </p>
              </div>
            </div>

            {/* Profile dropdown */}
            <div className="relative flex-shrink-0" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu((value) => !value);
                  setShowPdfMenu(false);
                }}
                data-testid="header-profile-menu-button"
                aria-expanded={showProfileMenu}
                className={`flex h-10 items-center gap-1.5 rounded-full border pl-3 pr-2.5 text-xs font-bold transition active:scale-[0.97] min-[380px]:h-11 min-[380px]:gap-2 min-[380px]:pl-3.5 min-[380px]:pr-3 sm:text-sm ${
                  isDarkMode
                    ? 'border-ink-700 bg-ink-900 text-cream-100 hover:bg-ink-800'
                    : 'border-cream-200 bg-white text-ink-700 hover:bg-cream-100 shadow-soft'
                }`}
              >
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${profileDot[activeProfile || 'ambos']}`} />
                <span className="max-w-[72px] min-[380px]:max-w-[96px] sm:max-w-[120px] truncate">{activeProfileLabel}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 flex-shrink-0 text-ink-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                />
              </button>

            {showProfileMenu ? (
              <div
                className="surface-raised absolute left-0 top-12 z-[80] w-44 border border-[var(--ui-border)] p-1.5"
              >
                {profileOptions.map((profile) => {
                  const isActive = activeProfile === profile.id;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => {
                        setActiveProfile(profile.id);
                        setShowProfileMenu(false);
                      }}
                      data-testid={`header-profile-${profile.id}`}
                      className={`flex h-10 w-full items-center justify-between rounded-2xl px-3 text-sm font-bold transition ${
                        isActive
                          ? `${accentColors.bgLight} ${accentColors.text}`
                          : isDarkMode
                            ? 'text-cream-200 hover:bg-ink-800'
                            : 'text-ink-600 hover:bg-cream-100'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className={`h-1.5 w-1.5 rounded-full ${profileDot[profile.id]}`} />
                        {profile.label}
                      </span>
                      {isActive ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          </div>

          {/* Right: Theme, PDF, Settings buttons */}
          <div className="flex items-center gap-1.5 min-[380px]:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={iconButtonClass}
              aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* La descarga sólo aparece donde el plan es el contexto principal. */}
            {activeTab === 'plan' ? <div className="relative flex flex-shrink-0 items-center" ref={pdfMenuRef}>
              <button
                onClick={() => {
                  setShowPdfMenu((value) => !value);
                  setShowProfileMenu(false);
                }}
                data-testid="header-pdf-button"
                className={iconButtonClass}
                title="Descargar plan"
              >
                <FileText className="w-4 h-4" />
              </button>

              {showPdfMenu && (
                <div
                  className="surface-raised absolute right-0 top-11 z-50 w-48 border border-[var(--ui-border)] p-1.5"
                >
                  <button
                    onClick={() => {
                      void handleDownloadDayPdf();
                      setShowPdfMenu(false);
                    }}
                    aria-label="Menu de hoy"
                    className={`w-full text-left px-3 py-2.5 rounded-2xl text-xs font-bold ${
                      isDarkMode
                        ? 'text-cream-100 hover:bg-ink-800'
                        : 'text-ink-600 hover:bg-cream-100'
                    }`}
                  >
                    Menú de hoy
                  </button>
                  <button
                    onClick={() => {
                      void handleDownloadFullPlanPdf();
                      setShowPdfMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-2xl text-xs font-bold ${
                      isDarkMode
                        ? 'text-cream-100 hover:bg-ink-800'
                        : 'text-ink-600 hover:bg-cream-100'
                    }`}
                  >
                    Plan completo
                  </button>
                </div>
              )}
            </div> : null}

            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              data-testid="header-settings-button"
              className={iconButtonClass}
              aria-label="Configuración"
              title="Configuración"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
