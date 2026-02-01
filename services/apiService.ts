
import { DiaryEntry } from '../types';

const STORAGE_KEY = 'nutriscan_diary_entries';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  async fetchEntries(): Promise<DiaryEntry[]> {
    await delay(300);
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  async saveEntry(entry: DiaryEntry): Promise<DiaryEntry> {
    await delay(500);
    const entries = await this.fetchEntries();
    const updated = [...entries, entry];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return entry;
  },

  async updateEntry(id: string, updatedEntry: Partial<DiaryEntry>): Promise<DiaryEntry> {
    await delay(500);
    const entries = await this.fetchEntries();
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Entry not found');
    
    entries[index] = { ...entries[index], ...updatedEntry };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return entries[index];
  },

  async deleteEntry(id: string): Promise<boolean> {
    await delay(400);
    const entries = await this.fetchEntries();
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }
};
