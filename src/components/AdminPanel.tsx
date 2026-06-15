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

  const accentBorder = themeColor === 'blue' ? 'border-l-blue-500' : 'border-l-rose-500';
  const titleColor = themeColor === 'blue' ? 'text-blue-900 dark:text-blue-100' : 'text-rose-900 dark:text-rose-100';
  const softBadgeColor = themeColor === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-rose-50 text-rose-700 border-rose-100';
  const activeColor = themeColor === 'blue' ? 'bg-blue-600 text-white border-blue-600' : 'bg-rose-600 text-white border-rose-600';

  return (
    <div
      className={`p-4 rounded-2xl border border-l-4 ${accentBorder} border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 shadow-sm flex flex-col gap-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-black text-lg ${titleColor} leading-tight`}>
              {title}
            </h3>

            {isCustomAvailable && dataVersion === 'custom' && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300 font-bold tracking-wide uppercase">
                <CheckCircle2 className="w-3 h-3" />
                Personalizado
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm mt-1 text-slate-500 dark:text-slate-400">
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
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 mb-2">
            Respaldo
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                void handlePdfDownload();
              }}
              data-testid={`admin-export-pdf-${perfilId}`}
              className="flex items-center justify-center gap-2 py-2.5 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-100 transition active:scale-95"
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm leading-tight text-center font-semibold">
                PDF
              </span>
            </button>

            <button
              onClick={handleJsonDownload}
              data-testid={`admin-export-json-${perfilId}`}
              className="flex items-center justify-center gap-2 py-2.5 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-100 transition active:scale-95"
            >
              <FileJson className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm leading-tight text-center font-semibold">
                JSON
              </span>
            </button>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 mb-2">
            Importacion
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition shadow-sm active:scale-95 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <Upload className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm leading-tight text-center">Importar archivo personalizado</span>
          </button>
        </div>

        {isCustomAvailable ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-100">Version activa</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Cambia la fuente usada en la app.</p>
              </div>
              <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${softBadgeColor}`}>
                Archivo listo
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-white p-1 border border-slate-200 dark:bg-slate-950 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDataVersion('original')}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition active:scale-[0.98] ${
                  dataVersion === 'original'
                    ? activeColor
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
                }`}
              >
                Original
              </button>
              <button
                type="button"
                onClick={() => setDataVersion('custom')}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition active:scale-[0.98] ${
                  dataVersion === 'custom'
                    ? activeColor
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
                }`}
              >
                Personalizada
              </button>
            </div>

            <button
              onClick={handleDelete}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 active:scale-95 dark:border-rose-900/60 dark:bg-slate-950 dark:text-rose-300 dark:hover:bg-rose-950/20"
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
