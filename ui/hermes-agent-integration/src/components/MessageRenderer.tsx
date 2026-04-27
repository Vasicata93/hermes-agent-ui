import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { visit } from "unist-util-visit";
import { Copy } from "lucide-react";
import { WidgetRenderer } from "./WidgetRenderer";

// Plugin to handle :::widget[type]{config} and :::think
function remarkWidgetPlugin() {
  return (tree: any) => {
    visit(tree, (node) => {
      if (
        node.type === "textDirective" ||
        node.type === "leafDirective" ||
        node.type === "containerDirective"
      ) {
        if (node.name === "think") {
          const extractText = (n: any): string => {
            if (n.type === "text" || n.type === "code") return n.value;
            if (n.children) return n.children.map(extractText).join("");
            return "";
          };
          
          let thinkContent = "";
          if (node.type === "containerDirective") {
             const contentNodes = node.children.filter(
              (c: any) => !(c.data && c.data.directiveLabel),
             );
             thinkContent = contentNodes.map(extractText).join("\n");
          } else {
             thinkContent = node.children ? node.children.map(extractText).join("\n") : "";
          }

          const data = node.data || (node.data = {});
          data.hName = "custom-think";
          data.hProperties = {
            thinkContent: thinkContent,
          };
          return;
        }

        if (node.name !== "widget") return;

        const data = node.data || (node.data = {});

        // The type is passed in the brackets: :::widget[chart]
        let widgetType = "unknown";
        let configStr = "{}";

        if (node.type === "containerDirective") {
          const labelChild = node.children.find(
            (c: any) => c.data && c.data.directiveLabel,
          );
          if (
            labelChild &&
            labelChild.children &&
            labelChild.children.length > 0
          ) {
            widgetType = labelChild.children[0].value;
          }

          // Extract text from children (excluding the label)
          const extractText = (n: any): string => {
            if (n.type === "text" || n.type === "code") return n.value;
            if (n.children) return n.children.map(extractText).join("");
            return "";
          };

          const contentNodes = node.children.filter(
            (c: any) => !(c.data && c.data.directiveLabel),
          );
          configStr = contentNodes.map(extractText).join("\n");
        } else if (
          node.type === "leafDirective" ||
          node.type === "textDirective"
        ) {
          if (node.children && node.children.length > 0) {
            widgetType = node.children[0].value;
          }
        }

        data.hName = "custom-widget";
        data.hProperties = {
          widgetType: widgetType,
          configStr: configStr,
        };
      }
    });
  };
}

interface MessageRendererProps {
  content: string;
}

