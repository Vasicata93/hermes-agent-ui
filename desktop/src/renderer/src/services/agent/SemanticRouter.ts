import { pipeline, env, FeatureExtractionPipeline } from '@xenova/transformers';

// Configure Xenova to run in the browser
env.allowLocalModels = false;
env.useBrowserCache = true;

// Define broad archetypes of user intents to match against
export const SEMANTIC_CATEGORIES = {
  CONVERSATION: "casual greeting, general conversation, simple facts, chitchat, buna, salut, ce mai faci, cine esti, cum te cheama, zi-mi o gluma, hello, hi",
  ACTION: "perform an action, create something, write email, save data, execute task, do something, fa o actiune, creeaza, salveaza, scrie un email, adauga, modifica",
  CODING: "programming, write code, debug, fix error, software architecture, typescript, react, code review, programare, scrie cod, eroare, bug, rezolva codul",
  RESEARCH: "web search, look up deep information, find history, read articles, external data, cauta pe net, cautare web, informatii detaliate, cine a fost, istoric",
  FINANCE: "money, budget, investments, cryptocurrency, prices, economy, spending, bani, buget, investitii, criptomonede, economie, pret', bursa",
  ANALYSIS: "data analysis, statistics, charts, graph, math, logical deduction, analiza date, statistici, grafice, matematica, deductie logica",
  AMBIGUOUS: "huh?, what?, can you repeat that?, i don't understand, ambiguous short question, poftim, ce, nu inteleg, repeta, la ce te referi"
};

export type SemanticCategory = keyof typeof SEMANTIC_CATEGORIES;

class SemanticRouter {
  private extractor: FeatureExtractionPipeline | null = null;
  private intentEmbeddings: Record<string, number[]> = {};
  public isReady = false;
  public isInitializing = false;

  async init() {
    if (this.isReady || this.isInitializing) return;
    this.isInitializing = true;
    try {
      console.log("[SemanticRouter] Initializing local ONNX semantic model...");
      
      // Load Xenova all-MiniLM-L6-v2 (a fast, tiny~22MB model great for sentence embeddings)
      this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        progress_callback: (progress: any) => {
          if (progress.status === 'progress') {
             // console.log(`[SemanticRouter] Downloading model: ${Math.round(progress.progress)}%`);
          }
        }
      }) as FeatureExtractionPipeline;
      
      // Pre-compute embeddings for our semantic categories
      for (const [key, text] of Object.entries(SEMANTIC_CATEGORIES)) {
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        this.intentEmbeddings[key] = Array.from(output.data);
      }
      
      this.isReady = true;
      console.log("[SemanticRouter] Semantic Model Loaded & Embedded.");
    } catch (error) {
      console.error("[SemanticRouter] Initialization failed:", error);
    } finally {
      this.isInitializing = false;
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Transforms a natural language text into a vector and finds the closest semantic intent.
   */
  async classify(text: string): Promise<{ category: SemanticCategory | null; score: number }> {
    if (!this.isReady || !this.extractor) {
      throw new Error("Semantic Router not ready");
    }
    
    // Embed the incoming user text
    const output = await this.extractor(text, { pooling: 'mean', normalize: true });
    const textVector = Array.from(output.data);

    let bestMatch: SemanticCategory | null = null;
    let highestScore = -1;

    // Compare similarity against all known categories
    for (const [key, vec] of Object.entries(this.intentEmbeddings)) {
      const score = this.cosineSimilarity(textVector, vec as number[]);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = key as SemanticCategory;
      }
    }

    // Threshold check: if score is too low, we return null to force heuristics
    if (highestScore < 0.35) {
       bestMatch = null;
    }

    return { category: bestMatch, score: highestScore };
  }
}

export const semanticRouter = new SemanticRouter();
