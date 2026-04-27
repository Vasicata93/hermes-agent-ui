import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Check,
  Brain,
  Cpu,
  Search,
  User,
  Settings as SettingsIcon,
  Briefcase,
  Globe,
  ChevronDown,
  Users,
  Activity,
  GraduationCap,
  Zap,
  Key,
  Palette,
  Code,
  Moon,
  Sun,
  Type,
  Laptop,
  Cloud,
  Sparkles,
  Camera,
  ChevronRight,
  ArrowLeft,
  Download,
  Smartphone,
  AlertTriangle,
  Plug,
  Github,
  Triangle,
  Mail,
  CheckCircle,
  XCircle,
  Wallet,
  Sliders,
} from "lucide-react";
import {
  AppSettings,
  ModelProvider,
  LocalModelConfig,
  MemoryItem,
  MemoryCategory,
} from "../types";
import { MemoryService } from "../services/memoryService";
import { UI_STRINGS, AVAILABLE_OFFLINE_MODELS } from "../constants";
import { checkLocalModelSupport } from "../services/localLlmService";
import { useIntegrationStore } from "../store/integrationStore";
import { connectorManager } from "../services/integration/ConnectorManager";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  initialTab?: TabType;
}

type TabType = "profile" | "general" | "models" | "memory" | "connectors" | "skills";

// --- CONSTANTS ---
const OPENROUTER_PRESETS = [
  "z-ai/glm-4.7-flash",
  "xiaomi/mimo-v2-flash",
  "mistralai/ministral-8b-2512",
  "google/gemini-3-flash-preview",
  "x-ai/grok-4.1-fast",
  "qwen/qwen3-vl-30b-a3b-thinking",
  "google/gemini-2.5-flash-lite-preview-09-2025",
  "deepseek/deepseek-v3.2",
  "openai/gpt-4o", // Ensuring typical defaults are available
  "anthropic/claude-3-opus",
];

// --- COMPONENTS ---

// Desktop Sidebar Item
const SidebarItem = ({
  id,
  label,
  icon: Icon,
  activeTab,
  onSelect,
}: {
  id: TabType;
  label: string;
  icon: any;
  activeTab: TabType;
  onSelect: (id: TabType) => void;
}) => (
  <button
    onClick={() => onSelect(id)}
    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm transition-all group ${
      activeTab === id
        ? "bg-pplx-hover text-pplx-text shadow-sm"
        : "text-pplx-muted hover:bg-pplx-secondary hover:text-pplx-text"
    }`}
  >
    <div
      className={`${activeTab === id ? "text-pplx-accent" : "text-pplx-muted group-hover:text-pplx-text opacity-70"}`}
    >
      <Icon size={20} />
    </div>
    <div className="flex flex-col items-start text-left">
      <span className="font-medium tracking-wide">{label}</span>
    </div>
  </button>
);

// Premium Mobile Menu Item
const MobileMenuItem = ({
  icon: Icon,
  label,
  description,
  onClick,
  active,
}: {
  icon: any;
  label: string;
  description?: string;
  onClick: () => void;
  active?: boolean;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 my-1 mx-0 md:mx-2 rounded-2xl active:scale-[0.98] transition-all duration-150 group bg-transparent hover:bg-pplx-hover/50"
  >
    <div className="flex items-center gap-5">
      <div
        className={`p-3 rounded-2xl transition-colors duration-150 ${active ? "bg-pplx-accent text-black" : "bg-pplx-secondary/50 text-pplx-muted group-hover:text-pplx-text"}`}
      >
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col text-left">
        <span
          className={`text-[17px] font-medium tracking-tight ${active ? "text-pplx-text" : "text-pplx-text/90"}`}
        >
          {label}
        </span>
        {description && (
          <span className="text-[13px] text-pplx-muted font-normal opacity-60">
            {description}
          </span>
        )}
      </div>
    </div>
    <ChevronRight size={18} className="text-pplx-muted/30" strokeWidth={2} />
  </button>
);

interface FilterPillProps {
  id: MemoryCategory | "all";
  label: string;
  icon: any;
  isActive: boolean;
  onClick: (id: MemoryCategory | "all") => void;
}

const FilterPill: React.FC<FilterPillProps> = ({
  id,
  label,
  icon: Icon,
  isActive,
  onClick,
}) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
      isActive
        ? "bg-pplx-text text-pplx-primary shadow-lg ring-1 ring-pplx-text/10"
        : "bg-pplx-secondary/50 text-pplx-muted hover:bg-pplx-hover hover:text-pplx-text"
    }`}
  >
    <Icon size={14} className={isActive ? "text-pplx-primary" : "opacity-70"} />
    {label}
  </button>
);

const SectionHeader = ({ title, desc }: { title: string; desc: string }) => (
  <div className="mb-8 pb-4">
    <h4 className="text-2xl font-semibold text-pplx-text mb-2 font-serif tracking-tight">
      {title}
    </h4>
    <p className="text-sm text-pplx-muted leading-relaxed max-w-2xl opacity-80">
      {desc}
    </p>
  </div>
);

const InputGroup = ({
  label,
  children,
  description,
}: {
  label: string;
  children?: React.ReactNode;
  description?: string;
}) => (
  <div className="mb-6">
    <label className="block text-[11px] font-bold text-pplx-muted uppercase tracking-widest mb-3 ml-1 opacity-70">
      {label}
    </label>
    {children}
    {description && (
      <p className="text-[11px] text-pplx-muted mt-2 ml-1 opacity-60 font-medium">
        {description}
      </p>
    )}
  </div>
);

