import {
  MemoryItem,
  MemoryCategory,
  MemoryBufferItem,
  Project,
  MemoryContext,
} from "../types";
import { db, STORES } from "./db";

const MEMORY_KEY = "all_memories";
const BUFFER_KEY = "current_buffer";
const PROJECTS_KEY = "active_projects";

// --- INTENT CLASSIFIER CONFIGURATION ---
// Maps keywords to specific memory categories
const INTENT_MAP: Record<string, MemoryCategory[]> = {
  coding: ["coding_projects", "learning_goals"],
  code: ["coding_projects"],
  react: ["coding_projects"],
  typescript: ["coding_projects"],
  bug: ["coding_projects"],
  error: ["coding_projects"],
  health: ["health_lifestyle", "hobbies_interests"],
  workout: ["health_lifestyle"],
  diet: ["health_lifestyle"],
  finance: ["finance", "learning_goals", "work"],
  money: ["finance"],
  invest: ["finance"],
  job: ["work", "learning_goals"],
  work: ["work", "coding_projects"],
  travel: ["hobbies_interests", "preferences"],
  trip: ["hobbies_interests"],
  book: ["hobbies_interests", "learning_goals"],
  movie: ["hobbies_interests"],
  learn: ["learning_goals", "coding_projects"],
  plan: ["learning_goals", "coding_projects"],
  relationship: ["relationships", "about_me"],
  family: ["relationships"],
  friend: ["relationships"],
};

export class MemoryService {
  // --- Core Memory Access ---

  static async getMemories(): Promise<MemoryItem[]> {
    try {
      const stored = await db.get<MemoryItem[]>(STORES.MEMORIES, MEMORY_KEY);
      return stored || [];
    } catch (e) {
      console.error("Failed to load memories", e);
      return [];
    }
  }

  static async saveMemories(memories: MemoryItem[]): Promise<void> {
    await db.set(STORES.MEMORIES, MEMORY_KEY, memories);
  }

  // --- Buffer (Short Term RAM) ---

  static async addToBuffer(
    role: "user" | "model" | "tool",
    content: string,
  ): Promise<void> {
    try {
      const buffer =
        (await db.get<MemoryBufferItem[]>(STORES.BUFFER, BUFFER_KEY)) || [];
      // Keep only last 20 turns in buffer
      if (buffer.length > 20) buffer.shift();
      buffer.push({ role, content, timestamp: Date.now() });
      await db.set(STORES.BUFFER, BUFFER_KEY, buffer);
    } catch (e) {
      console.error("Failed to update buffer", e);
    }
  }

  static async getBuffer(): Promise<MemoryBufferItem[]> {
    return (await db.get<MemoryBufferItem[]>(STORES.BUFFER, BUFFER_KEY)) || [];
  }

  static async clearBuffer(): Promise<void> {
    await db.set(STORES.BUFFER, BUFFER_KEY, []);
  }

  // --- Projects (Continuity) ---

  static async getProjects(): Promise<Project[]> {
    return (await db.get<Project[]>(STORES.PROJECTS, PROJECTS_KEY)) || [];
  }

  static async updateProjects(projects: Project[]): Promise<void> {
    await db.set(STORES.PROJECTS, PROJECTS_KEY, projects);
  }

  // --- NEW: LAYERED RETRIEVAL SYSTEM ---

  /**
   * Main entry point to get the formatted context string for the LLM.
   * Orchestrates the 4 layers of memory.
   */
  static async getContextString(prompt: string = ""): Promise<string> {
    const contextObj = await this.getStructuredContext(prompt);

    // Convert the structured object into a clean Markdown block
    let contextStr = `\n\n### 🧠 MEMORY SYSTEM ACTIVE`;

    // Layer 1: Core
    if (contextObj.core.length > 0) {
      contextStr += `\n**CORE IDENTITY:**\n${contextObj.core.map((m) => `- ${m.content}`).join("\n")}`;
    }

    // Layer 2: Intent & Working Memory
    contextStr += `\n**CURRENT CONTEXT (Intent: ${contextObj.intent}):**`;
    if (contextObj.working.length > 0) {
      contextStr += `\n${contextObj.working.map((w) => `- ${w}`).join("\n")}`;
    }

    // Layer 3: Relevant Facts (Filtered)
    if (contextObj.relevant.length > 0) {
      contextStr += `\n**RELEVANT KNOWLEDGE:**\n${contextObj.relevant.map((m) => `- [${m.category}] ${m.content}`).join("\n")}`;
    }

    contextStr += "\n[END MEMORY]";
    return contextStr;
  }

