import React, { useRef } from 'react';
import {
  Upload,
  FileText,
  FileJson,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { buildExportData, downloadJsonFile, parseJsonToData } from '../dataManager';

interface AdminPanelProps {
  perfilId: 'el' | 'ella';
  title: string;
  themeColor: 'blue' | 'rose';
  rawDataText: string;
  customData: any;
  setCustomData: React.Dispatch<React.SetStateAction<any>>;
  dataVersion: 'original' | 'custom';
  setDataVersion: (ver: 'original' | 'custom') => void;
  perfilesDataObj: any;
  notify: (title: string, message: string) => Promise<void>;
  confirmAction: (title: string, message: string) => Promise<boolean>;
}

export default function AdminPanel({
  perfilId,
  title,
  themeColor,
  rawDataText,
  customData,
  setCustomData,
  dataVersion,
  setDataVersion,
  perfilesDataObj,
  notify,
  confirmAction,
}: AdminPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCustomAvailable = !!customData[perfilId];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseJsonToData(text, perfilId.toUpperCase() as 'EL' | 'ELLA');

        setCustomData((prev: any) => ({ ...prev, [perfilId]: parsed }));
        setDataVersion('custom');

        await notify('Importacion completada', `Datos de ${title} cargados exitosamente.`);
      } catch (err: any) {
        await notify('Error al importar archivo', 'Error al cargar archivo: ' + err.message);
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onerror = async () => {
      await notify('Error al importar archivo', 'No fue posible leer el archivo seleccionado.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  const handleDelete = async () => {
    const accepted = await confirmAction(
      'Eliminar version personalizada',
      `Estas seguro de eliminar los datos personalizados de ${title}?`
    );

    if (accepted) {
      setCustomData((prev: any) => {
        const newData = { ...prev };
        delete newData[perfilId];
        return newData;
      });

      setDataVersion('original');
    }
  };

  const handlePdfDownload = async () => {
    try {
      const { downloadDietPdf } = await import('../services/pdfService');
      const dataToUse =
        dataVersion === 'custom' && customData[perfilId]
          ? customData[perfilId][`perfil${perfilId.toUpperCase()}`]
          : perfilesDataObj;

      const planToUse =
        dataVersion === 'custom' && customData[perfilId]
          ? customData[perfilId][`plan${perfilId.toUpperCase()}`]
          : perfilesDataObj.plan;

      downloadDietPdf(dataToUse, planToUse, perfilId === 'ella');
    } catch (error: any) {
      await notify('Error al exportar PDF', error?.message || 'No fue posible generar el PDF.');
    }
  };

  const handleJsonDownload = async () => {
    try {
      if (dataVersion === 'custom' && customData[perfilId]) {
        const dataToDownload = buildExportData(
          customData[perfilId],
          perfilId.toUpperCase() as 'EL' | 'ELLA'
        );

        downloadJsonFile(
          `perfil-${perfilId}-personalizado.json`,
          JSON.stringify(dataToDownload, null, 2)
        );
      } else {
        downloadJsonFile(`perfil-${perfilId}.json`, rawDataText);
      }
    } catch (error: any) {
      await notify('Error al exportar archivo', error?.message || 'No fue posible descargar el archivo.');
    }
  };

  const accentBorder = themeColor === 'blue' ? 'border-l-ocean-500' : 'border-l-coral-500';
  const titleColor = themeColor === 'blue' ? 'text-ocean-700 dark:text-ocean-200' : 'text-coral-600 dark:text-coral-200';
  const softBadgeColor = themeColor === 'blue' ? 'bg-ocean-50 text-ocean-600 border-ocean-100' : 'bg-coral-50 text-coral-600 border-coral-100';
  const activeColor = themeColor === 'blue' ? 'bg-ocean-600 text-white border-ocean-600' : 'bg-coral-500 text-white border-coral-500';

  return (
    <div
      className={`p-4 rounded-[22px] border border-l-4 ${accentBorder} border-cream-200 bg-white dark:border-ink-700 dark:bg-ink-900 shadow-soft flex flex-col gap-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-display text-xl font-semibold ${titleColor} leading-tight`}>
              {title}
            </h3>

            {isCustomAvailable && dataVersion === 'custom' && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-pine-50 border border-pine-100 px-2 py-1 rounded-full text-pine-700 dark:bg-pine-950/40 dark:border-pine-900/50 dark:text-pine-300 font-bold tracking-wide uppercase">
                <CheckCircle2 className="w-3 h-3" />
                Personalizado
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm mt-1 text-ink-400 dark:text-ink-400">
            Administra la version original o personalizada de este plan.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="file"
          accept=".json,.txt"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-400 dark:text-ink-400 mb-2">
            Respaldo
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                void handlePdfDownload();
              }}
              data-testid={`admin-export-pdf-${perfilId}`}
              className="flex items-center justify-center gap-2 py-2.5 px-2 bg-cream-100 hover:bg-cream-200 dark:bg-ink-800 dark:hover:bg-ink-700 border border-cream-200 dark:border-ink-700 rounded-2xl text-ink-600 dark:text-cream-100 transition active:scale-95"
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm leading-tight text-center font-bold">
                PDF
              </span>
            </button>

            <button
              onClick={handleJsonDownload}
              data-testid={`admin-export-json-${perfilId}`}
              className="flex items-center justify-center gap-2 py-2.5 px-2 bg-cream-100 hover:bg-cream-200 dark:bg-ink-800 dark:hover:bg-ink-700 border border-cream-200 dark:border-ink-700 rounded-2xl text-ink-600 dark:text-cream-100 transition active:scale-95"
            >
              <FileJson className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm leading-tight text-center font-bold">
                JSON
              </span>
            </button>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-400 dark:text-ink-400 mb-2">
            Importacion
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-ink-900 hover:bg-ink-800 text-cream-50 rounded-full font-bold transition shadow-sm active:scale-95 dark:bg-cream-100 dark:text-ink-900 dark:hover:bg-cream-200"
          >
            <Upload className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm leading-tight text-center">Importar archivo personalizado</span>
          </button>
        </div>

        {isCustomAvailable ? (
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-3 dark:border-ink-700 dark:bg-ink-800/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-ink-700 dark:text-cream-100">Version activa</p>
                <p className="text-[11px] text-ink-400 dark:text-ink-400 mt-0.5">Cambia la fuente usada en la app.</p>
              </div>
              <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${softBadgeColor}`}>
                Archivo listo
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-full bg-white p-1 border border-cream-200 dark:bg-ink-900 dark:border-ink-700">
              <button
                type="button"
                onClick={() => setDataVersion('original')}
                className={`rounded-full px-3 py-2 text-sm font-bold transition active:scale-[0.98] ${
                  dataVersion === 'original'
                    ? activeColor
                    : 'text-ink-400 hover:bg-cream-100 dark:text-ink-300 dark:hover:bg-ink-800'
                }`}
              >
                Original
              </button>
              <button
                type="button"
                onClick={() => setDataVersion('custom')}
                className={`rounded-full px-3 py-2 text-sm font-bold transition active:scale-[0.98] ${
                  dataVersion === 'custom'
                    ? activeColor
                    : 'text-ink-400 hover:bg-cream-100 dark:text-ink-300 dark:hover:bg-ink-800'
                }`}
              >
                Personalizada
              </button>
            </div>

            <button
              onClick={handleDelete}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-full border border-coral-200 bg-white px-3 py-2.5 text-sm font-bold text-coral-600 transition hover:bg-coral-50 active:scale-95 dark:border-coral-900/60 dark:bg-ink-900 dark:text-coral-300 dark:hover:bg-coral-950/20"
              title="Eliminar version personalizada"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar personalizada
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
