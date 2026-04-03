export interface CoachData {
  [key: string]: string;
}

export interface AppState {
  sheetUrl: string;
  data: CoachData[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  searchResult: CoachData | null;
}
