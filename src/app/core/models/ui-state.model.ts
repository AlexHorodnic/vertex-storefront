export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UiState {
  readonly status: LoadStatus;
  readonly message?: string;
}
