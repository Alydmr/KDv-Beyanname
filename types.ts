export interface ParsedData {
  filename: string;
  year: string;
  month: string;
  period: string; // Combined Month Year
  data: Record<string, string>; // Key is the field label, Value is the amount
  error?: string;
}

export interface ExtractionRule {
  key: string; // Internal key
  label: string; // Display label (Excel header)
  searchPhrases: string[]; // Phrases to find in PDF to locate the value
  type: 'standard' | 'table_row' | 'header'; 
  page?: number; // Preference for page number (1 or 2)
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}