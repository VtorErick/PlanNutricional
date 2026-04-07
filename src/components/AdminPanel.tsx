import React, { useRef } from 'react';
import {
  Upload,
  FileText,
  FileJson,
  Trash2,
  ToggleLeft,
  ToggleRight,
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

  const bgGradient = themeColor === 'blue' ? 'from-blue-50 to-indigo-50' : 'from-rose-50 to-pink-50';
  const textColor = themeColor === 'blue' ? 'text-blue-700' : 'text-rose-700';
  const titleColor = themeColor === 'blue' ? 'text-blue-900' : 'text-rose-900';
  const borderColor = themeColor === 'blue' ? 'border-blue-200' : 'border-rose-200';
  const softBadgeColor = themeColor === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700';
  const btnColor = themeColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700';
  const activeColor = themeColor === 'blue' ? 'text-blue-600' : 'text-rose-600';

  return (
    <div
      className={`p-4 sm:p-5 rounded-[24px] border ${borderColor} bg-gradient-to-br ${bgGradient} dark:from-slate-950 dark:to-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 relative overflow-hidden`}
    >
      {isCustomAvailable && dataVersion === 'custom' && (
        <>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/40 dark:bg-slate-900/50 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-white/20 dark:bg-slate-900/35 rounded-full blur-xl pointer-events-none" />
        </>
      )}

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-black text-lg sm:text-xl ${titleColor} leading-tight`}>
              {title}
            </h3>

            {isCustomAvailable && dataVersion === 'custom' && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-white dark:bg-slate-950 px-2 py-1 rounded-full shadow-sm text-emerald-600 dark:text-emerald-300 font-bold tracking-wide uppercase">
                <CheckCircle2 className="w-3 h-3" />
                Personalizado
              </span>
            )}
          </div>

          <p className={`text-xs sm:text-sm mt-1 ${textColor} dark:text-slate-300 opacity-80`}>
            Administra la version original o personalizada de este plan.
          </p>
        </div>

        {isCustomAvailable && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-900 transition-colors flex-shrink-0"
            title="Eliminar version personalizada"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative z-10 flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              void handlePdfDownload();
            }}
            className="flex items-center justify-center gap-2 py-3 px-3 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-100 transition active:scale-95 shadow-sm"
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm leading-tight text-center font-semibold">
              Imprime tu plan en PDF
            </span>
          </button>

          <button
            onClick={handleJsonDownload}
            className="flex items-center justify-center gap-2 py-3 px-3 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-100 transition active:scale-95 shadow-sm"
          >
            <FileJson className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm leading-tight text-center font-semibold">
              Exporta tu plan
            </span>
          </button>
        </div>

        <div className="h-px bg-slate-200/60 dark:bg-slate-800 w-full my-1" />

        {isCustomAvailable ? (
          <div className="p-3 sm:p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-100">
                  Version activa
                </p>
                <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Cambia entre la version original y la personalizada.
                </p>
              </div>

              <button
                onClick={() =>
                  setDataVersion(dataVersion === 'original' ? 'custom' : 'original')
                }
                className={`w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 rounded-2xl px-3 py-2.5 sm:p-0 font-bold text-sm transition-colors ${
                  dataVersion === 'custom' ? `${activeColor} dark:text-indigo-200` : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <span className={dataVersion === 'original' ? 'text-slate-700 dark:text-slate-100' : ''}>
                  Original
                </span>

                {dataVersion === 'custom' ? (
                  <ToggleRight className={`w-7 h-7 ${activeColor} flex-shrink-0`} />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                )}

                <span
                  className={`${dataVersion === 'custom' ? `${activeColor} dark:text-indigo-200` : 'text-slate-500 dark:text-slate-300'} whitespace-nowrap`}
                >
                  Personalizada
                </span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                Actual:
                <span className={dataVersion === 'custom' ? `${activeColor} dark:text-indigo-200` : 'text-slate-700 dark:text-slate-100'}>
                  {dataVersion === 'custom' ? 'Personalizada' : 'Original'}
                </span>
              </span>

              {isCustomAvailable && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${softBadgeColor}`}>
                  Archivo personalizado disponible
                </span>
              )}
            </div>
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept=".json,.txt"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 ${btnColor} text-white rounded-2xl font-bold transition shadow-md active:scale-95`}
            >
              <Upload className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm leading-tight text-center">Importa tu plan</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
