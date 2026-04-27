export interface DocumentItem {
  id: number;
  title: string;
  mainCategory: "Personal" | "Finance" | "Security";
  subCategory: string;
  expiryDate?: string;
  lastModified: string;
  fileSize?: string;
  isLocked: boolean;
  content?: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  lastModified: string;
  tags: string[];
}

export interface Task {
  id: number;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
  priority: "low" | "medium" | "high";
}
