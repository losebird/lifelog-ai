
export type Emotion = '😊' | '😢' | '😠' | '😮' | '🤔' | '😐';

export interface ActionItem {
    id: string;
    task: string;
    dueDate?: string; // Full ISO string to handle date and time
    priority: 'low' | 'medium' | 'high';
    project?: string;
    status: 'todo' | 'inprogress' | 'done';
    subtasks: { id: string; text: string; completed: boolean }[];
    recordId: string;
    reminder?: 'none' | '5m' | '15m' | '1h' | '1d';
    recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  frequencyCount: number; 
  goal: {
    type: 'checkmark' | 'number' | 'note';
    target?: number;
    unit?: string;
  };
  reminderTime?: string;
  motivationalQuote?: string;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // 'YYYY-MM-DD'
  completed: boolean;
  value?: number | string;
}


export interface LinkDetails {
    url: string;
    title: string;
    summary: string;
}

export interface ScanDetails {
    imageUrl: string;
}

export interface FileDetails {
    name: string;
    type: string;
}

export interface Record {
    id: string;
    type: 'text' | 'voice' | 'link' | 'scan' | 'file';
    content: string; // User's notes, transcript, OCR text, file summary etc.
    timestamp: string;
    tags: string[];
    actionItems: ActionItem[];
    emotion?: Emotion;
    audioUrl?: string;
    linkDetails?: LinkDetails;
    scanDetails?: ScanDetails;
    fileDetails?: FileDetails;
    fullText?: string; // For storing full OCR text or document text for search
}

export interface GeminiAnalysisResult {
    tags: string[];
    actionItems: Omit<ActionItem, 'id' | 'status' | 'subtasks' | 'recordId' | 'reminder' | 'recurrence'>[];
    emotion?: Emotion;
}

export interface GeminiLinkAnalysisResult {
    title: string;
    summary: string;
    tags: string[];
}

export interface GeminiScanAnalysisResult extends GeminiAnalysisResult {
    ocrText: string;
}

export interface GeminiFileAnalysisResult extends GeminiAnalysisResult {
    summaryPoints: string[];
}

export interface InsightTemplate {
    id: string;
    name: string;
    description: string;
    questions: string[];
    isCustom?: boolean;
}

export interface ProactiveSuggestion {
    id: string;
    type: 'habit_suggestion' | 'pattern_insight';
    title: string;
    description: string;
    relatedRecordIds: string[];
    action?: {
        label: string;
        data: any; // e.g., pre-filled habit data
    };
}