  /**
   * Retrieves memory organized by layers.
   */
  static async getStructuredContext(prompt: string): Promise<MemoryContext> {
    const allMemories = await this.getMemories();
    const allProjects = await this.getProjects();

    // 1. CLASSIFY INTENT
    const targetCategories = this.classifyIntent(prompt);
    const isGeneralIntent = targetCategories.includes("other");
    const intentLabel = isGeneralIntent
      ? "General"
      : targetCategories[0].toUpperCase();

    // 2. LAYER A: CORE MEMORY (Always present, high priority)
    // Contains Identity, Style, Preferences.
    const coreMemories = allMemories.filter((m) =>
      m && m.category && ["about_me", "preferences"].includes(m.category),
    );

    // 3. LAYER B: WORKING MEMORY (Session Context)
    // Contains Active Projects and recent critical info.
    const workingMemory: string[] = [];

    // Add Active Projects only if relevant to intent or if generalized
    const activeProjects = allProjects.filter((p) => p && p.status === "active");
    activeProjects.forEach((p) => {
      if (!p || !p.title) return;
      // If intent is coding, include tech stack details
      if (
        targetCategories.includes("coding_projects")
      ) {
        workingMemory.push(
          `Project "${p.title}": ${p.progress || "Started"} (Next: ${p.nextStep || "Planning"})`,
        );
      } else {
        // Minimal mention for general context
        workingMemory.push(`Active Project: ${p.title}`);
      }
    });

    // 4. LAYER C: RELEVANT FACTS (Scored Retrieval)
    // Filter the rest of the memories based on Intent + Keywords
    const otherMemories = allMemories.filter(
      (m) => m && m.category && !["about_me", "preferences"].includes(m.category),
    );

    const keywords = this.extractKeywords(prompt);
    const relevantFacts = otherMemories
      .map((m) => {
        let score = 0;
        if (!m || !m.content) return { m, score: -1 };

        // A. Category Match (High Weight)
        if (targetCategories.includes(m.category)) score += 5;

        // B. Keyword Match (Medium Weight)
        if (keywords.some((k) => m.content.toLowerCase().includes(k)))
          score += 3;

        // C. Tag Match
        if (m.tags && Array.isArray(m.tags) && m.tags.some((t) => keywords.includes(t))) score += 2;

        // D. Recency Boost (Small Weight)
        // Boost if created/updated in last 24h
        if (m.updatedAt && Date.now() - m.updatedAt < 86400000) score += 1;

        // E. Importance Weight (if exists)
        if (m.importance) score += m.importance;

        return { m, score };
      })
      .filter((item) => item.score >= 3) // Minimum threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Limit to top 10 relevant facts to save tokens
      .map((item) => item.m);

    // 5. Update Metadata (Touch accessed memories) - Optional optimization for future
    // We could fire-and-forget an update to 'lastAccessedAt' here.

    return {
      core: coreMemories,
      working: workingMemory,
      relevant: relevantFacts,
      intent: intentLabel,
    };
  }

  /**
   * Determines the category of the user's request based on keywords.
   * No LLM call required.
   */
  private static classifyIntent(prompt: string): MemoryCategory[] {
    const lowerPrompt = prompt.toLowerCase();
    const detectedCategories: Set<MemoryCategory> = new Set();

    // Check hardcoded keywords map
    for (const [keyword, categories] of Object.entries(INTENT_MAP)) {
      if (lowerPrompt.includes(keyword)) {
        categories.forEach((c) => detectedCategories.add(c));
      }
    }

    // Default fallbacks
    if (detectedCategories.size === 0) {
      detectedCategories.add("other");
      // If query is short/chatty, maybe add 'about_me' to know who user is
      if (prompt.length < 50) detectedCategories.add("about_me");
    }

    return Array.from(detectedCategories);
  }

