import { Block, PageStructure } from "../types/blockStructure";
import { MarkdownParser } from "./markdownParser";

export class BlockService {
  // --- Block Manipulation ---

  /**
   * Inserts a new block after a specific target block ID.
   */
  static insertBlockAfter(
    page: PageStructure,
    targetBlockId: string,
    newBlock: Block,
  ): PageStructure {
    const index = page.blocks.findIndex((b) => b.id === targetBlockId);
    if (index === -1) {
      throw new Error(`Block with ID ${targetBlockId} not found.`);
    }

    const newBlocks = [...page.blocks];
    newBlocks.splice(index + 1, 0, newBlock);

    return {
      ...page,
      blocks: newBlocks,
      metadata: { ...page.metadata, lastEditedTime: Date.now() },
    };
  }

  /**
   * Replaces the content of a specific block.
   */
  static replaceBlock(
    page: PageStructure,
    blockId: string,
    newContent: string,
  ): PageStructure {
    const index = page.blocks.findIndex((b) => b.id === blockId);
    if (index === -1) {
      throw new Error(`Block with ID ${blockId} not found.`);
    }

    const newBlocks = [...page.blocks];
    newBlocks[index] = { ...newBlocks[index], content: newContent };

    return {
      ...page,
      blocks: newBlocks,
      metadata: { ...page.metadata, lastEditedTime: Date.now() },
    };
  }

  /**
   * Deletes a specific block.
   */
  static deleteBlock(page: PageStructure, blockId: string): PageStructure {
    const index = page.blocks.findIndex((b) => b.id === blockId);
    if (index === -1) {
      throw new Error(`Block with ID ${blockId} not found.`);
    }

    const newBlocks = [...page.blocks];
    newBlocks.splice(index, 1);

    return {
      ...page,
      blocks: newBlocks,
      metadata: { ...page.metadata, lastEditedTime: Date.now() },
    };
  }

  /**
   * Updates a specific cell in a markdown table block.
   */
  static updateTableCell(
    page: PageStructure,
    blockId: string,
    rowIndex: number,
    colIndex: number,
    newValue: string,
  ): PageStructure {
    const index = page.blocks.findIndex((b) => b.id === blockId);
    if (index === -1) {
      throw new Error(`Block with ID ${blockId} not found.`);
    }

    const block = page.blocks[index];
    if (block.type !== "table") {
      throw new Error(`Block with ID ${blockId} is not a table.`);
    }

    // Simple Markdown Table Parser/Updater
    const lines = block.content.trim().split("\n");
    // Structure:
    // 0: | Header 1 | Header 2 |
    // 1: | --- | --- |
    // 2: | Row 0 Col 0 | Row 0 Col 1 |  <-- rowIndex 0 maps to lines[2]

    const dataStartLine = 2;
    const targetLineIndex = dataStartLine + rowIndex;

    if (targetLineIndex >= lines.length) {
      throw new Error(`Row index ${rowIndex} out of bounds for table.`);
    }

    let line = lines[targetLineIndex];
    // Remove leading/trailing pipes for splitting
    // This is a basic implementation and might fail with escaped pipes inside cells
    const parts = line.split("|");

    // Filter out the empty strings from split if the line starts/ends with pipe
    // e.g. "| A | B |" -> ["", " A ", " B ", ""]
    // We need to identify the indices of actual content

    let contentIndices: number[] = [];
    parts.forEach((p, i) => {
      if (i === 0 && p.trim() === "") return; // Leading pipe
      if (i === parts.length - 1 && p.trim() === "") return; // Trailing pipe
      contentIndices.push(i);
    });

    if (colIndex >= contentIndices.length) {
      throw new Error(`Column index ${colIndex} out of bounds.`);
    }

    const actualPartIndex = contentIndices[colIndex];
    parts[actualPartIndex] = ` ${newValue} `;

    lines[targetLineIndex] = parts.join("|");

    const newContent = lines.join("\n");
    const newBlocks = [...page.blocks];
    newBlocks[index] = { ...block, content: newContent };

    return {
      ...page,
      blocks: newBlocks,
      metadata: { ...page.metadata, lastEditedTime: Date.now() },
    };
  }

  /**
   * Moves a block to a new position (simple reordering).
   */
  static moveBlock(
    page: PageStructure,
    blockId: string,
    targetIndex: number,
  ): PageStructure {
    const index = page.blocks.findIndex((b) => b.id === blockId);
    if (index === -1) {
      throw new Error(`Block with ID ${blockId} not found.`);
    }

    const newBlocks = [...page.blocks];
    const [movedBlock] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, movedBlock);

    return {
      ...page,
      blocks: newBlocks,
      metadata: { ...page.metadata, lastEditedTime: Date.now() },
    };
  }

  // --- Conversion Helpers ---

  /**
   * Converts a raw Markdown string into a structured Page object.
   */
  static fromMarkdown(
    markdown: string,
    title: string = "Untitled",
  ): PageStructure {
    const blocks = MarkdownParser.parse(markdown);
    return {
      id: crypto.randomUUID(),
      title,
      blocks,
      metadata: {
        createdTime: Date.now(),
        lastEditedTime: Date.now(),
        createdBy: "user",
        lastEditedBy: "user",
      },
    };
  }

  /**
   * Converts a structured Page object back to Markdown string.
   */
  static toMarkdown(page: PageStructure): string {
    return MarkdownParser.stringify(page.blocks);
  }
}
