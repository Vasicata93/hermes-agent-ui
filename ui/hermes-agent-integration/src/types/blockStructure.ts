export interface Block {
  id: string;
  type:
    | "paragraph"
    | "heading_1"
    | "heading_2"
    | "heading_3"
    | "bullet_list"
    | "numbered_list"
    | "todo_list"
    | "toggle"
    | "code"
    | "quote"
    | "callout"
    | "divider"
    | "table"
    | "image"
    | "video"
    | "file"
    | "bookmark"
    | "equation";
  content: string; // Markdown content for text blocks, URL for media
  properties?: Record<string, any>; // e.g., checked state for todo, language for code, caption
  children?: Block[]; // Nested blocks (e.g., inside toggles or list items)
  parentId?: string;
}

export interface PageStructure {
  id: string;
  title: string;
  blocks: Block[];
  metadata: {
    createdTime: number;
    lastEditedTime: number;
    createdBy: string;
    lastEditedBy: string;
    icon?: string;
    cover?: string;
  };
}
