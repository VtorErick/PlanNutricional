import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import type { QuestionnairePayload, QuestionnairePersonInput, TargetProfile } from '../types/questionnaire';
import { ProfileSwitcher } from './ProfileSwitcher';
import { showAppAlert } from '../utils/appDialogs';

const DEFAULT_MOMENTS = [
  { key: 'desayuno', label: 'Desayuno', hora: '08:00' },
  { key: 'colacion_am', label: 'Colacion AM', hora: '11:00' },
  { key: 'comida', label: 'Comida', hora: '15:00' },
  { key: 'colacion_pm', label: 'Colacion PM', hora: '18:00' },
  { key: 'cena', label: 'Cena', hora: '21:00' },
];

const STEPS = [
  { key: 'target', label: 'Objetivo' },
  { key: 'profile', label: 'Perfil' },
  { key: 'lifestyle', label: 'Habitos' },
  { key: 'notes', label: 'Notas' },
] as const;

const INTEGER_FIELDS: Array<keyof QuestionnairePersonInput> = ['age', 'heightCm'];
const DECIMAL_FIELDS: Array<keyof QuestionnairePersonInput> = [
  'currentWeightKg',
  'targetWeightKg',
  'bodyFatPercentage',
];

function sanitizeNumericInput(value: string, allowDecimal = false) {
  if (!allowDecimal) {
    return value.replace(/\D/g, '');
  }

  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const [integerPart = '', ...decimalParts] = normalized.split('.');
  return decimalParts.length > 0 ? `${integerPart}.${decimalParts.join('')}` : integerPart;
}

function emptyPerson(): QuestionnairePersonInput {
  return {
    age: '',
    currentWeightKg: '',
    heightCm: '',
    targetWeightKg: '',
    bodyFatPercentage: '',
    objectives: '',
    diagnostics: '',
    medications: '',
    allergies: '',
    favoriteFoods: '',
    dislikedFoods: '',
    preferredProteins: '',
    activityLevel: 'Moderado',
    wakeTime: '',
    sleepTime: '',
    trainingSchedule: '',
    cookingTime: '',
  };
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  multiline = false,
  helper,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  multiline?: boolean;
  helper?: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        multiline={multiline}
        value={value}
        onChangeText={onChangeText}
      />
      {helper ? <Text style={styles.fieldHelper}>{helper}</Text> : null}
    </View>
  );
}

