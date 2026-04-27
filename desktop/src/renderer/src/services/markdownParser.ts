import { Block } from "../types/blockStructure";
import { v4 as uuidv4 } from "uuid";

export class MarkdownParser {
  /**
   * Converts raw Markdown text into a structured Block array.
   * This is a simplified parser; a full implementation would use a robust AST parser like remark.
   */
  static parse(markdown: string): Block[] {
    const lines = markdown.split("\n");
    const blocks: Block[] = [];
    let inCodeBlock = false;
    let codeContent = "";
    let codeLanguage = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Code Blocks
      if (trimmed.startsWith("```")) {
        if (inCodeBlock) {
          // End of code block
          blocks.push({
            id: uuidv4(),
            type: "code",
            content: codeContent.trim(),
            properties: { language: codeLanguage },
          });
          inCodeBlock = false;
          codeContent = "";
          codeLanguage = "";
        } else {
          // Start of code block
          inCodeBlock = true;
          codeLanguage = trimmed.substring(3).trim();
        }
        continue;
      }
      if (inCodeBlock) {
        codeContent += line + "\n";
        continue;
      }

      // 2. Empty Lines (Separators)
      if (trimmed === "") {
        continue;
      }

      // 3. Headings
      if (trimmed.startsWith("# ")) {
        blocks.push({
          id: uuidv4(),
          type: "heading_1",
          content: trimmed.substring(2).trim(),
        });
        continue;
      }
      if (trimmed.startsWith("## ")) {
        blocks.push({
          id: uuidv4(),
          type: "heading_2",
          content: trimmed.substring(3).trim(),
        });
        continue;
      }
      if (trimmed.startsWith("### ")) {
        blocks.push({
          id: uuidv4(),
          type: "heading_3",
          content: trimmed.substring(4).trim(),
        });
        continue;
      }

      // 4. Lists (Bullet)
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        blocks.push({
          id: uuidv4(),
          type: "bullet_list",
          content: trimmed.substring(2).trim(),
        });
        continue;
      }

      // 5. Lists (Numbered)
      if (/^\d+\.\s/.test(trimmed)) {
        blocks.push({
          id: uuidv4(),
          type: "numbered_list",
          content: trimmed.replace(/^\d+\.\s/, "").trim(),
        });
        continue;
      }

      // 6. Todo Lists
      if (trimmed.startsWith("- [ ] ") || trimmed.startsWith("- [x] ")) {
        const checked = trimmed.startsWith("- [x] ");
        blocks.push({
          id: uuidv4(),
          type: "todo_list",
          content: trimmed.substring(6).trim(),
          properties: { checked },
        });
        continue;
      }

      // 7. Quotes
      if (trimmed.startsWith("> ")) {
        blocks.push({
          id: uuidv4(),
          type: "quote",
          content: trimmed.substring(2).trim(),
        });
        continue;
      }

      // 8. Dividers
      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        blocks.push({ id: uuidv4(), type: "divider", content: "" });
        continue;
      }

      // 9. Default: Paragraph
      blocks.push({ id: uuidv4(), type: "paragraph", content: trimmed });
    }

    return blocks;
  }

  /**
   * Converts a structured Block array back into Markdown text.
   */
  static stringify(blocks: Block[]): string {
    return blocks
      .map((block) => {
        switch (block.type) {
          case "heading_1":
            return `# ${block.content}`;
          case "heading_2":
            return `## ${block.content}`;
          case "heading_3":
            return `### ${block.content}`;
          case "bullet_list":
            return `- ${block.content}`;
          case "numbered_list":
            return `1. ${block.content}`;
          case "todo_list":
            return `- [${block.properties?.checked ? "x" : " "}] ${block.content}`;
          case "quote":
            return `> ${block.content}`;
          case "code":
            return `\`\`\`${block.properties?.language || ""}\n${block.content}\n\`\`\``;
          case "divider":
            return `---`;
          case "paragraph":
            return block.content;
          default:
            return block.content;
        }
      })
      .join("\n\n");
  }
}