export const MessageRenderer = React.memo<MessageRendererProps>(
  ({ content }) => {
    let processedContent = content;
    processedContent = processedContent.replace(/<think>([\s\S]*?)<\/think>/g, '\n:::think\n$1\n:::\n');
    if (processedContent.includes('<think>') && !processedContent.includes('</think>')) {
      processedContent = processedContent.replace(/<think>([\s\S]*)$/, '\n:::think\n$1\n:::\n');
    }

    return (
      <>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkDirective, remarkWidgetPlugin]}
          components={{
            // @ts-ignore
            "custom-think": ({ node, thinkContent, ...props }) => {
              return (
                <details className="my-4 border border-pplx-border rounded-xl bg-pplx-bg-secondary overflow-hidden group">
                  <summary className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-pplx-muted hover:text-pplx-text cursor-pointer select-none flex items-center outline-none">
                    <span className="flex-1">Agent Thoughts</span>
                    <span className="text-[10px] opacity-50 group-open:hidden">Click to expand</span>
                  </summary>
                  <div className="px-4 pb-4 pt-2 text-sm text-pplx-muted border-t border-pplx-border/50 whitespace-pre-wrap font-mono leading-relaxed">
                    {thinkContent}
                  </div>
                </details>
              );
            },
            // @ts-ignore
            "custom-widget": ({ node, widgetType, configStr, ...props }) => {
              return (
                <div className="my-4">
                  <WidgetRenderer
                    type={widgetType as string}
                    configStr={configStr as string}
                  />
                </div>
              );
            },
            p: ({ node, children, ...props }) => {
              return (
                <div
                  className="mb-6 leading-relaxed text-pplx-text font-normal text-[15px] md:text-[16px]"
                  {...props}
                >
                  {children}
                </div>
              );
            },
            pre: ({ children }) => <>{children}</>,
            ul: ({ node, ...props }) => (
              <ul
                className="list-disc pl-5 mb-6 space-y-2 text-pplx-text leading-relaxed"
                {...props}
              />
            ),
            ol: ({ node, ...props }) => (
              <ol
                className="list-decimal pl-5 mb-6 space-y-2 text-pplx-text leading-relaxed"
                {...props}
              />
            ),
            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
            h1: ({ node, ...props }) => (
              <h1
                className="text-3xl font-display font-bold mb-6 mt-10 text-pplx-text tracking-tight"
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="text-2xl font-display font-bold mb-4 mt-8 text-pplx-text tracking-tight"
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                className="text-xl font-display font-semibold mb-3 mt-6 text-pplx-text tracking-tight"
                {...props}
              />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-pplx-accent pl-6 italic my-8 text-pplx-text-secondary bg-pplx-bg-secondary py-4 pr-4 rounded-r-2xl"
                {...props}
              />
            ),
            code: ({ node, ...props }) => {
              const match = /language-(\w+)/.exec(props.className || "");
              // @ts-ignore
              const isInline = !match && !String(props.children).includes("\n");
              const lang = match?.[1] || "";

              if (
                !isInline &&
                (lang === "chart" ||
                  lang === "widget" ||
                  lang === "mermaid" ||
                  lang === "diagram")
              ) {
                const configStr = props.children ? String(props.children) : "";
                let widgetType = lang === "mermaid" || lang === "diagram" ? "mermaid" : "chart";
                
                if (lang === "widget") {
                   try {
                      // Attempt to extract the type directly from the JSON if possible
                      const parsed = JSON.parse(configStr);
                      if (parsed.type) {
                         widgetType = parsed.type;
                      } else {
                         widgetType = "widget";
                      }
                   } catch(e) {
                      widgetType = "widget";
                   }
                }

                return (
                  <div className="my-4">
                    <WidgetRenderer
                      type={widgetType}
                      configStr={configStr}
                    />
                  </div>
                );
              }

              return isInline ? (
                <code
                  className="bg-pplx-bg-secondary text-pplx-accent px-1.5 py-0.5 rounded text-sm font-mono border border-pplx-border"
                  {...props}
                />
              ) : (
                <div className="relative my-8 rounded-2xl overflow-hidden border border-pplx-border bg-pplx-bg shadow-premium">
                  <div className="flex items-center justify-between px-5 py-3 bg-pplx-bg-secondary border-b border-pplx-border">
                    <span className="text-xs text-pplx-text-secondary font-mono font-medium lowercase tracking-wider">
                      {lang || "code"}
                    </span>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(props.children ? String(props.children) : "")
                      }
                      className="flex items-center gap-1.5 text-xs text-pplx-text-secondary hover:text-pplx-text transition-colors font-medium"
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                  <pre className="p-5 overflow-x-auto text-sm text-pplx-text font-mono leading-relaxed custom-scrollbar">
                    <code className={props.className} {...props} />
                  </pre>
                </div>
              );
            },
            table: ({ node, ...props }) => (
              <div className="my-8 mb-10 w-full overflow-hidden rounded-2xl border border-pplx-border shadow-premium">
                <div className="overflow-x-auto">
                  <table
                    className="w-full border-collapse text-sm text-left"
                    {...props}
                  />
                </div>
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead
                className="bg-pplx-bg-secondary text-pplx-text-secondary font-bold uppercase tracking-[0.1em] text-[10px]"
                {...props}
              />
            ),
            th: ({ node, ...props }) => (
              <th
                className="px-5 py-4 border-b border-pplx-border whitespace-nowrap"
                {...props}
              />
            ),
            td: ({ node, ...props }) => (
              <td
                className="px-5 py-4 border-b border-pplx-border text-pplx-text align-top leading-relaxed"
                {...props}
              />
            ),
            a: ({ node, ...props }) => (
              <a
                className="text-pplx-accent hover:text-pplx-accent-hover underline decoration-pplx-accent/30 hover:decoration-pplx-accent underline-offset-4 transition-all font-semibold"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            ),
            hr: ({ node, ...props }) => (
              <hr className="my-10 border-t border-pplx-border" {...props} />
            ),
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </>
    );
  },
);
