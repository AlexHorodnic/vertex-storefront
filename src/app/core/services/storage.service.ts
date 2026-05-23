import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
    if (!this.isStorageAvailable()) {
      return fallback;
    }

    try {
      const rawValue = window.localStorage.getItem(key);

      if (!rawValue) {
        return fallback;
      }

      const parsedValue: unknown = JSON.parse(rawValue);
      return isValid(parsedValue) ? parsedValue : fallback;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage quota and private browsing failures.
    }
  }

  remove(key: string): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage failures.
    }
  }

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && 'localStorage' in window;
  }
}
