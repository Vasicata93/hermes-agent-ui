import {
  Globe,
  BrainCircuit,
  Lightbulb,
  SearchCheck,
  GraduationCap,
  ShoppingBag,
  Zap,
  FileText,
  Layers,
} from "lucide-react";
import { FocusMode, ProMode, LocalModelConfig } from "./types";

export const PerplexityLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 17L12 22L22 17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12L12 17L22 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FOCUS_MODES = [
  {
    id: FocusMode.WEB_SEARCH,
    label: "Web Search",
    icon: Globe,
    description: "Search across the whole internet",
  },
  {
    id: FocusMode.ALL,
    label: "All",
    icon: Layers,
    description: "Search internet and libraries",
  },
  {
    id: FocusMode.LIBRARY,
    label: "Library",
    icon: FileText,
    description: "Search within your Personal Pages",
  },
];

export const PRO_MODES = [
  {
    id: ProMode.STANDARD,
    label: "Standard",
    icon: Zap,
    description: "Fast, concise answers for general queries",
  },
  {
    id: ProMode.REASONING,
    label: "Reasoning",
    icon: BrainCircuit,
    description: "Advanced logic using high thinking budget",
  },
  {
    id: ProMode.THINKING,
    label: "Thinking",
    icon: Lightbulb,
    description: "Step-by-step logical breakdown",
  },
  {
    id: ProMode.RESEARCH,
    label: "Research",
    icon: SearchCheck,
    description: "Deep dive with extensive citations",
  },
  {
    id: ProMode.LEARNING,
    label: "Learning",
    icon: GraduationCap,
    description: "Educational explanations and concepts",
  },
  {
    id: ProMode.SHOPPING,
    label: "Shop Research",
    icon: ShoppingBag,
    description: "Find products, prices, and reviews",
  },
];

export const EMOJI_LIST = [
  "📄",
  "💡",
  "🚀",
  "🎨",
  "📚",
  "✅",
  "🔥",
  "🧠",
  "💼",
  "🏡",
  "💻",
  "⚙️",
  "📈",
  "🔗",
  "📝",
  "🔒",
  "❤️",
  "⭐",
  "📅",
  "💬",
  "🌎",
  "🍕",
  "🎉",
  "🎵",
  "📷",
  "✈️",
  "🛠️",
  "⚛️",
  "🦠",
  "💊",
  "💵",
  "🪙",
  "📊",
  "📉",
  "📁",
  "📂",
  "📑",
  "🗒️",
  "📅",
  "📇",
];

export const AVAILABLE_OFFLINE_MODELS: LocalModelConfig[] = [
  {
    id: "llama-3.2-1b",
    name: "Llama 3.2 1B",
    modelId: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    fileSize: "1.2 GB",
    description:
      "Ultra-lightweight, high speed. Best for simple tasks on mobile.",
    isDownloaded: false,
    family: "llama",
  },
  {
    id: "llama-3.2-3b",
    name: "Llama 3.2 3B",
    modelId: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    fileSize: "2.4 GB",
    description: "Balanced performance and size. Good for general chat.",
    isDownloaded: false,
    family: "llama",
  },
  {
    id: "gemma-2-2b",
    name: "Gemma 2 2B",
    modelId: "gemma-2-2b-it-q4f16_1-MLC",
    fileSize: "1.6 GB",
    description: "Google efficient model. Strong reasoning for its size.",
    isDownloaded: false,
    family: "gemma",
  },
  {
    id: "qwen-2.5-1.5b",
    name: "Qwen 2.5 1.5B",
    modelId: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    fileSize: "1.1 GB",
    description: "Very capable small model. Good multilingual support.",
    isDownloaded: false,
    family: "qwen",
  },
  {
    id: "phi-3.5-mini",
    name: "Phi-3.5 Mini (3.8B)",
    modelId: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    fileSize: "2.8 GB",
    description: "High reasoning capability. Microsoft research model.",
    isDownloaded: false,
    family: "phi",
  },
  {
    id: "mistral-7b",
    name: "Mistral 7B (Quantized)",
    modelId: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
    fileSize: "4.1 GB",
    description: "The standard for edge AI. Requires powerful device.",
    isDownloaded: false,
    family: "mistral",
  },
];

export const UI_STRINGS = {
  en: {
    newThread: "New Thread",
    home: "Search",
    chat: "Chat",
    library: "Library",
    spaces: "Spaces",
    settings: "Settings",
    general: "General",
    models: "AI Models",
    voice: "Voice UI",
    embeddings: "Embeddings",
    profile: "Profile",
    memory: "Memory",
    appearance: "Appearance",
    language: "Interface Language",
    region: "Search Region",
    save: "Save Changes",
    cancel: "Cancel",
    noHistory: "No history yet",
    noPages: "No pages yet",
  },
  ro: {
    newThread: "Conversație Nouă",
    home: "Search",
    chat: "Conversații",
    library: "Bibliotecă",
    spaces: "Spații",
    settings: "Setări",
    general: "General",
    models: "Modele AI",
    voice: "Voce",
    embeddings: "Embeddings",
    profile: "Profil",
    memory: "Memorie",
    appearance: "Aspect",
    language: "Limbă Interfață",
    region: "Regiune Căutare",
    save: "Salvează",
    cancel: "Anulează",
    noHistory: "Fără istoric",
    noPages: "Fără notițe",
  },
};