function PersonSection({
  title,
  value,
  onChange,
}: {
  title: string;
  value: QuestionnairePersonInput;
  onChange: (next: QuestionnairePersonInput) => void;
}) {
  const update = (key: keyof QuestionnairePersonInput, nextValue: string) => {
    let sanitizedValue = nextValue;

    if (INTEGER_FIELDS.includes(key)) {
      sanitizedValue = sanitizeNumericInput(nextValue, false);
    } else if (DECIMAL_FIELDS.includes(key)) {
      sanitizedValue = sanitizeNumericInput(nextValue, true);
    }

    onChange({
      ...value,
      [key]: sanitizedValue,
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.groupTitle}>Antropometria</Text>
      <InputField label="Edad" placeholder="Ej. 30" keyboardType="number-pad" value={value.age} onChangeText={(text) => update('age', text)} />
      <InputField label="Peso actual (kg)" placeholder="Ej. 82.5" keyboardType="decimal-pad" value={value.currentWeightKg} onChangeText={(text) => update('currentWeightKg', text)} />
      <InputField label="Estatura (cm)" placeholder="Ej. 178" keyboardType="number-pad" value={value.heightCm} onChangeText={(text) => update('heightCm', text)} />
      <InputField label="Peso meta (kg)" placeholder="Ej. 75" keyboardType="decimal-pad" value={value.targetWeightKg} onChangeText={(text) => update('targetWeightKg', text)} />
      <InputField label="% grasa corporal" placeholder="Opcional" keyboardType="decimal-pad" value={value.bodyFatPercentage} onChangeText={(text) => update('bodyFatPercentage', text)} helper="Solo captura números; el formulario filtra texto inválido." />

      <Text style={styles.groupTitle}>Objetivo y salud</Text>
      <InputField label="Objetivos" placeholder="Pérdida de grasa, recomposición, digestión, adherencia..." value={value.objectives} onChangeText={(text) => update('objectives', text)} multiline />
      <InputField label="Diagnósticos o contexto clínico" placeholder="SOP, gastritis, hipertensión, resistencia a la insulina..." value={value.diagnostics} onChangeText={(text) => update('diagnostics', text)} multiline />
      <InputField label="Medicamentos o tratamiento actual" placeholder="Metformina, anticonceptivos, levotiroxina..." value={value.medications} onChangeText={(text) => update('medications', text)} multiline />
      <InputField label="Alergias o intolerancias" placeholder="Lácteos, mariscos, gluten..." value={value.allergies} onChangeText={(text) => update('allergies', text)} multiline />

      <Text style={styles.groupTitle}>Preferencias</Text>
      <InputField label="Comidas favoritas" placeholder="Tacos, bowls, avena, sándwiches..." value={value.favoriteFoods} onChangeText={(text) => update('favoriteFoods', text)} multiline />
      <InputField label="Comidas a evitar" placeholder="Vísceras, atún, brócoli, lácteos..." value={value.dislikedFoods} onChangeText={(text) => update('dislikedFoods', text)} multiline />
      <InputField label="Proteínas preferidas" placeholder="Pollo, huevo, res magra, yogur griego..." value={value.preferredProteins} onChangeText={(text) => update('preferredProteins', text)} multiline />

      <Text style={styles.groupTitle}>Rutina</Text>
      <InputField label="Nivel de actividad" placeholder="Sedentario, ligero, moderado, alto" value={value.activityLevel} onChangeText={(text) => update('activityLevel', text)} />
      <InputField label="Hora de despertar" placeholder="Ej. 06:30" value={value.wakeTime} onChangeText={(text) => update('wakeTime', text)} />
      <InputField label="Hora de dormir" placeholder="Ej. 22:45" value={value.sleepTime} onChangeText={(text) => update('sleepTime', text)} />
      <InputField label="Horario de entrenamiento" placeholder="Lun-Mie-Vie 7 pm o spinning sábados" value={value.trainingSchedule} onChangeText={(text) => update('trainingSchedule', text)} multiline />
      <InputField label="Tiempo disponible para cocinar" placeholder="15 min, meal prep domingo, cocina básica..." value={value.cookingTime} onChangeText={(text) => update('cookingTime', text)} />
    </View>
  );
}

interface Props {
  initialTargetProfile: TargetProfile;
  loading?: boolean;
  errorMessage?: string;
  aiEnabled?: boolean;
  onSubmit: (payload: QuestionnairePayload) => Promise<void>;
}

export default function NutritionQuestionnaire({
  initialTargetProfile,
  loading = false,
  errorMessage,
  aiEnabled = true,
  onSubmit,
}: Props) {
  const [targetProfile, setTargetProfile] = useState<TargetProfile>(initialTargetProfile);
  const [el, setEl] = useState<QuestionnairePersonInput>(emptyPerson());
  const [ella, setElla] = useState<QuestionnairePersonInput>(emptyPerson());
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [assessmentName, setAssessmentName] = useState('');
  const [assessmentPdf, setAssessmentPdf] = useState<QuestionnairePayload['assessmentReportPdf'] | undefined>();
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const activeLabel = useMemo(() => {
    if (targetProfile === 'ambos') return 'Ambos perfiles';
    return targetProfile === 'el' ? 'Perfil El' : 'Perfil Ella';
  }, [targetProfile]);

  const pickAssessmentPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];

      if (asset.size && asset.size > 5 * 1024 * 1024) {
        await showAppAlert('PDF demasiado grande', 'El reporte corporal debe pesar maximo 5 MB.');
        return;
      }

      try {
        setAttachmentLoading(true);
        const dataBase64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        setAssessmentName(asset.name);
        setAssessmentPdf({
          name: asset.name,
          mimeType: 'application/pdf',
          dataBase64,
        });
      } catch (error) {
        console.warn('Failed to read assessment PDF:', error);
        setAssessmentName('');
        setAssessmentPdf(undefined);
        await showAppAlert('No se pudo adjuntar el PDF', 'Intenta seleccionar el archivo nuevamente.');
      } finally {
        setAttachmentLoading(false);
      }
    }
  };

  const handleGenerate = async () => {
    const payload: QuestionnairePayload = {
      targetProfile,
      profileToUpdate: targetProfile,
      portionMode: 'auto',
      planConfig: {
        mealsPerDay: '5',
        selectedMoments: DEFAULT_MOMENTS,
        manualPortions: {},
        additionalNotes,
      },
      ...(targetProfile === 'el' || targetProfile === 'ambos' ? { el } : {}),
      ...(targetProfile === 'ella' || targetProfile === 'ambos' ? { ella } : {}),
      ...(assessmentPdf ? { assessmentReportPdf: assessmentPdf } : {}),
    };

    await onSubmit(payload);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.stepRow}>
        {STEPS.map((step, index) => {
          const active = index === stepIndex;
          const done = index < stepIndex;
          return (
            <Pressable
              key={step.key}
              onPress={() => setStepIndex(index)}
              style={[styles.stepChip, active && styles.stepChipActive, done && styles.stepChipDone]}
            >
              <Text style={[styles.stepText, active && styles.stepTextActive]}>
                {index + 1}. {step.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {stepIndex === 0 ? (
        <View style={styles.card}>
          <Text style={styles.label}>Perfil objetivo</Text>
          <Text style={styles.sectionTitle}>¿Para quién se va a generar el plan?</Text>
          <ProfileSwitcher value={targetProfile} onChange={(value) => setTargetProfile(value as TargetProfile)} />
          <Text style={styles.helper}>Se generará plan para: {activeLabel}</Text>
          <Text style={styles.helper}>
            Usa ambos cuando quieras coordinar dos perfiles con la misma estructura semanal y una compra más alineada.
          </Text>
        </View>
      ) : null}

      {stepIndex === 1 ? (
        <>
          {(targetProfile === 'el' || targetProfile === 'ambos') ? (
            <PersonSection title="Perfil El" value={el} onChange={setEl} />
          ) : null}

          {(targetProfile === 'ella' || targetProfile === 'ambos') ? (
            <PersonSection title="Perfil Ella" value={ella} onChange={setElla} />
          ) : null}
        </>
      ) : null}

      {stepIndex === 2 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Configuración operativa</Text>
          <Text style={styles.helper}>
            La app usa 5 momentos por defecto y adapta el prompt con horarios, actividad y tiempos de cocina capturados arriba.
          </Text>
          <Text style={styles.helper}>
            En esta versión móvil el foco es capturar mejor el contexto clínico y operativo. Las porciones manuales finas siguen pendientes de paridad completa.
          </Text>
        </View>
      ) : null}

      {stepIndex === 3 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notas adicionales</Text>
          <InputField
            label="Indicaciones extra para la IA"
            placeholder="Preferencias, tiempos de cocina, objetivos especificos..."
            multiline
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
          />
          <Pressable style={styles.ghostButton} onPress={pickAssessmentPdf}>
            <Text style={styles.ghostButtonText}>
              {attachmentLoading
                ? 'Adjuntando PDF...'
                : assessmentName
                  ? `PDF seleccionado: ${assessmentName}`
                  : 'Seleccionar reporte corporal PDF'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.footerRow}>
        <Pressable
          style={[styles.secondaryButton, stepIndex === 0 && styles.buttonDisabled]}
          disabled={stepIndex === 0}
          onPress={() => setStepIndex((current) => Math.max(0, current - 1))}
        >
          <Text style={styles.secondaryButtonText}>Anterior</Text>
        </Pressable>
        {stepIndex < STEPS.length - 1 ? (
          <Pressable style={styles.primaryButton} onPress={() => setStepIndex((current) => Math.min(STEPS.length - 1, current + 1))}>
            <Text style={styles.primaryButtonText}>Siguiente</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.primaryButton, (!aiEnabled || loading || attachmentLoading) && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={!aiEnabled || loading || attachmentLoading}
          >
            <Text style={styles.primaryButtonText}>
              {!aiEnabled ? 'Configura backend para IA' : loading ? 'Generando...' : 'Generar plan IA'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e2e8f0',
  },
  stepChipActive: {
    backgroundColor: '#2563eb',
  },
  stepChipDone: {
    backgroundColor: '#bfdbfe',
  },
  stepText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  stepTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#d8e2ef',
    gap: 14,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  groupTitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748b',
  },
  helper: {
    color: '#475569',
    lineHeight: 20,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#c7d3e3',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fbff',
    color: '#0f172a',
    fontSize: 16,
  },
  multiline: {
    minHeight: 108,
    textAlignVertical: 'top',
  },
  fieldHelper: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
  },
  ghostButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  ghostButtonText: {
    color: '#334155',
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 6,
  },
  errorTitle: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  errorText: {
    color: '#991b1b',
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
});
