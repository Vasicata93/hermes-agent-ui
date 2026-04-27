import { DocumentItem, Note, Task } from "./safedigital-types";

export const mockDocuments: DocumentItem[] = [
  {
    id: 1,
    title: "Copie Pașaport",
    mainCategory: "Personal",
    subCategory: "Acte de identitate, rezidență",
    expiryDate: "2028-12-31",
    lastModified: "2024-01-15",
    fileSize: "1.2 MB",
    isLocked: true,
  },
  {
    id: 2,
    title: "Poliță Asigurare Sănătate",
    mainCategory: "Personal",
    subCategory: "Documente medicale, evidențe sănătate",
    expiryDate: "2025-06-30",
    lastModified: "2024-02-10",
    fileSize: "2.5 MB",
    isLocked: false,
  },
  {
    id: 3,
    title: "Act Proprietate Casă",
    mainCategory: "Finance",
    subCategory: "Proprietăți, dovezi de achiziție",
    lastModified: "2023-11-20",
    fileSize: "5.8 MB",
    isLocked: true,
  },
  {
    id: 4,
    title: "Coduri Recuperare 2FA",
    mainCategory: "Security",
    subCategory: "Recovery codes, 2FA",
    lastModified: "2024-03-01",
    fileSize: "0.1 MB",
    isLocked: true,
  },
];

export const mockNotes: Note[] = [
  {
    id: 1,
    title: "Idei Proiect Nou",
    content: "Să folosim React 19 și Tailwind 4.",
    lastModified: "2024-03-15",
    tags: ["proiect", "tehnologie"],
  },
];

export const mockTasks: Task[] = [
  {
    id: 1,
    title: "Finalizează documentația",
    isCompleted: false,
    dueDate: "2024-04-10",
    priority: "high",
  },
];
