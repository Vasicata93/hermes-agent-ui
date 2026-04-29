export interface CapabilityItem {
    id: string;
    name: string;
    description: string;
    icon: string;
    status: 'available' | 'installed' | 'connected';
}

export const HERMES_CAPABILITIES = {
    SKILLS: [
        { id: 'plan', name: 'Planning Mode', description: 'Creează planuri detaliate în .hermes/plans fără a executa cod.', icon: 'ClipboardList', status: 'installed' },
        { id: 'writing-plans', name: 'Spec Writer', description: 'Transformă cerințele vagi în specificații tehnice TDD.', icon: 'FileCode', status: 'installed' },
        { id: 'browser-pilot', name: 'Browser Pilot', description: 'Navigare web autonomă și interacțiune cu elemente DOM complexe.', icon: 'Globe', status: 'installed' },
        { id: 'data-scraper', name: 'Data Scraper', description: 'Extracție structurată de date din pagini dinamice și SPA-uri.', icon: 'Search', status: 'available' },
        { id: 'image-gen', name: 'Media Creator', description: 'Generare de imagini și editare vizuală via Stable Diffusion.', icon: 'Image', status: 'available' },
        { id: 'code-sandbox', name: 'Code Interpreter', description: 'Execuție de cod Python/JS în mediu izolat pentru analiză.', icon: 'Terminal', status: 'installed' },
        { id: 'skill-hub', name: 'SkillHub Explorer', description: 'Accesează librăria oficială Hermes pentru skill-uri noi.', icon: 'ExternalLink', status: 'connected' },
        { id: 'domain-intel', name: 'Domain Intel', description: 'Passive OSINT, SSL, WHOIS și DNS lookup direct.', icon: 'Shield', status: 'available' },
        { id: 'siyuan', name: 'SiYuan Sync', description: 'Gestionarea notițelor și documentelor în baza de cunoștințe SiYuan.', icon: 'Book', status: 'available' },
        { id: 'llava-vision', name: 'Visual Analysis', description: 'Înțelegere multimodală a imaginilor și documentelor vizuale.', icon: 'Eye', status: 'available' }
    ],
    CLOUD_MODELS: [
        { id: 'gpt-4o', name: 'OpenAI GPT-4o', description: 'Cel mai echilibrat model pentru logică și viteză.', icon: 'Zap', status: 'connected' },
        { id: 'claude-3-5', name: 'Claude 3.5 Sonnet', description: 'Excelent pentru coding și scriere creativă.', icon: 'PenTool', status: 'connected' },
        { id: 'gemini-1-5', name: 'Gemini 1.5 Pro', description: 'Fereastră de context imensă pentru proiecte mari.', icon: 'Layout', status: 'available' },
        { id: 'groq-llama3', name: 'Groq Llama 3', description: 'Inferență ultra-rapidă pentru răspunsuri instantanee.', icon: 'Activity', status: 'available' },
        { id: 'perplexity', name: 'Perplexity Sonar', description: 'Model optimizat pentru acuratețea informațiilor din web.', icon: 'Globe', status: 'available' }
    ],
    LOCAL_MODELS: [
        { id: 'llava-local', name: 'LLaVA (Local)', description: 'Model vision care rulează complet privat pe GPU-ul tău.', icon: 'Cpu', status: 'available' },
        { id: 'minilm', name: 'Xenova MiniLM', description: 'Model mic pentru embeddings și clasificare semantică locală.', icon: 'Hash', status: 'installed' },
        { id: 'mistral-7b', name: 'Mistral 7B (Ollama)', description: 'Model local performant pentru task-uri generale.', icon: 'Box', status: 'available' },
        { id: 'phi-3', name: 'Phi-3 Mini', description: 'Model ultra-ușor de la Microsoft optimizat pentru CPU.', icon: 'Minimize', status: 'available' },
        { id: 'llama3-8b', name: 'Llama 3 8B (GGUF)', description: 'Standardul industriei pentru modele locale open-source.', icon: 'Terminal', status: 'available' }
    ],
    MEMORY_CONNECTIVITY: [
        { id: 'vector-db', name: 'Semantic Memory', description: 'Bază de date vectorială pentru RAG și context long-term.', icon: 'Database', status: 'installed' },
        { id: 'sqlite-history', name: 'Universal History', description: 'Stocare locală securizată a tuturor conversațiilor (SQLite).', icon: 'History', status: 'installed' },
        { id: 'workspace-sync', name: 'Workspace Context', description: 'Sincronizare automată cu fișierele din folderul .hermes.', icon: 'FolderSync', status: 'installed' },
        { id: 'terminal-access', name: 'Native Terminal', description: 'Execuție securizată de comenzi shell în sandbox.', icon: 'Command', status: 'installed' },
        { id: 'file-system', name: 'FS Bridge', description: 'Acces direct de citire/scriere în workspace-ul activ.', icon: 'HardDrive', status: 'installed' }
    ],
    GATEWAY_CONNECTORS: [
        { id: 'telegram', name: 'Telegram Bot', description: 'Interacționează cu Hermes direct prin aplicația Telegram.', icon: 'Send', status: 'available' },
        { id: 'whatsapp', name: 'WhatsApp API', description: 'Conectare via Meta API pentru suport și notificări.', icon: 'MessageCircle', status: 'available' },
        { id: 'discord', name: 'Discord Integration', description: 'Conectează agentul la serverele tale de Discord.', icon: 'MessageSquare', status: 'available' },
        { id: 'slack', name: 'Slack App', description: 'Integrare profesională pentru workspace-urile de lucru.', icon: 'Hash', status: 'available' },
        { id: 'notion-api', name: 'Notion Sync', description: 'Sincronizare completă cu baze de date și pagini Notion.', icon: 'BookOpen', status: 'connected' },
        { id: 'google-ws', name: 'Google Workspace', description: 'Acces securizat la Docs, Sheets și Drive.', icon: 'Cloud', status: 'available' },
        { id: 'api-server', name: 'Local API Server', description: 'Expune un endpoint local pentru integrări custom.', icon: 'Globe', status: 'installed' }
    ]
};