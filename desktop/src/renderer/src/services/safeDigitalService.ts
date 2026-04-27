import { db, STORES } from "./db";
import {
  DocumentItem,
  Note,
  Task,
} from "../components/safedigital/safedigital-types";
import {
  mockDocuments,
  mockNotes,
  mockTasks,
} from "../components/safedigital/safedigital-constants";

export class SafeDigitalService {
  async getDocuments(): Promise<DocumentItem[]> {
    const data = await db.get<DocumentItem[]>(STORES.PRIVATELIFE, "documents");
    return data || [];
  }

  async saveDocuments(documents: DocumentItem[]): Promise<void> {
    await db.set(STORES.PRIVATELIFE, "documents", documents);
  }

  async getNotes(): Promise<Note[]> {
    const data = await db.get<Note[]>(STORES.PRIVATELIFE, "notes");
    return data || [];
  }

  async saveNotes(notes: Note[]): Promise<void> {
    await db.set(STORES.PRIVATELIFE, "notes", notes);
  }

  async getTasks(): Promise<Task[]> {
    const data = await db.get<Task[]>(STORES.PRIVATELIFE, "tasks");
    return data || [];
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    await db.set(STORES.PRIVATELIFE, "tasks", tasks);
  }

  async initializeDefaultData(): Promise<void> {
    const isInitialized = await db.get<boolean>(
      STORES.PRIVATELIFE,
      "is_initialized",
    );
    if (isInitialized) return;

    const docs = await this.getDocuments();
    if (docs.length === 0) {
      await this.saveDocuments(mockDocuments);
    }

    const notes = await this.getNotes();
    if (notes.length === 0) {
      await this.saveNotes(mockNotes);
    }

    const tasks = await this.getTasks();
    if (tasks.length === 0) {
      await this.saveTasks(mockTasks);
    }

    await db.set(STORES.PRIVATELIFE, "is_initialized", true);
  }

  async resetData(): Promise<void> {
    await Promise.all([
      db.set(STORES.PRIVATELIFE, "documents", []),
      db.set(STORES.PRIVATELIFE, "notes", []),
      db.set(STORES.PRIVATELIFE, "tasks", []),
      db.set(STORES.PRIVATELIFE, "is_initialized", false),
    ]);
  }
}

export const safeDigitalService = new SafeDigitalService();
