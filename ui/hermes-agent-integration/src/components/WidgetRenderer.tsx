import React, { useEffect, useState, useRef } from "react";
import { Copy } from "lucide-react";
import { buildWidgetHtml } from "../services/widgetHtmlBuilder";
import { PortfolioDashboard } from "./portfolio/PortfolioDashboard";

interface WidgetRendererProps {
  type: string;
  configStr: string;
}

export const WidgetRenderer = React.memo<WidgetRendererProps>(
  ({ type, configStr }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDark, setIsDark] = useState(false);
    const [height, setHeight] = useState<number>(400); // Default height
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const lastHtmlRef = useRef<string | null>(null);
    const blobUrlRef = useRef<string | null>(null);

    // Listen for resize messages from the iframe
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (
          event.data &&
          event.data.type === "WIDGET_RESIZE" &&
          typeof event.data.height === "number"
        ) {
          // Add a small 10px buffer to ensure no elements are covered
          // We now measure the exact content height via getBoundingClientRect
          setHeight(Math.floor(event.data.height + 10));
        }
      };

      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }, []);

    // Detect theme
    useEffect(() => {
      const checkTheme = () => {
        setIsDark(document.documentElement.classList.contains("dark"));
      };

      checkTheme();

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "class") {
            checkTheme();
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      const timerId = setTimeout(() => {
        try {
          // Robust JSON cleaning
          let cleanConfigStr = configStr.trim();

          // 1. Remove potential markdown code block markers
          if (cleanConfigStr.startsWith("```")) {
            cleanConfigStr = cleanConfigStr
              .replace(/^```(\w+)?\n/, "")
              .replace(/\n```$/, "");
          }

          // 2. Check for HTML content (common LLM error)
          if (cleanConfigStr.trim().startsWith("<")) {
            throw new Error(
              "Received HTML instead of JSON configuration. Please check the agent's output.",
            );
          }

          // 3. Aggressive cleaning for common LLM JSON errors
          const aggressiveClean = (str: string) => {
            let s = str.trim();

            // 1. Fix smart quotes
            s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

            // 2. Remove comments
            s = s.replace(/\/\/.*$/gm, "");
            s = s.replace(/\/\*[\s\S]*?\*\//g, "");

            // 3. Fix literal newlines/tabs inside string literals
            s = s.replace(/(["'])([\s\S]*?)(?<!\\)\1/g, (_, quote, content) => {
              return (
                quote +
                content
                  .replace(/\n/g, "\\n")
                  .replace(/\r/g, "\\r")
                  .replace(/\t/g, "\\t") +
                quote
              );
            });

            // 4. Fix unquoted keys (more robustly)
            s = s.replace(/([{,]\s*)([a-zA-Z0-9_\-]+)(\s*:)/g, '$1"$2"$3');

            // 5. Fix single quotes on keys/values
            s = s.replace(/([{,]\s*)'([^']*)'(\s*:)/g, '$1"$2"$3'); // Keys
            s = s.replace(/(:\s*)'([^']*)'(\s*[,}\]])/g, '$1"$2"$3'); // Values

            // 6. Fix missing commas between key-value pairs or array elements
            s = s.replace(
              /(["\d\}\]]|true|false|null)\s*\n?\s*(["\{\[\d]|true|false|null)/g,
              "$1, $2",
            );

            // 7. Handle truncated JSON
            const quoteCount = (s.match(/"/g) || []).length;
            if (quoteCount % 2 !== 0) {
              s += '"';
            }

            const openBraces = (s.match(/\{/g) || []).length;
            const closeBraces = (s.match(/\}/g) || []).length;
            if (openBraces > closeBraces) {
              s += "}".repeat(openBraces - closeBraces);
            }

            const openBrackets = (s.match(/\[/g) || []).length;
            const closeBrackets = (s.match(/\]/g) || []).length;
            if (openBrackets > closeBrackets) {
              s += "]".repeat(openBrackets - closeBrackets);
            }

            // 8. Remove trailing commas
            s = s.replace(/,\s*([\}\]])/g, "$1");

            // 9. Fix non-JSON values
            s = s.replace(/\bundefined\b/g, "null");
            s = s.replace(/\bNaN\b/g, "null");
            s = s.replace(/\bInfinity\b/g, "null");

            // 10. Fix functions
            s = s.replace(/function\s*\([^\)]*\)\s*\{[^}]*\}/g, "null");

            return s;
          };

          // 4. Stack-based JSON extractor
          const extractJson = (str: string) => {
            let s = str.trim();
            // Skip :::widget[...] prefix if present (fallback for malformed blocks)
            if (s.startsWith(":::widget")) {
              const closingBracket = s.indexOf("]");
              if (closingBracket !== -1) {
                s = s.substring(closingBracket + 1);
              }
            }

            const firstBrace = s.indexOf("{");
            const firstBracket = s.indexOf("[");
            let start = -1;

            if (
              firstBrace !== -1 &&
              (firstBracket === -1 || firstBrace < firstBracket)
            ) {
              start = firstBrace;
            } else if (firstBracket !== -1) {
              start = firstBracket;
            }

            if (start === -1) return null;

            let stack = 0;
            let inString = false;
            let escape = false;
            let quoteChar = "";

            for (let i = start; i < s.length; i++) {
              const c = s[i];
              if (escape) {
                escape = false;
                continue;
              }
              if (c === "\\") {
                escape = true;
                continue;
              }
              if (inString) {
                if (c === quoteChar) inString = false;
                continue;
              }
              if (c === '"' || c === "'") {
                inString = true;
                quoteChar = c;
                continue;
              }
              if (c === "{" || c === "[") stack++;
              else if (c === "}" || c === "]") {
                stack--;
                if (stack === 0) return s.substring(start, i + 1);
              }
            }
            return s.substring(start); // Return truncated if not balanced
          };

          let config;
          if (type === "mermaid" || type === "diagram") {
            try {
              config = JSON.parse(cleanConfigStr);
            } catch (e) {
              config = cleanConfigStr;
            }
          } else {
            // Try multiple parsing strategies
            const strategies = [
              () => JSON.parse(cleanConfigStr),
              () => JSON.parse(aggressiveClean(cleanConfigStr)),
              () => {
                const extracted = extractJson(cleanConfigStr);
                if (!extracted) throw new Error("No JSON structure found");
                return JSON.parse(extracted);
              },
              () => {
                const extracted = extractJson(cleanConfigStr);
                if (!extracted) throw new Error("No JSON structure found");
                return JSON.parse(aggressiveClean(extracted));
              },
            ];

            let lastError = null;
            for (const strategy of strategies) {
              try {
                config = strategy();
                break;
              } catch (e) {
                lastError = e;
              }
            }

            if (!config)
              throw lastError || new Error("Failed to parse configuration");
          }

          // Build the HTML string with theme support
          const html = buildWidgetHtml(type, config, isDark ? "dark" : "light");

          // ONLY update if the HTML content has actually changed
          if (html === lastHtmlRef.current && blobUrlRef.current) {
            return;
          }

          // Revoke old URL if it exists
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
          }

          lastHtmlRef.current = html;

          // Create a Blob and URL
          const blob = new Blob([html], { type: "text/html" });
          const url = URL.createObjectURL(blob);

          blobUrlRef.current = url;
          setBlobUrl(url);
          setError(null);
        } catch (err: any) {
          // Only show error if we haven't successfully rendered anything yet.
          // This prevents the UI from violently flashing between an iframe and an error div
          // during streaming when the JSON is temporarily malformed.
          if (!blobUrlRef.current) {
            setError(`Invalid widget configuration: ${err.message}`);
          }
        }
      }, 600); // 600ms debounce to prevent iframe reloading jitter during streaming

      return () => clearTimeout(timerId);
    }, [type, configStr, isDark]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
      };
    }, []);

    if (error) {
      return (
        <div className="my-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-sm font-mono">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold">Widget Error</div>
            <button
              onClick={() => navigator.clipboard.writeText(configStr)}
              className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-[10px] transition-colors flex items-center gap-1"
            >
              <Copy size={10} /> Copy Config
            </button>
          </div>
          <div className="opacity-80 mb-2">{error}</div>
          <pre className="p-2 bg-black/20 rounded overflow-x-auto text-[10px] max-h-40 custom-scrollbar">
            {configStr}
          </pre>
        </div>
      );
    }

    if (type === "portfolio-dashboard") {
      return (
        <div className="my-6 rounded-3xl overflow-hidden border border-pplx-border shadow-2xl">
          <PortfolioDashboard />
        </div>
      );
    }

    if (!blobUrl) {
      return (
        <div className="my-6 h-64 flex items-center justify-center rounded-lg border border-pplx-border bg-pplx-secondary/20 animate-pulse">
          <span className="text-pplx-muted text-sm">
            Loading interactive widget...
          </span>
        </div>
      );
    }

    return (
      <div className="my-2 overflow-visible">
        <div className="relative">
          <iframe
            ref={iframeRef}
            src={blobUrl}
            sandbox="allow-scripts"
            style={{ height: `${height}px` }}
            className="w-full border-0 transition-all duration-500 bg-transparent"
            title="Interactive Widget"
            loading="lazy"
          />
        </div>
      </div>
    );
  },
);
