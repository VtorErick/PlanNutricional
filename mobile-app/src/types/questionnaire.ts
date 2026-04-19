export type TargetProfile = 'el' | 'ella' | 'ambos';
export type PortionMode = 'manual' | 'auto';

export interface QuestionnairePersonInput {
  age: string;
  currentWeightKg: string;
  heightCm: string;
  targetWeightKg: string;
  bodyFatPercentage: string;
  objectives: string;
  diagnostics: string;
  medications: string;
  allergies: string;
  favoriteFoods: string;
  dislikedFoods: string;
  preferredProteins: string;
  activityLevel: string;
  wakeTime: string;
  sleepTime: string;
  trainingSchedule: string;
  cookingTime: string;
}

export interface QuestionnairePayload {
  targetProfile: TargetProfile;
  profileToUpdate: TargetProfile;
  portionMode: PortionMode;
  planConfig: {
    mealsPerDay: string;
    selectedMoments: { key: string; label: string; hora: string }[];
    manualPortions: Record<string, Record<string, number>>;
    additionalNotes: string;
  };
  el?: QuestionnairePersonInput;
  ella?: QuestionnairePersonInput;
  assessmentReportPdf?: {
    name: string;
    mimeType: 'application/pdf';
    dataBase64: string;
  };
}