  // --- Consolidation Engine (Applying Updates) ---

  static async applyConsolidation(updates: any): Promise<void> {
    const currentMemories = await this.getMemories();
    const currentProjects = await this.getProjects();

    // 1. Add New Memories
    if (updates.new_facts && Array.isArray(updates.new_facts)) {
      updates.new_facts.forEach((fact: any) => {
        currentMemories.push({
          id: Math.random().toString(36).substr(2, 9),
          content: fact.content,
          category: fact.category || "other",
          type: fact.type || "fact",
          confidence: 1,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          importance: 3,
          usageCount: 0,
        });
      });
    }

    // 2. Update/Merge Memories (Simple replacement for now)
    const uniqueMemories = currentMemories.filter(
      (m, index, self) =>
        m && m.content && m.category &&
        index ===
        self.findIndex(
          (t) => t && t.content === m.content && t.category === m.category,
        ),
    );

    // 3. Update Projects
    if (updates.project_updates && Array.isArray(updates.project_updates)) {
      updates.project_updates.forEach((update: any) => {
        if (!update || !update.title) return;
        const existing = currentProjects.find(
          (p) => p && p.title && p.title.toLowerCase() === update.title.toLowerCase(),
        );
        if (existing) {
          if (update.progress) existing.progress = update.progress;
          if (update.nextStep) existing.nextStep = update.nextStep;
          if (update.status) existing.status = update.status;
          existing.lastUpdated = Date.now();
        } else {
          currentProjects.push({
            id: Math.random().toString(36).substr(2, 9),
            title: update.title,
            status: update.status || "active",
            progress: update.progress || "Started",
            nextStep: update.nextStep || "Planning",
            techStack: update.techStack || [],
            lastUpdated: Date.now(),
          });
        }
      });
    }

    // 4. Update Skills
    if (updates.new_skills && Array.isArray(updates.new_skills)) {
      updates.new_skills.forEach((skill: any) => {
        if (typeof skill !== 'string') return;
        if (
           !uniqueMemories.find(
             (m) => m && m.category === "learning_goals" && m.content && m.content.includes(skill),
           )
        ) {
          uniqueMemories.push({
            id: Math.random().toString(36).substr(2, 9),
            content: skill,
            category: "learning_goals",
            type: "skill",
            confidence: 1,
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            importance: 4,
          });
        }
      });
    }

    await this.saveMemories(uniqueMemories);
    await this.updateProjects(currentProjects);
    await this.clearBuffer();
  }

  // --- Helper ---

  static async addMemory(
    content: string,
    category: string = "other",
  ): Promise<MemoryItem> {
    const mems = await this.getMemories();
    const newItem: MemoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      category: category as MemoryCategory,
      type: "fact",
      confidence: 1,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      importance: 3,
    };
    mems.push(newItem);
    await this.saveMemories(mems);
    return newItem;
  }

  static async deleteMemory(id: string): Promise<void> {
    const mems = await this.getMemories();
    await this.saveMemories(mems.filter((m) => m.id !== id));
  }

  static async clearMemories(): Promise<void> {
    await this.saveMemories([]);
    await this.updateProjects([]);
    await this.clearBuffer();
  }

  private static extractKeywords(text: string): string[] {
    if (!text || typeof text !== "string") return [];
    
    const stopWords = new Set([
      "the",
      "is",
      "at",
      "which",
      "on",
      "and",
      "a",
      "an",
      "in",
      "to",
      "of",
      "for",
      "it",
      "this",
      "that",
      "with",
      "as",
      "by",
      "but",
      "or",
      "not",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "can",
      "could",
      "will",
      "would",
      "should",
      "may",
      "might",
      "must",
      "about",
      "from",
      "how",
      "why",
      "what",
      "who",
      "when",
      "where",
      "please",
      "tell",
      "me",
      "remember",
      "save",
      "my",
      "i",
      "am",
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));
  }
}