const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
  isBeta = false,
}: any) => (
  <div
    className="flex items-center justify-between py-4 group cursor-pointer"
    onClick={onChange}
  >
    <div className="pr-6">
      <h4 className="text-base font-medium text-pplx-text flex items-center gap-2 mb-1">
        {label}
        {isBeta && (
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-pplx-secondary text-pplx-muted font-bold tracking-wide uppercase border border-transparent">
            Beta
          </span>
        )}
      </h4>
      <p className="text-xs text-pplx-muted max-w-md leading-relaxed opacity-70">
        {description}
      </p>
    </div>
    <button
      className={`flex-shrink-0 w-12 h-7 rounded-full relative transition-colors duration-150 ease-out ${checked ? "bg-pplx-text" : "bg-pplx-secondary"}`}
    >
      <div
        className={`absolute top-1 left-1 w-5 h-5 bg-pplx-primary rounded-full shadow-sm transition-transform duration-150 ease-out ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  </div>
);

interface OfflineModelCardProps {
  model: LocalModelConfig;
  isDownloaded: boolean;
  isActive: boolean;
  onDownload: () => void;
  onSelect: () => void;
  onDelete: () => void;
  progress: number;
  isSupported: boolean;
  unsupportedReason: string;
}

// Offline Model Card Component
const OfflineModelCard: React.FC<OfflineModelCardProps> = ({
  model,
  isDownloaded,
  isActive,
  onDownload,
  onSelect,
  onDelete,
  progress,
  isSupported,
  unsupportedReason,
}) => {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-150 ${
        isActive
          ? "bg-pplx-card border-pplx-accent shadow-md"
          : "bg-pplx-secondary/20 border-pplx-border hover:bg-pplx-secondary/40"
      } ${!isSupported ? "opacity-60" : ""}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-pplx-text text-sm">{model.name}</span>
          <span className="text-[10px] font-bold bg-pplx-secondary text-pplx-muted px-1.5 py-0.5 rounded uppercase tracking-wide">
            {model.family}
          </span>
        </div>
        {isDownloaded ? (
          <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase tracking-wider bg-green-500/10 px-2 py-0.5 rounded-full">
            <Check size={10} strokeWidth={3} /> Ready
          </div>
        ) : (
          <span className="text-[10px] text-pplx-muted font-medium bg-pplx-secondary px-2 py-0.5 rounded-full">
            {model.fileSize}
          </span>
        )}
      </div>

      <p className="text-xs text-pplx-muted mb-4 leading-relaxed line-clamp-2 min-h-[32px]">
        {model.description}
      </p>

      {/* Unsupported warning */}
      {!isSupported && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] leading-relaxed">
          <AlertTriangle size={12} className="inline mr-1 mb-0.5" />{" "}
          {unsupportedReason}
        </div>
      )}

      {/* Progress bar */}
      {progress > 0 && progress < 100 ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-pplx-muted font-bold uppercase tracking-wider">
            <span>Downloading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-pplx-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-pplx-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {isDownloaded ? (
            <>
              <button
                onClick={onSelect}
                disabled={isActive}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-pplx-text text-pplx-primary cursor-default"
                    : "bg-pplx-secondary hover:bg-pplx-hover text-pplx-text"
                }`}
              >
                {isActive ? "Selected" : "Select"}
              </button>
              <button
                onClick={onDelete}
                className="p-2 rounded-xl bg-pplx-secondary/50 text-pplx-muted hover:text-red-400 hover:bg-pplx-hover transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={isSupported ? onDownload : undefined}
              disabled={!isSupported}
              title={
                !isSupported
                  ? unsupportedReason
                  : `Download ${model.name} (${model.fileSize})`
              }
              className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isSupported
                  ? "bg-pplx-text text-pplx-primary hover:opacity-90 cursor-pointer"
                  : "bg-pplx-secondary/50 text-pplx-muted cursor-not-allowed"
              }`}
            >
              {isSupported ? (
                <>
                  <Download size={14} /> Download
                </>
              ) : (
                "🚫 Not available"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  initialTab = "general",
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [llmType, setLlmType] = useState<"cloud" | "local">("cloud");

  // Mobile Navigation State
  const [isMobileDetail, setIsMobileDetail] = useState(false);
  const [isCategoriesCollapsed, setIsCategoriesCollapsed] = useState(false);

  const [memorySearch, setMemorySearch] = useState("");
  const [memoryFilter, setMemoryFilter] = useState<MemoryCategory | "all">(
    "all",
  );
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newMemoryContent, setNewMemoryContent] = useState("");
  const [newMemoryCategory, setNewMemoryCategory] =
    useState<MemoryCategory>("about_me");

  // Offline Model State
  const [downloadProgress, setDownloadProgress] = useState<{
    [key: string]: number;
  }>({});

  // Integrations State
  const { connectors, skills, toggleSkill } = useIntegrationStore();
  const [editingConnector, setEditingConnector] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");

  const handleConnect = async (connectorId: string) => {
    const connector = connectors[connectorId];
    if (connector.authType === "api_key") {
      setEditingConnector(connectorId);
      setApiKeyInput("");
    } else {
      await connector.connect();
    }
  };

  const handleSaveApiKey = async () => {
    if (editingConnector && apiKeyInput) {
      await connectorManager.saveCredentials({
        connectorId: editingConnector,
        apiKey: apiKeyInput,
      });
      setEditingConnector(null);
    }
  };

  const handleDisconnect = async (connectorId: string) => {
    await connectorManager.disconnect(connectorId);
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "github":
        return <Github className="w-5 h-5 text-gray-100" />;
      case "vercel":
        return <Triangle className="w-5 h-5 text-white" />;
      case "google":
        return <Mail className="w-5 h-5 text-red-500" />;
      case "search":
        return <Search className="w-5 h-5 text-pplx-primary" />;
      default:
        return <Plug className="w-5 h-5 text-pplx-muted" />;
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = UI_STRINGS[formData.interfaceLanguage] || UI_STRINGS.en;

  const MEMORY_CATEGORIES: {
    id: MemoryCategory | "all";
    label: string;
    icon: any;
  }[] = [
    { id: "all", label: "All", icon: Brain },
    { id: "about_me", label: "About Me", icon: User },
    { id: "preferences", label: "Preferences & Style", icon: Sliders },
    { id: "work", label: "Work & Career", icon: Briefcase },
    { id: "coding_projects", label: "Coding & Projects", icon: Code },
    { id: "learning_goals", label: "Learning & Goals", icon: GraduationCap },
    { id: "relationships", label: "Relationships", icon: Users },
    { id: "health_lifestyle", label: "Health & Lifestyle", icon: Activity },
    { id: "hobbies_interests", label: "Hobbies & Interests", icon: Palette },
    { id: "finance", label: "Finance & Wealth", icon: Wallet },
    { id: "other", label: "Other", icon: Globe },
  ];

  useEffect(() => {
    setFormData(settings);
    if (isOpen) {
      setActiveTab(initialTab);
      setIsMobileDetail(initialTab !== "general"); // Open detail view directly if not general on mobile
      setIsCategoriesCollapsed(false);

      if (settings.modelProvider === ModelProvider.LOCAL) {
        setLlmType("local");
      } else {
        setLlmType("cloud");
      }
      MemoryService.getMemories().then(setMemories);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleMobileNav = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileDetail(true);
  };

  const getUserInitials = (name: string) => {
    return name ? name.substring(0, 1).toUpperCase() : "U";
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({
          ...formData,
          userProfile: {
            ...formData.userProfile,
            avatar: reader.result as string,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMemory = async () => {
    if (!newMemoryContent.trim()) return;
    await MemoryService.addMemory(newMemoryContent, newMemoryCategory);
    const updated = await MemoryService.getMemories();
    setMemories(updated);
    setNewMemoryContent("");
    setIsAddingMemory(false);
  };

  const handleDeleteMemory = async (id: string) => {
    await MemoryService.deleteMemory(id);
    const updated = await MemoryService.getMemories();
    setMemories(updated);
  };

  const handleClearMemory = async () => {
    if (
      confirm(
        "Are you sure you want to forget everything about you? This cannot be undone.",
      )
    ) {
      await MemoryService.clearMemories();
      setMemories([]);
    }
  };

  // --- Offline Model Logic ---
  const handleDownloadModel = async (model: LocalModelConfig) => {
    // ── Check environment BEFORE trying to download ──────────────
    const support = checkLocalModelSupport();

    if (!support.supported) {
      alert(
        `❌ Cannot download model\n\n${support.reason}\n\n${support.details}`,
      );
      return;
    }

    setDownloadProgress((prev) => ({ ...prev, [model.id]: 1 })); // Show spinner immediately

    try {
      const { localLlmService } = await import("../services/localLlmService");

      await localLlmService.initModel(
        model.modelId,
        (progress: number, text: string) => {
          setDownloadProgress((prev) => ({ ...prev, [model.id]: progress }));
          console.log(`[Download] ${model.name}: ${progress}% — ${text}`);
        },
      );

      // Mark as downloaded
      setFormData((prev) => {
        const updatedLocalModels = [...prev.localModels];
        const existingIdx = updatedLocalModels.findIndex(
          (m) => m.id === model.id,
        );
        const completedModel = { ...model, isDownloaded: true };
        if (existingIdx >= 0) updatedLocalModels[existingIdx] = completedModel;
        else updatedLocalModels.push(completedModel);
        return {
          ...prev,
          localModels: updatedLocalModels,
          activeLocalModelId: prev.activeLocalModelId || model.id,
          modelProvider:
            prev.modelProvider === ModelProvider.LOCAL
              ? prev.modelProvider
              : ModelProvider.LOCAL,
        };
      });
    } catch (error: any) {
      console.error("Download failed:", error);
      // Show the clean error message from localLlmService
      alert(`❌ Download failed\n\n${error.message}`);
    } finally {
      setTimeout(() => {
        setDownloadProgress((prev) => {
          const next = { ...prev };
          delete next[model.id];
          return next;
        });
      }, 1500);
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this model? You will need to download it again to use it offline.",
      )
    ) {
      try {
        const { localLlmService } = await import("../services/localLlmService");

        // Find the full modelId (WebLLM ID) from our constants
        const modelDef = AVAILABLE_OFFLINE_MODELS.find((m) => m.id === id);
        if (modelDef) {
          await localLlmService.deleteModel(modelDef.modelId);
        } else {
          await localLlmService.deleteModel(id); // Fallback
        }

        const newModels = formData.localModels.filter((m) => m.id !== id);
        let newActiveId = formData.activeLocalModelId;
        if (id === formData.activeLocalModelId) {
          newActiveId = newModels.length > 0 ? newModels[0].id : "";
        }
        setFormData({
          ...formData,
          localModels: newModels,
          activeLocalModelId: newActiveId,
        });
      } catch (error) {
        console.error("Failed to delete model:", error);
      }
    }
  };

  const filteredMemories = memories.filter((m) => {
    const matchesSearch = m.content
      .toLowerCase()
      .includes(memorySearch.toLowerCase());
    const matchesFilter = memoryFilter === "all" || m.category === memoryFilter;
    return matchesSearch && matchesFilter;
  });

  const getCategoryIcon = (cat: MemoryCategory) => {
    const found = MEMORY_CATEGORIES.find((c) => c.id === cat);
    return found ? found.icon : Globe;
  };

  const getTabTitle = (tab: TabType) => {
    switch (tab) {
      case "general":
        return t.general;
      case "models":
        return t.models;
      case "profile":
        return t.profile;
      case "memory":
        return t.memory;
      default:
        return "Settings";
    }
  };

  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6 transition-opacity duration-150">
      <div className="bg-pplx-primary w-full max-w-5xl md:rounded-3xl shadow-2xl border-none md:border border-pplx-border/50 overflow-hidden flex flex-col md:flex-row h-[100dvh] md:h-[85vh] max-h-[900px] text-pplx-text relative">
        {/* --- MOBILE ROOT MENU --- */}
        <div
          className={`md:hidden flex-col h-full bg-pplx-primary w-full absolute inset-0 z-20 ${!isMobileDetail ? "flex" : "hidden"}`}
        >
          {/* Settings List - Scrollable Container */}
          <div className="flex-1 overflow-y-auto bg-pplx-primary pb-20 custom-scrollbar">
            {/* Header (Now Scrollable) */}
            <div className="flex items-center justify-between p-6 pb-2 bg-transparent">
              <h2 className="text-3xl font-serif font-medium text-pplx-text tracking-tight">
                {t.settings}
              </h2>
              <button
                onClick={onClose}
                className="p-3 -ml-2 bg-pplx-secondary/50 text-pplx-text rounded-full hover:bg-pplx-hover transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Hero Card (Now Scrollable) */}
            <div className="px-4 py-6">
              <div
                className="bg-pplx-card rounded-3xl p-6 shadow-xl shadow-black/5 relative overflow-hidden group active:scale-[0.98] transition-transform duration-150"
                onClick={() => handleMobileNav("profile")}
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-pplx-secondary flex items-center justify-center text-pplx-muted overflow-hidden">
                      {formData.userProfile.avatar ? (
                        <img
                          src={formData.userProfile.avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-pplx-text">
                          {getUserInitials(formData.userProfile.name)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-pplx-text tracking-tight truncate font-serif">
                      {formData.userProfile.name || "User"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-2.5 py-0.5 bg-pplx-secondary text-pplx-text text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Pro
                      </span>
                      {formData.userProfile.location && (
                        <span className="text-xs text-pplx-muted truncate flex items-center gap-1 opacity-70">
                          <Globe size={10} /> {formData.userProfile.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-2 bg-pplx-secondary/50 rounded-full">
                    <ChevronRight size={18} className="text-pplx-muted" />
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Items */}
            <div className="px-4 flex flex-col gap-2">
              <div className="px-2 py-3 text-[11px] font-bold text-pplx-muted uppercase tracking-widest opacity-50">
                General
              </div>
              <MobileMenuItem
                icon={SettingsIcon}
                label={t.general}
                description="Appearance & language"
                onClick={() => handleMobileNav("general")}
              />
              <MobileMenuItem
                icon={Cpu}
                label={t.models}
                description="AI models & providers"
                onClick={() => handleMobileNav("models")}
              />

              <div className="px-2 py-3 mt-6 text-[11px] font-bold text-pplx-muted uppercase tracking-widest opacity-50">
                Personalization
              </div>
              <MobileMenuItem
                icon={Brain}
                label={t.memory}
                description="Long-term knowledge"
                onClick={() => handleMobileNav("memory")}
              />

              <div className="px-2 py-3 mt-6 text-[11px] font-bold text-pplx-muted uppercase tracking-widest opacity-50">
                Integrations
              </div>
              <MobileMenuItem
                icon={Plug}
                label="Connectors"
                description="External services"
                onClick={() => handleMobileNav("connectors")}
              />
              <MobileMenuItem
                icon={Zap}
                label="Skills"
                description="Agent capabilities"
                onClick={() => handleMobileNav("skills")}
              />
            </div>

            <div className="mt-12 flex flex-col items-center justify-center text-center opacity-30 mb-6">
              <span className="text-xl font-serif text-pplx-text font-bold italic tracking-tighter">
                Perplex
              </span>
              <p className="text-[10px] text-pplx-muted mt-1">v1.0.2</p>
            </div>
          </div>
        </div>

        {/* --- DESKTOP SIDEBAR --- */}
        <div className="hidden md:flex w-64 border-r border-pplx-border/50 bg-pplx-primary flex-col p-6 flex-shrink-0">
          <h2 className="text-xl font-medium text-pplx-text mb-8 px-2 font-serif tracking-tight">
            {t.settings}
          </h2>
          <nav className="flex flex-col gap-2">
            <SidebarItem
              id="general"
              label={t.general}
              icon={SettingsIcon}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
            <SidebarItem
              id="models"
              label={t.models}
              icon={Cpu}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
            <SidebarItem
              id="memory"
              label={t.memory}
              icon={Brain}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
            <div className="my-2 border-t border-pplx-border/50" />
            <SidebarItem
              id="connectors"
              label="Connectors"
              icon={Plug}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
            <SidebarItem
              id="skills"
              label="Skills"
              icon={Zap}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
          </nav>
          <div className="mt-auto pt-6 px-2 opacity-40">
            <p className="text-xs text-pplx-muted">Perplex Clone v1.0</p>
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div
          className={`${isMobileDetail ? "flex" : "hidden"} md:flex flex-col flex-1 min-w-0 bg-pplx-primary md:bg-pplx-sidebar/30 overflow-hidden w-full h-full absolute md:static inset-0 z-30`}
        >
          {/* Mobile Header: Blurred & Clean (No Border) */}
          <div className="md:hidden flex items-center gap-4 p-4 pt-6 pb-4 bg-pplx-primary/95 backdrop-blur-md sticky top-0 z-20">
            <button
              onClick={() => setIsMobileDetail(false)}
              className="p-3 -ml-2 rounded-full hover:bg-pplx-secondary text-pplx-text transition-all active:scale-95"
            >
              <ArrowLeft size={22} />
            </button>
            <h3 className="text-xl font-serif font-medium text-pplx-text tracking-tight">
              {getTabTitle(activeTab)}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain bg-pplx-primary md:bg-transparent">
            <div className="p-5 md:p-10 max-w-4xl mx-auto pb-32 md:pb-10">
              {/* --- GENERAL TAB --- */}
              {activeTab === "general" && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title={t.general}
                      desc="Customize your experience."
                    />
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h5 className="text-[11px] font-bold text-pplx-muted uppercase tracking-widest mb-4 ml-1 opacity-70">
                        {t.appearance}
                      </h5>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: "dark", label: "Dark", icon: Moon },
                          { id: "light", label: "Light", icon: Sun },
                          { id: "system", label: "Auto", icon: Laptop },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() =>
                              setFormData({ ...formData, theme: opt.id as any })
                            }
                            className={`flex flex-col items-center justify-center py-5 px-2 rounded-2xl transition-all duration-150 ${
                              formData.theme === opt.id
                                ? "bg-pplx-card text-pplx-text shadow-xl shadow-black/5 ring-1 ring-black/5 dark:ring-white/10"
                                : "bg-pplx-secondary/30 text-pplx-muted hover:bg-pplx-secondary/60 hover:text-pplx-text"
                            }`}
                          >
                            <opt.icon
                              size={22}
                              className={`mb-3 ${formData.theme === opt.id ? "text-pplx-text" : "opacity-50"}`}
                              strokeWidth={1.5}
                            />
                            <span className="text-[11px] font-medium tracking-wide">
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-pplx-card p-6 rounded-3xl shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-pplx-secondary rounded-xl text-pplx-text">
                            <Type size={18} />
                          </div>
                          <span className="text-sm font-medium text-pplx-text">
                            Text Size
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-pplx-muted bg-pplx-secondary px-3 py-1 rounded-lg uppercase tracking-wider">
                          {formData.textSize}
                        </span>
                      </div>
                      <div className="relative pt-2 pb-1 px-1">
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="1"
                          value={
                            formData.textSize === "small"
                              ? 0
                              : formData.textSize === "medium"
                                ? 1
                                : 2
                          }
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const size =
                              val === 0
                                ? "small"
                                : val === 1
                                  ? "medium"
                                  : "large";
                            setFormData({ ...formData, textSize: size });
                          }}
                          className="w-full h-1.5 bg-pplx-secondary rounded-lg appearance-none cursor-pointer accent-pplx-text"
                        />
                        <div className="flex justify-between mt-3 text-[10px] text-pplx-muted font-semibold uppercase tracking-widest opacity-60">
                          <span>Small</span>
                          <span>Default</span>
                          <span>Large</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-pplx-card rounded-3xl px-6 py-2 shadow-sm sm:hidden">
                      <ToggleRow
                        label="Mobile Dock"
                        description="Show a persistent bottom navigation bar on mobile."
                        checked={formData.enableMobileDock}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            enableMobileDock: !formData.enableMobileDock,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-2">
                    <h5 className="text-[11px] font-bold text-pplx-muted uppercase tracking-widest mb-2 ml-1 opacity-70">
                      Language
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="relative group">
                          <select
                            value={formData.interfaceLanguage}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                interfaceLanguage: e.target.value as any,
                              })
                            }
                            className="w-full bg-pplx-input text-pplx-text text-sm rounded-2xl px-5 py-4 outline-none appearance-none transition-all cursor-pointer hover:bg-pplx-secondary"
                          >
                            <option value="en">English (Interface)</option>
                            <option value="ro">Română (Interfață)</option>
                          </select>
                          <ChevronDown
                            size={16}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-pplx-muted pointer-events-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="relative group">
                          <select
                            value={formData.aiProfile.language}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                aiProfile: {
                                  ...formData.aiProfile,
                                  language: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-pplx-input text-pplx-text text-sm rounded-2xl px-5 py-4 outline-none appearance-none transition-all cursor-pointer hover:bg-pplx-secondary"
                          >
                            <option value="English">
                              English (AI Response)
                            </option>
                            <option value="Romanian">
                              Romanian (AI Response)
                            </option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                            <option value="German">German</option>
                            <option value="Japanese">Japanese</option>
                          </select>
                          <ChevronDown
                            size={16}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-pplx-muted pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="bg-pplx-card rounded-3xl px-6 py-2 shadow-sm mt-6">
                      <ToggleRow
                        label="Pro Search"
                        description="Enable real-time web grounding."
                        checked={formData.useSearch}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            useSearch: !formData.useSearch,
                          })
                        }
                        isBeta={true}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- MODELS TAB --- */}
              {activeTab === "models" && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title={t.models}
                      desc="Configure AI sources."
                    />
                  </div>

                  {/* --- LLM CATEGORY --- */}
                  <div className="space-y-6 pt-2 pb-6 border-b border-pplx-border/50">
                    <div className="flex items-center gap-3 mb-6 px-2">
                      <Cpu size={24} className="text-pplx-accent" />
                      <h2 className="text-xl font-bold text-pplx-text">Language Models (LLM)</h2>
                    </div>

                    <div className="flex justify-center mb-8">
                      <div className="bg-pplx-input p-1.5 rounded-2xl flex w-full md:w-auto">
                        <button
                          onClick={() => setLlmType("cloud")}
                          className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
                            llmType === "cloud"
                              ? "bg-pplx-text text-pplx-primary shadow-lg transform scale-[1.02]"
                              : "bg-transparent text-pplx-muted hover:text-pplx-text"
                          }`}
                        >
                          <Cloud size={16} />
                          <span>Cloud</span>
                        </button>
                        <button
                          onClick={() => setLlmType("local")}
                          className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
                            llmType === "local"
                              ? "bg-pplx-text text-pplx-primary shadow-lg transform scale-[1.02]"
                              : "bg-transparent text-pplx-muted hover:text-pplx-text"
                          }`}
                        >
                          <Smartphone size={16} />
                          <span>Offline</span>
                        </button>
                      </div>
                    </div>

                  {llmType === "cloud" && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Gemini Card */}
                      <div
                        className={`group rounded-3xl p-6 transition-all duration-150 cursor-pointer select-none ${formData.modelProvider === ModelProvider.GEMINI ? "bg-pplx-card shadow-lg ring-1 ring-black/5 dark:ring-white/10" : "bg-pplx-card/50 hover:bg-pplx-card"}`}
                      >
                        <div
                          className="flex items-center justify-between"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              modelProvider: ModelProvider.GEMINI,
                            })
                          }
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="p-3 rounded-2xl bg-pplx-hover shadow-sm"
                            >
                              <Sparkles size={20} className="text-blue-500" />
                            </div>
                            <div>
                              <h4 className="text-base font-semibold text-pplx-text">
                                Google Gemini
                              </h4>
                              <p className="text-xs text-pplx-muted mt-0.5">
                                Gemini 1.5 Pro & Flash
                              </p>
                            </div>
                          </div>
                          {formData.modelProvider === ModelProvider.GEMINI && (
                            <div className="w-6 h-6 rounded-full bg-pplx-text flex items-center justify-center">
                              <Check
                                size={14}
                                className="text-pplx-primary"
                                strokeWidth={3}
                              />
                            </div>
                          )}
                        </div>

                        {formData.modelProvider === ModelProvider.GEMINI && (
                          <div className="mt-5 pt-5 border-t border-pplx-border/50 animate-fadeIn">
                            <div className="relative">
                              <Key
                                className="absolute left-4 top-4 text-pplx-muted opacity-50"
                                size={16}
                              />
                              <input
                                type="password"
                                value={formData.geminiApiKey || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    geminiApiKey: e.target.value,
                                  })
                                }
                                placeholder="Override API Key (Optional)..."
                                className="w-full bg-pplx-input rounded-2xl pl-11 pr-4 py-3.5 text-sm text-pplx-text outline-none font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* OpenRouter Card */}
                      <div
                        className={`group rounded-3xl p-6 transition-all duration-150 cursor-pointer select-none ${formData.modelProvider === ModelProvider.OPENROUTER ? "bg-pplx-card shadow-lg ring-1 ring-black/5 dark:ring-white/10" : "bg-pplx-card/50 hover:bg-pplx-card"}`}
                      >
                        <div
                          className="flex items-center justify-between"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              modelProvider: ModelProvider.OPENROUTER,
                            })
                          }
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="p-3 rounded-2xl bg-pplx-hover shadow-sm"
                            >
                              <Globe size={20} className="text-indigo-500" />
                            </div>
                            <div>
                              <h4 className="text-base font-semibold text-pplx-text">
                                OpenRouter
                              </h4>
                              <p className="text-xs text-pplx-muted mt-0.5">
                                Aggregated Models
                              </p>
                            </div>
                          </div>
                          {formData.modelProvider ===
                            ModelProvider.OPENROUTER && (
                            <div className="w-6 h-6 rounded-full bg-pplx-text flex items-center justify-center">
                              <Check
                                size={14}
                                className="text-pplx-primary"
                                strokeWidth={3}
                              />
                            </div>
                          )}
                        </div>

                        {formData.modelProvider ===
                          ModelProvider.OPENROUTER && (
                          <div className="mt-5 pt-5 border-t border-pplx-border/50 space-y-3 animate-fadeIn">
                            <div className="relative">
                              <Key
                                className="absolute left-4 top-4 text-pplx-muted opacity-50"
                                size={16}
                              />
                              <input
                                type="password"
                                value={formData.openRouterApiKey}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    openRouterApiKey: e.target.value,
                                  })
                                }
                                placeholder="sk-or-..."
                                className="w-full bg-pplx-input rounded-2xl pl-11 pr-4 py-3.5 text-sm text-pplx-text outline-none font-mono"
                              />
                            </div>
                            <div className="relative">
                              <Activity
                                className="absolute left-4 top-4 text-pplx-muted opacity-50"
                                size={16}
                              />
                              <input
                                list="openrouter-models"
                                type="text"
                                value={formData.openRouterModelId}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    openRouterModelId: e.target.value,
                                  })
                                }
                                placeholder="Select or type model ID..."
                                className="w-full bg-pplx-input rounded-2xl pl-11 pr-4 py-3.5 text-sm text-pplx-text outline-none font-mono"
                              />
                              <datalist id="openrouter-models">
                                {OPENROUTER_PRESETS.map((model) => (
                                  <option key={model} value={model} />
                                ))}
                              </datalist>
                              <div className="absolute right-4 top-4 text-[10px] text-pplx-muted font-bold opacity-50 uppercase pointer-events-none">
                                Model ID
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* OpenAI Card */}
                      <div
                        className={`group rounded-3xl p-6 transition-all duration-150 cursor-pointer select-none ${formData.modelProvider === ModelProvider.OPENAI ? "bg-pplx-card shadow-lg ring-1 ring-black/5 dark:ring-white/10" : "bg-pplx-card/50 hover:bg-pplx-card"}`}
                      >
                        <div
                          className="flex items-center justify-between"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              modelProvider: ModelProvider.OPENAI,
                            })
                          }
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="p-3 rounded-2xl bg-pplx-hover shadow-sm"
                            >
                              <Zap size={20} className="text-emerald-500" />
                            </div>
                            <div>
                              <h4 className="text-base font-semibold text-pplx-text">
                                OpenAI
                              </h4>
                              <p className="text-xs text-pplx-muted mt-0.5">
                                GPT-4o & GPT-3.5
                              </p>
                            </div>
                          </div>
                          {formData.modelProvider === ModelProvider.OPENAI && (
                            <div className="w-6 h-6 rounded-full bg-pplx-text flex items-center justify-center">
                              <Check
                                size={14}
                                className="text-pplx-primary"
                                strokeWidth={3}
                              />
                            </div>
                          )}
                        </div>

                        {formData.modelProvider === ModelProvider.OPENAI && (
                          <div className="mt-5 pt-5 border-t border-pplx-border/50 space-y-3 animate-fadeIn">
                            <div className="relative">
                              <Key
                                className="absolute left-4 top-4 text-pplx-muted opacity-50"
                                size={16}
                              />
                              <input
                                type="password"
                                value={formData.openAiApiKey}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    openAiApiKey: e.target.value,
                                  })
                                }
                                placeholder="sk-..."
                                className="w-full bg-pplx-input rounded-2xl pl-11 pr-4 py-3.5 text-sm text-pplx-text outline-none font-mono"
                              />
                            </div>
                            <div className="relative">
                              <Activity
                                className="absolute left-4 top-4 text-pplx-muted opacity-50"
                                size={16}
                              />
                              <input
                                type="text"
                                value={formData.openAiModelId}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    openAiModelId: e.target.value,
                                  })
                                }
                                placeholder="gpt-4o"
                                className="w-full bg-pplx-input rounded-2xl pl-11 pr-4 py-3.5 text-sm text-pplx-text outline-none font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {llmType === "local" && (
                    <div className="animate-fadeIn pb-12">
                      <div className="bg-pplx-card rounded-3xl p-6 mb-6 shadow-sm border border-pplx-border/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Smartphone size={20} className="text-pplx-accent" />
                          <h3 className="text-lg font-bold text-pplx-text">
                            Offline Model Store
                          </h3>
                        </div>
                        <p className="text-sm text-pplx-muted leading-relaxed">
                          Download highly optimized small language models
                          (1B-7B) to run locally on your device without
                          internet.
                        </p>
                      </div>

                      {(() => {
                        const support = checkLocalModelSupport();

                        return (
                          <>
                            {!support.supported && (
                              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6">
                                <div className="flex items-start gap-3">
                                  <AlertTriangle
                                    size={20}
                                    className="text-red-400 shrink-0 mt-0.5"
                                  />
                                  <div>
                                    <p className="text-sm font-bold text-red-400 mb-1">
                                      {support.reason}
                                    </p>
                                    <p className="text-xs text-red-300/80 leading-relaxed">
                                      {support.details}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-pplx-muted uppercase tracking-widest opacity-60 ml-1">
                                Available Models
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {AVAILABLE_OFFLINE_MODELS.map((model) => {
                                  const downloadedModel =
                                    formData.localModels.find(
                                      (m) => m.id === model.id,
                                    );
                                  const isDownloaded = !!downloadedModel;
                                  const isActive =
                                    formData.activeLocalModelId === model.id;
                                  const progress =
                                    downloadProgress[model.id] || 0;

                                  return (
                                    <OfflineModelCard
                                      key={model.id}
                                      model={model}
                                      isDownloaded={isDownloaded}
                                      isActive={isActive}
                                      progress={progress}
                                      isSupported={support.supported}
                                      unsupportedReason={
                                        !support.supported ? support.reason : ""
                                      }
                                      onDownload={() =>
                                        handleDownloadModel(model)
                                      }
                                      onSelect={() =>
                                        setFormData({
                                          ...formData,
                                          activeLocalModelId: model.id,
                                          modelProvider: ModelProvider.LOCAL,
                                        })
                                      }
                                      onDelete={() =>
                                        handleDeleteModel(model.id)
                                      }
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        );
                      })()}

                      {formData.localModels.length === 0 && (
                        <div className="mt-8 text-center p-6 border-2 border-dashed border-pplx-border/50 rounded-2xl opacity-60">
                          <Cloud
                            size={32}
                            className="mx-auto text-pplx-muted mb-2"
                          />
                          <span className="text-xs font-medium text-pplx-muted">
                            No models downloaded yet.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  </div>

                  {/* --- VOICE CATEGORY --- */}
                  <div className="space-y-6 pt-10 pb-6 border-t border-pplx-border/20">
                    <div className="px-2">
                      <h2 className="text-xl font-bold text-pplx-text mb-2">Voice Providers</h2>
                      <p className="text-sm text-pplx-muted">
                        Configure API keys for Text-to-Speech and Speech-to-Text inference models.
                      </p>
                    </div>

                    <InputGroup label="ElevenLabs API Key" description="Ultra-realistic voices and custom cloning.">
                      <div className="relative">
                        <Key className="absolute left-4 top-4 text-pplx-muted opacity-50" size={16} />
                        <input
                          type="password"
                          value={formData.elevenLabsApiKey || ""}
                          onChange={(e) => setFormData({ ...formData, elevenLabsApiKey: e.target.value })}
                          placeholder="sk_..."
                          className="w-full bg-pplx-input rounded-2xl pl-11 pr-4 py-3.5 text-sm text-pplx-text outline-none font-mono transition-colors focus:ring-1 focus:ring-pplx-accent"
                        />
                      </div>
                    </InputGroup>

                    <InputGroup label="OpenAI API Key" description="Whisper (STT) and OpenAI (TTS).">
                      <div className="relative">
                        <Key className="absolute left-4 top-4 text-pplx-muted opacity-50" size={16} />
                        <input
                          type="password"
                          value={formData.openaiVoiceApiKey || ""}
                          onChange={(e) => setFormData({ ...formData, openaiVoiceApiKey: e.target.value })}
                          placeholder="sk-proj-..."
                          className="w-full bg-pplx-input rounded-2xl pl-11 pr-4 py-3.5 text-sm text-pplx-text outline-none font-mono transition-colors focus:ring-1 focus:ring-pplx-accent"
                        />
                      </div>
                    </InputGroup>

                    <InputGroup label="Custom API Key" description="Custom instances (e.g., Cartesia).">
                      <div className="relative">
                        <Key className="absolute left-4 top-4 text-pplx-muted opacity-50" size={16} />
                        <input
                          type="password"
                          value={formData.customVoiceApiKey || ""}
                          onChange={(e) => setFormData({ ...formData, customVoiceApiKey: e.target.value })}
                          placeholder="API Key..."
                          className="w-full bg-pplx-input rounded-2xl pl-11 pr-4 py-3.5 text-sm text-pplx-text outline-none font-mono transition-colors focus:ring-1 focus:ring-pplx-accent"
                        />
                      </div>
                    </InputGroup>
                  </div>

                  {/* --- EMBEDDINGS CATEGORY --- */}
                  <div className="space-y-6 pt-10 pb-6 border-t border-pplx-border/20">
                    <div className="px-2">
                      <h2 className="text-xl font-bold text-pplx-text mb-2">Embeddings Configuration</h2>
                      <p className="text-sm text-pplx-muted">
                        Models used for specific retrieval tasks and semantic searches.
                      </p>
                    </div>

                    <InputGroup label="Provider" description="Select the default embeddings API.">
                      <div className="relative">
                        <select
                          value={formData.embeddingProvider}
                          onChange={(e) => setFormData({ ...formData, embeddingProvider: e.target.value as "gemini" | "openai" | "custom" })}
                          className="w-full bg-pplx-input rounded-2xl px-4 py-3.5 text-sm text-pplx-text outline-none appearance-none focus:ring-1 focus:ring-pplx-accent"
                        >
                          <option value="gemini">Google Gemini (Default)</option>
                          <option value="openai">OpenAI</option>
                          <option value="custom">Custom Configuration</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-pplx-muted pointer-events-none" />
                      </div>
                    </InputGroup>

                    {formData.embeddingProvider === "custom" && (
                      <InputGroup label="Custom Model ID" description="Set your own model to handle memory mapping.">
                        <div className="relative">
                          <Activity className="absolute left-4 top-4 text-pplx-muted opacity-50" size={16} />
                          <input
                            type="text"
                            value={formData.customEmbeddingModelId || ""}
                            onChange={(e) => setFormData({ ...formData, customEmbeddingModelId: e.target.value })}
                            placeholder="e.g. text-embedding-v2"
                            className="w-full bg-pplx-input rounded-2xl pl-11 pr-4 py-3.5 text-sm text-pplx-text outline-none font-mono focus:ring-1 focus:ring-pplx-accent"
                          />
                        </div>
                      </InputGroup>
                    )}
                  </div>

                  {/* --- MEMORY CONFIG CATEGORY --- */}
                  <div className="space-y-6 pt-10 pb-6 border-t border-pplx-border/20">
                    <div className="px-2">
                       <h2 className="text-xl font-bold text-pplx-text mb-2">Memory Settings</h2>
                       <p className="text-sm text-pplx-muted">
                        Processor model for context maintenance and memory management.
                       </p>
                    </div>

                    <InputGroup label="Processor Provider" description="Select the platform responsible for context.">
                      <div className="relative">
                        <select
                          value={formData.memoryModelProvider || "default"}
                          onChange={(e) => setFormData({ ...formData, memoryModelProvider: e.target.value as "default" | "openai" | "openrouter" })}
                          className="w-full bg-pplx-input rounded-2xl px-4 py-3.5 text-sm text-pplx-text outline-none appearance-none focus:ring-1 focus:ring-pplx-accent"
                        >
                          <option value="default">Default LLM (Same as Chat)</option>
                          <option value="openai">OpenAI Engine</option>
                          <option value="openrouter">OpenRouter Processor</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-pplx-muted pointer-events-none" />
                      </div>
                    </InputGroup>

                    {(formData.memoryModelProvider === "openai" || formData.memoryModelProvider === "openrouter") && (
                      <InputGroup label="Specific Memory Model ID" description="Assign a powerful model just for memory context analysis.">
                        <div className="relative">
                          <Activity className="absolute left-4 top-4 text-pplx-muted opacity-50" size={16} />
                          <input
                            type="text"
                            value={formData.customMemoryModelId || ""}
                            onChange={(e) => setFormData({ ...formData, customMemoryModelId: e.target.value })}
                            placeholder={formData.memoryModelProvider === "openai" ? "gpt-4-turbo" : "anthropic/claude-3-haiku"}
                            className="w-full bg-pplx-input rounded-2xl pl-11 pr-4 py-3.5 text-sm text-pplx-text outline-none font-mono focus:ring-1 focus:ring-pplx-accent"
                          />
                        </div>
                      </InputGroup>
                    )}
                  </div>
                </div>
              )}

              {/* --- MEMORY TAB --- */}
              {activeTab === "memory" && (
                <div className="flex flex-col pb-4 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title={t.memory}
                      desc="Manage what the AI remembers."
                    />
                  </div>
                  <div className="bg-pplx-card rounded-3xl px-6 border-none shadow-sm mb-6">
                    <ToggleRow
                      label="Enable Memory"
                      description="Allow the AI to recall facts about you."
                      checked={formData.enableMemory}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          enableMemory: !formData.enableMemory,
                        })
                      }
                    />
                  </div>
                  {formData.enableMemory ? (
                    <div className="bg-pplx-card rounded-3xl border-none shadow-lg overflow-hidden">
                      <div className="p-5 border-b border-pplx-border/30 bg-pplx-card/95 backdrop-blur-sm sticky top-0 z-20">
                        <div className="relative">
                          <Search
                            className="absolute left-4 top-3.5 text-pplx-muted opacity-50"
                            size={18}
                          />
                          <input
                            className="w-full bg-pplx-input text-base text-pplx-text pl-12 pr-4 py-3 rounded-2xl outline-none placeholder-pplx-muted/50"
                            placeholder="Search memories..."
                            value={memorySearch}
                            onChange={(e) => setMemorySearch(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Content Area - Expanded */}
                      <div className="p-4 space-y-2 bg-pplx-card">
                        {/* Categories */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-pplx-muted uppercase tracking-wider ml-1 opacity-70">
                              Categories
                            </span>
                            <button
                              onClick={() =>
                                setIsCategoriesCollapsed(!isCategoriesCollapsed)
                              }
                              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 font-medium text-[10px] uppercase tracking-wide ${isCategoriesCollapsed ? "bg-pplx-text text-pplx-primary" : "bg-pplx-input text-pplx-muted hover:text-pplx-text"}`}
                            >
                              {isCategoriesCollapsed ? (
                                <span>Show</span>
                              ) : (
                                <span>Hide</span>
                              )}
                              {isCategoriesCollapsed ? (
                                <ChevronDown size={14} />
                              ) : (
                                <X size={14} />
                              )}
                            </button>
                          </div>
                          {!isCategoriesCollapsed && (
                            <div className="flex flex-wrap items-center gap-2 animate-fadeIn">
                              {MEMORY_CATEGORIES.map((cat) => (
                                <FilterPill
                                  key={cat.id}
                                  id={cat.id}
                                  label={cat.label}
                                  icon={cat.icon}
                                  isActive={memoryFilter === cat.id}
                                  onClick={setMemoryFilter}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Manual Add Section */}
                        {isAddingMemory ? (
                          <div className="p-4 md:p-5 bg-pplx-input/30 rounded-3xl mb-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
                            <label className="block text-xs font-bold text-pplx-muted uppercase tracking-wider mb-2 opacity-70">
                              New Memory
                            </label>
                            <textarea
                              autoFocus
                              value={newMemoryContent}
                              onChange={(e) =>
                                setNewMemoryContent(e.target.value)
                              }
                              placeholder="e.g. I prefer concise answers..."
                              className="w-full bg-pplx-card text-base text-pplx-text outline-none resize-none h-24 md:h-32 p-4 rounded-xl mb-4 shadow-sm placeholder-pplx-muted/40 border-none"
                            />
                            <div className="flex flex-col gap-3">
                              <div className="relative group">
                                <select
                                  value={newMemoryCategory}
                                  onChange={(e) =>
                                    setNewMemoryCategory(
                                      e.target.value as MemoryCategory,
                                    )
                                  }
                                  className="w-full bg-pplx-card text-sm font-bold text-pplx-text rounded-xl px-4 py-3.5 outline-none cursor-pointer hover:bg-pplx-secondary shadow-sm appearance-none border-none pr-10"
                                >
                                  {MEMORY_CATEGORIES.filter(
                                    (c) => c.id !== "all",
                                  ).map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.label}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-pplx-muted pointer-events-none"
                                  size={16}
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setIsAddingMemory(false)}
                                  className="flex-1 text-sm text-pplx-muted hover:text-pplx-text px-4 py-3 font-medium bg-transparent rounded-xl hover:bg-pplx-input/50 transition-colors border border-transparent"
                                >
                                  {t.cancel}
                                </button>
                                <button
                                  onClick={handleAddMemory}
                                  className="flex-1 text-sm bg-pplx-text text-pplx-primary px-4 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md"
                                >
                                  Save Memory
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsAddingMemory(true)}
                            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-pplx-border/50 text-pplx-muted hover:text-pplx-text hover:bg-pplx-input/50 transition-all text-xs font-bold uppercase tracking-wide mb-6"
                          >
                            <Plus size={16} /> Add Memory
                          </button>
                        )}

                        {filteredMemories.length === 0 && !isAddingMemory && (
                          <div className="text-center py-20 text-pplx-muted opacity-40">
                            <Brain
                              size={56}
                              className="mx-auto mb-4 opacity-30"
                            />
                            <p className="text-sm font-medium">
                              No memories found.
                            </p>
                          </div>
                        )}

                        {filteredMemories.map((mem) => (
                          <div
                            key={mem.id}
                            className="group flex flex-col md:flex-row md:items-start justify-between p-4 rounded-2xl bg-pplx-secondary/20 hover:bg-pplx-secondary/40 transition-colors gap-3 md:gap-0"
                          >
                            <div className="flex items-start gap-4">
                              <div className="mt-0.5 text-pplx-text opacity-70 p-2 bg-pplx-card rounded-xl shadow-sm shrink-0">
                                {React.createElement(
                                  getCategoryIcon(mem.category),
                                  { size: 16 },
                                )}
                              </div>
                              <div className="flex flex-col gap-1.5 min-w-0">
                                <span className="text-sm text-pplx-text leading-relaxed font-medium break-words">
                                  {mem.content}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-pplx-muted uppercase tracking-widest opacity-60 bg-pplx-input px-2 py-0.5 rounded">
                                    {mem.category.replace("_", " ")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end md:block">
                              <button
                                onClick={() => handleDeleteMemory(mem.id)}
                                className="text-pplx-muted hover:text-red-400 p-2 rounded-xl hover:bg-pplx-card md:opacity-0 group-hover:opacity-100 transition-all bg-pplx-input/50 md:bg-transparent"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-5 bg-pplx-card border-t border-pplx-border/30 text-right">
                        <button
                          onClick={handleClearMemory}
                          className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center justify-end gap-2 ml-auto font-medium transition-colors"
                        >
                          <Trash2 size={14} /> Clear All Data
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-pplx-muted">
                      <div className="bg-pplx-secondary w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Brain size={48} className="opacity-30" />
                      </div>
                      <p className="text-lg font-medium text-pplx-text">
                        Memory Disabled
                      </p>
                      <p className="text-sm opacity-50 mt-2 max-w-xs mx-auto">
                        Turn on to personalize AI responses.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* --- PROFILE TAB --- */}
              {activeTab === "profile" && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title={t.profile}
                      desc="Identify yourself to the AI."
                    />
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-8 pb-8">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-pplx-secondary flex items-center justify-center shadow-2xl relative z-10">
                        {formData.userProfile.avatar ? (
                          <img
                            src={formData.userProfile.avatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User
                            size={56}
                            className="text-pplx-muted opacity-50"
                          />
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-1 right-1 p-3 bg-pplx-text text-pplx-primary rounded-full shadow-lg hover:scale-110 transition-transform z-20 border-4 border-pplx-primary"
                      >
                        <Camera size={18} />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                      <h5 className="text-xl font-bold text-pplx-text">
                        Your Avatar
                      </h5>
                      <p className="text-sm text-pplx-muted max-w-sm mx-auto md:mx-0 opacity-70">
                        Personalize your chat experience.
                      </p>
                      {formData.userProfile.avatar && (
                        <button
                          onClick={() =>
                            setFormData({
                              ...formData,
                              userProfile: {
                                ...formData.userProfile,
                                avatar: undefined,
                              },
                            })
                          }
                          className="text-xs text-red-400 hover:text-red-300 hover:underline font-medium pt-2"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <InputGroup label="Name">
                      <input
                        className="w-full bg-pplx-input border-none rounded-2xl px-5 py-4 text-base text-pplx-text outline-none transition-all placeholder-pplx-muted/50"
                        value={formData.userProfile.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            userProfile: {
                              ...formData.userProfile,
                              name: e.target.value,
                            },
                          })
                        }
                        placeholder="How should the AI call you?"
                      />
                    </InputGroup>
                    <InputGroup
                      label="Location"
                      description="For weather & local news."
                    >
                      <input
                        className="w-full bg-pplx-input border-none rounded-2xl px-5 py-4 text-base text-pplx-text outline-none transition-all placeholder-pplx-muted/50"
                        value={formData.userProfile.location}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            userProfile: {
                              ...formData.userProfile,
                              location: e.target.value,
                            },
                          })
                        }
                        placeholder="City, Country"
                      />
                    </InputGroup>
                    <InputGroup label="Bio">
                      <textarea
                        className="w-full bg-pplx-input border-none rounded-2xl px-5 py-4 text-base text-pplx-text outline-none h-32 resize-none transition-all placeholder-pplx-muted/50"
                        value={formData.userProfile.bio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            userProfile: {
                              ...formData.userProfile,
                              bio: e.target.value,
                            },
                          })
                        }
                        placeholder="Tell the AI about your profession and interests..."
                      />
                    </InputGroup>
                  </div>
                  <div className="pt-8">
                    <h5 className="text-sm font-bold text-pplx-text mb-6 flex items-center gap-2">
                      <Sparkles
                        size={16}
                        className="text-pplx-text opacity-70"
                      />{" "}
                      System Persona
                    </h5>
                    <InputGroup label="Custom Instructions">
                      <textarea
                        className="w-full bg-pplx-input border-none rounded-2xl px-5 py-4 text-base text-pplx-text outline-none h-40 resize-none font-mono text-xs transition-all placeholder-pplx-muted/50"
                        value={formData.aiProfile.systemInstructions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aiProfile: {
                              ...formData.aiProfile,
                              systemInstructions: e.target.value,
                            },
                          })
                        }
                        placeholder="You are a helpful assistant. Be concise..."
                      />
                    </InputGroup>
                  </div>
                </div>
              )}

              {/* --- CONNECTORS TAB --- */}
              {activeTab === "connectors" && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title="Connectors"
                      desc="Connect external services to your AI agent."
                    />
                  </div>

                  <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
                    {/* Tavily Search */}
                    <div 
                      className="border border-pplx-border rounded-2xl p-5 flex flex-col transition-all bg-pplx-card hover:border-pplx-border/80 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2.5 bg-pplx-hover rounded-xl shadow-sm">
                          <Search className="w-5 h-5 text-blue-500" />
                        </div>
                        {formData.tavilyApiKey ? (
                          <span className="flex items-center text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <CheckCircle className="w-3 h-3 mr-1.5" /> Connected
                          </span>
                        ) : (
                          <span className="flex items-center text-[11px] font-bold text-pplx-muted bg-pplx-hover px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <XCircle className="w-3 h-3 mr-1.5" /> Disconnected
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-medium text-pplx-text mb-1 flex items-center justify-between">
                        Tavily Search
                        {formData.searchProvider === "tavily" && formData.tavilyApiKey && (
                          <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-blue-500/20">Active</span>
                        )}
                      </h3>
                      <p className="text-sm text-pplx-muted mb-6 flex-1 leading-relaxed">
                        AI-optimized search engine for fast, accurate real-time data.
                      </p>

                      {editingConnector === "tavily" ? (
                        <div className="mt-auto space-y-3">
                          <input
                            type="password"
                            placeholder="Enter API Key (tvly-...)"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            className="w-full px-3 py-2.5 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted transition-colors"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setFormData({ ...formData, tavilyApiKey: apiKeyInput, searchProvider: "tavily" });
                                setEditingConnector(null);
                              }}
                              className="flex-1 bg-pplx-accent hover:opacity-90 text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingConnector(null)}
                              className="flex-1 bg-pplx-hover hover:bg-pplx-border text-pplx-text px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-auto">
                          {formData.tavilyApiKey ? (
                            <div className="flex gap-2">
                              {formData.searchProvider !== "tavily" && (
                                <button
                                  onClick={() => setFormData({ ...formData, searchProvider: "tavily" })}
                                  className="flex-1 py-2.5 px-4 bg-pplx-text text-pplx-primary hover:opacity-90 rounded-xl text-sm font-medium transition-opacity"
                                >
                                  Set Active
                                </button>
                              )}
                              <button
                                onClick={() => setFormData({ ...formData, tavilyApiKey: "", searchProvider: formData.searchProvider === "tavily" && formData.braveApiKey ? "brave" : formData.searchProvider })}
                                className="flex-1 py-2.5 px-4 border border-pplx-border text-pplx-text hover:bg-pplx-hover rounded-xl text-sm font-medium transition-colors"
                              >
                                Disconnect
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setApiKeyInput(formData.tavilyApiKey || "");
                                setEditingConnector("tavily");
                              }}
                              className="w-full py-2.5 px-4 bg-pplx-text text-pplx-primary hover:opacity-90 rounded-xl text-sm font-medium transition-opacity flex items-center justify-center gap-2"
                            >
                              <Key className="w-4 h-4" /> Connect
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Brave Search */}
                    <div 
                      className="border border-pplx-border rounded-2xl p-5 flex flex-col transition-all bg-pplx-card hover:border-pplx-border/80 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2.5 bg-pplx-hover rounded-xl shadow-sm">
                          <Search className="w-5 h-5 text-orange-500" />
                        </div>
                        {formData.braveApiKey ? (
                          <span className="flex items-center text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <CheckCircle className="w-3 h-3 mr-1.5" /> Connected
                          </span>
                        ) : (
                          <span className="flex items-center text-[11px] font-bold text-pplx-muted bg-pplx-hover px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <XCircle className="w-3 h-3 mr-1.5" /> Disconnected
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-medium text-pplx-text mb-1 flex items-center justify-between">
                        Brave Search
                        {formData.searchProvider === "brave" && formData.braveApiKey && (
                          <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-orange-500/20">Active</span>
                        )}
                      </h3>
                      <p className="text-sm text-pplx-muted mb-6 flex-1 leading-relaxed">
                        Privacy-preserving search engine for real-time web access.
                      </p>

                      {editingConnector === "brave" ? (
                        <div className="mt-auto space-y-3">
                          <input
                            type="password"
                            placeholder="Enter API Key (BSA-...)"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            className="w-full px-3 py-2.5 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted transition-colors"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setFormData({ ...formData, braveApiKey: apiKeyInput, searchProvider: "brave" });
                                setEditingConnector(null);
                              }}
                              className="flex-1 bg-pplx-accent hover:opacity-90 text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingConnector(null)}
                              className="flex-1 bg-pplx-hover hover:bg-pplx-border text-pplx-text px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-auto">
                          {formData.braveApiKey ? (
                            <div className="flex gap-2">
                              {formData.searchProvider !== "brave" && (
                                <button
                                  onClick={() => setFormData({ ...formData, searchProvider: "brave" })}
                                  className="flex-1 py-2.5 px-4 bg-pplx-text text-pplx-primary hover:opacity-90 rounded-xl text-sm font-medium transition-opacity"
                                >
                                  Set Active
                                </button>
                              )}
                              <button
                                onClick={() => setFormData({ ...formData, braveApiKey: "", searchProvider: formData.searchProvider === "brave" && formData.tavilyApiKey ? "tavily" : formData.searchProvider })}
                                className="flex-1 py-2.5 px-4 border border-pplx-border text-pplx-text hover:bg-pplx-hover rounded-xl text-sm font-medium transition-colors"
                              >
                                Disconnect
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setApiKeyInput(formData.braveApiKey || "");
                                setEditingConnector("brave");
                              }}
                              className="w-full py-2.5 px-4 bg-pplx-text text-pplx-primary hover:opacity-90 rounded-xl text-sm font-medium transition-opacity flex items-center justify-center gap-2"
                            >
                              <Key className="w-4 h-4" /> Connect
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {Object.values(connectors).map((connector) => (
                      <div key={connector.id} className="border border-pplx-border rounded-2xl p-5 bg-pplx-card flex flex-col transition-all hover:border-pplx-border/80 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-2.5 bg-pplx-hover rounded-xl shadow-sm">
                            {renderIcon(connector.icon)}
                          </div>
                          {connector.status === 'connected' ? (
                            <span className="flex items-center text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              <CheckCircle className="w-3 h-3 mr-1.5" /> Connected
                            </span>
                          ) : (
                            <span className="flex items-center text-[11px] font-bold text-pplx-muted bg-pplx-hover px-2.5 py-1 rounded-full uppercase tracking-wider">
                              <XCircle className="w-3 h-3 mr-1.5" /> Disconnected
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-medium text-pplx-text mb-1">{connector.name}</h3>
                        <p className="text-sm text-pplx-muted mb-6 flex-1 leading-relaxed">
                          {connector.description}
                        </p>

                        {editingConnector === connector.id ? (
                          <div className="mt-auto space-y-3">
                            <input
                              type="password"
                              placeholder="Enter API Key"
                              value={apiKeyInput}
                              onChange={(e) => setApiKeyInput(e.target.value)}
                              className="w-full px-3 py-2.5 bg-pplx-input border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted transition-colors"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveApiKey}
                                className="flex-1 bg-pplx-accent hover:opacity-90 text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingConnector(null)}
                                className="flex-1 bg-pplx-hover hover:bg-pplx-border text-pplx-text px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-auto">
                            {connector.status === 'connected' ? (
                              <button
                                onClick={() => handleDisconnect(connector.id)}
                                className="w-full py-2.5 px-4 border border-pplx-border text-pplx-text hover:bg-pplx-hover rounded-xl text-sm font-medium transition-colors"
                              >
                                Disconnect
                              </button>
                            ) : (
                              <button
                                onClick={() => handleConnect(connector.id)}
                                className="w-full py-2.5 px-4 bg-pplx-text text-pplx-primary hover:opacity-90 rounded-xl text-sm font-medium transition-opacity flex items-center justify-center gap-2"
                              >
                                <Key className="w-4 h-4" /> Connect
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- SKILLS TAB --- */}
              {activeTab === "skills" && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="hidden md:block">
                    <SectionHeader
                      title="Skills"
                      desc="Enable specific capabilities for your AI agent."
                    />
                  </div>

                  <div className="space-y-4">
                    {Object.values(skills).map((skill) => {
                      const missingConnectors = skill.requiredConnectors.filter(
                        (connId) => connectors[connId]?.status !== 'connected'
                      );
                      
                      return (
                        <div key={skill.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 border border-pplx-border rounded-2xl bg-pplx-card shadow-sm gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="p-2.5 bg-pplx-hover text-pplx-text rounded-xl shadow-sm mt-0.5 shrink-0">
                              {renderIcon(skill.icon)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base font-medium text-pplx-text flex flex-wrap items-center gap-2">
                                {skill.name}
                                {missingConnectors.length > 0 && (
                                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Requires: {missingConnectors.map(id => connectors[id]?.name || id).join(', ')}
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-pplx-muted mt-1 leading-relaxed">
                                {skill.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="sm:ml-4 flex-shrink-0 self-end sm:self-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={skill.isActive}
                                onChange={(e) => toggleSkill(skill.id, e.target.checked)}
                              />
                              <div className="w-11 h-6 bg-pplx-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pplx-accent"></div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Action Footer (Fixed Bottom inside the Flex container) */}
          <div
            className={`md:hidden p-4 bg-pplx-primary/95 backdrop-blur-md flex gap-3 z-30 shrink-0 transition-all duration-150 ${formData.enableMobileDock ? "pb-[80px]" : "pb-8"}`}
          >
            <button
              onClick={() => setIsMobileDetail(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium text-pplx-text bg-pplx-secondary hover:bg-pplx-hover transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-pplx-text text-pplx-primary shadow-lg"
            >
              {t.save}
            </button>
          </div>

          {/* Desktop Action Footer */}
          <div className="hidden md:flex p-6 bg-pplx-primary justify-end gap-3 rounded-br-3xl rounded-bl-none shrink-0 z-20">
            <button
              onClick={onClose}
              className="w-32 py-3 rounded-xl text-sm font-medium text-pplx-text hover:bg-pplx-secondary transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="w-32 py-3 rounded-xl text-sm font-bold bg-pplx-text text-pplx-primary hover:opacity-90 transition-opacity shadow-lg"
            >
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
