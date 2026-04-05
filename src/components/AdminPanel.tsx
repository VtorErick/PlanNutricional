import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, FileText, FileJson, Trash2, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react';
import { downloadJsonFile, downloadDietPdf, parseJsonToData } from '../dataManager';

interface AdminPanelProps {
  perfilId: 'vo' | 'va';
  title: string;
  themeColor: 'blue' | 'rose';
  rawDataText: string;
  customData: any;
  setCustomData: React.Dispatch<React.SetStateAction<any>>;
  dataVersion: 'original' | 'custom';
  setDataVersion: (ver: 'original' | 'custom') => void;
  perfilesDataObj: any; // the original data to use for PDF generating if original is chosen
  notify: (title: string, message: string) => Promise<void>;
  confirmAction: (title: string, message: string) => Promise<boolean>;
}

export default function AdminPanel({
  perfilId, title, themeColor, rawDataText,
  customData, setCustomData, dataVersion, setDataVersion, perfilesDataObj, notify, confirmAction
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
        const parsed = parseJsonToData(text, perfilId.toUpperCase() as 'VO'|'VA');
        
        setCustomData((prev: any) => ({ ...prev, [perfilId]: parsed }));
        setDataVersion('custom');
        await notify('Importación completada', `¡Datos de ${title} cargados exitosamente!`);
      } catch (err: any) {
        await notify('Error al importar archivo', "Error al cargar archivo: " + err.message);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleDelete = async () => {
    const accepted = await confirmAction(
      'Eliminar versión personalizada',
      `¿Estás seguro de eliminar los datos personalizados de ${title}?`
    );
    if (accepted) {
      setCustomData((prev: any) => {
        const newD = { ...prev };
        delete newD[perfilId];
        return newD;
      });
      setDataVersion('original');
    }
  };

  const handlePdfDownload = () => {
    const dataToUse = dataVersion === 'custom' && customData[perfilId] 
      ? customData[perfilId][`perfil${perfilId.toUpperCase()}`] 
      : perfilesDataObj;
    // For original the plan is embedded as perfilesDataObj.plan
    // For custom, parseTsToData returns it as planVO / planVA 
    const planToUse = dataVersion === 'custom' && customData[perfilId] 
      ? customData[perfilId][`plan${perfilId.toUpperCase()}`] 
      : perfilesDataObj.plan;
      
    downloadDietPdf(dataToUse, planToUse, perfilId === 'va');
  };

  const handleJsonDownload = () => {
    if (dataVersion === 'custom' && customData[perfilId]) {
      // Descargar datos personalizados (IA o subidos manualmente)
      const dataToDownload = {
        [`perfil${perfilId.toUpperCase()}`]: customData[perfilId][`perfil${perfilId.toUpperCase()}`],
        [`equivalencias${perfilId.toUpperCase()}`]: customData[perfilId][`equivalencias${perfilId.toUpperCase()}`],
        [`plan${perfilId.toUpperCase()}`]: customData[perfilId][`plan${perfilId.toUpperCase()}`]
      };
      downloadJsonFile(`perfil-${perfilId}-personalizado.json`, JSON.stringify(dataToDownload, null, 2));
    } else {
      // Descargar datos originales
      downloadJsonFile(`perfil-${perfilId}.json`, rawDataText);
    }
  };

  const bgGradient = themeColor === 'blue' ? 'from-blue-50 to-indigo-50' : 'from-rose-50 to-pink-50';
  const textColor = themeColor === 'blue' ? 'text-blue-700' : 'text-rose-700';
  const borderColor = themeColor === 'blue' ? 'border-blue-200' : 'border-rose-200';
  const btnColor = themeColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700';
  const activeColor = themeColor === 'blue' ? 'text-blue-600' : 'text-rose-600';

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border ${borderColor} bg-gradient-to-br ${bgGradient} shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 relative overflow-hidden`}>
      {isCustomAvailable && dataVersion === 'custom' && (
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/40 rounded-full blur-xl pointer-events-none" />
      )}
      
      <div className="flex justify-between items-center gap-2 z-10">
        <h3 className={`font-bold text-xl sm:text-lg ${textColor} flex items-center gap-2 flex-wrap`}>
          {title} 
          {isCustomAvailable && dataVersion === 'custom' && (
            <span className="flex items-center gap-1 text-[10px] bg-white px-2 py-1 rounded-full shadow-sm text-emerald-600 font-bold tracking-wide uppercase">
              <CheckCircle2 className="w-3 h-3" /> Personalizado
            </span>
          )}
        </h3>
        {isCustomAvailable && (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
              title="Eliminar versión personalizada"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 z-10">
        {/* Opciones de descarga */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button 
            onClick={handlePdfDownload}
            className="flex items-center justify-center gap-2 py-3 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 transition active:scale-95 shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm leading-tight text-center font-semibold">Imprime tu plan en PDF</span>
          </button>
          <button 
            onClick={handleJsonDownload}
            className="flex items-center justify-center gap-2 py-3 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 transition active:scale-95 shadow-sm"
          >
            <FileJson className="w-4 h-4" />
            <span className="text-sm leading-tight text-center font-semibold">Exporta tu plan</span>
          </button>
        </div>

        {/* Separador */}
        <div className="h-px bg-slate-200/60 w-full my-1" />

        {/* Opciones de carga */}
        {isCustomAvailable ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs sm:text-sm font-medium text-slate-600 shrink-0">Usar versión:</span>
            <button 
              onClick={() => setDataVersion(dataVersion === 'original' ? 'custom' : 'original')}
              className={`flex items-center justify-between sm:justify-end w-full sm:w-auto flex-wrap gap-1 sm:gap-2 font-bold text-sm transition-colors ${dataVersion === 'custom' ? activeColor : 'text-slate-400'}`}
            >
              <span className={dataVersion === 'original' ? 'text-slate-700' : ''}>Original</span>
              {dataVersion === 'custom' ? <ToggleRight className={`w-6 h-6 ${activeColor}`} /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
              <span className={`${dataVersion === 'custom' ? activeColor : ''} whitespace-nowrap`}>Personalizada</span>
            </button>
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
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 ${btnColor} text-white rounded-xl font-bold transition shadow-md active:scale-95`}
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm leading-tight text-center">Importa tu plan</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
