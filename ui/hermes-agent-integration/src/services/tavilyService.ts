import { db, STORES } from "./db";

interface SearchResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string;
  score: number;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  answer?: string;
  images?: string[]; // Added support for search images
}

const CACHE_DURATION = 1000 * 60 * 60 * 4; // 4 Hours

export class TavilyService {
  /**
   * Unified search method that routes to the correct provider
   */
  static async search(
    query: string,
    apiKey: string,
    provider: "tavily" | "brave" = "tavily",
  ): Promise<SearchResponse | null> {
    if (!apiKey) {
      console.warn(`${provider} API Key is missing.`);
      return null;
    }

    const cacheKey = `search_${provider}_${btoa(encodeURIComponent(query))}`;

    // 1. Check Cache
    try {
      const cached = await db.get<{ timestamp: number; data: SearchResponse }>(
        STORES.CACHE,
        cacheKey,
      );
      if (cached) {
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log(`[Search] Serving from cache (${provider}): ${query}`);
          return cached.data;
        }
      }
    } catch (e) {
      console.error("Cache read error", e);
    }

    // 2. Fetch from Provider
    let data: SearchResponse | null = null;

    if (provider === "brave") {
      data = await this.searchBrave(query, apiKey);
    } else {
      data = await this.searchTavily(query, apiKey);
    }

    // 3. Save to Cache if successful
    if (data) {
      await db.set(STORES.CACHE, cacheKey, {
        timestamp: Date.now(),
        data: data,
      });
    }

    return data;
  }

  private static async searchTavily(
    query: string,
    apiKey: string,
  ): Promise<SearchResponse | null> {
    try {
      console.log(`[Tavily] Fetching live data: ${query}`);
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: query,
          search_depth: "advanced",
          include_answer: true,
          include_images: true, // Enabled images
          include_raw_content: false,
          max_results: 5,
        }),
      });

      if (!response.ok)
        throw new Error(`Tavily API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error("Tavily Search Failed:", error);
      return null;
    }
  }

  private static async searchBrave(
    query: string,
    apiKey: string,
  ): Promise<SearchResponse | null> {
    try {
      console.log(`[Brave] Fetching live data: ${query}`);
      // Brave Search API endpoint
      const url = new URL("https://api.search.brave.com/res/v1/web/search");
      url.searchParams.set("q", query);
      url.searchParams.set("count", "5");
      url.searchParams.set("text_decorations", "0");
      url.searchParams.set("result_filter", "web");

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": apiKey,
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Brave API Error (${response.status}): ${errText}`);
      }

      const rawData = await response.json();

      if (!rawData.web || !rawData.web.results) {
        console.warn("[Brave] No web results found in response.");
        return { query, results: [] };
      }

      // Map Brave format to our unified SearchResponse format
      const results: SearchResult[] = rawData.web.results.map((r: any) => {
        // Fallback content logic: Brave description might be empty, use extra snippets if available
        const content =
          r.description ||
          (r.extra_snippets
            ? r.extra_snippets.join(" ")
            : "No content available.");

        return {
          title: r.title,
          url: r.url,
          content: content,
          score: 1.0,
        };
      });

      return {
        query: query,
        results: results,
        answer: undefined,
      };
    } catch (error) {
      console.error("Brave Search Failed:", error);
      return null;
    }
  }

  /**
   * Formats results into a context string for the LLM.
   */
  static formatContext(data: SearchResponse): string {
    if (!data || !data.results.length) return "";

    let context = `\n\n### REAL-TIME WEB SEARCH RESULTS (Query: "${data.query}"):\n`;

    if (data.answer) {
      context += `**Direct Answer:** ${data.answer}\n\n`;
    }

    data.results.forEach((result, idx) => {
      context += `**Source ${idx + 1}:** [${result.title}](${result.url})\n`;
      context += `*Content:* ${result.content}\n\n`;
    });

    context +=
      "[END SEARCH RESULTS]\nUse the above facts to answer the user's question. Cite the sources using [Source X] format.";
    return context;
  }
}
