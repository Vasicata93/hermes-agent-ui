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
        { id: 'subagent', name: 'Subagent Swarm', description: 'Delegă task-uri către subagenți specializați cu review în două etape.', icon: 'Users', status: 'installed' },
        { id: 'writing-plans', name: 'Spec Writer', description: 'Transformă cerințele vagi în specificații tehnice TDD.', icon: 'FileCode', status: 'installed' },
        { id: 'llava-vision', name: 'Visual Analysis', description: 'Înțelegere multimodală a imaginilor și documentelor vizuale.', icon: 'Eye', status: 'available' },
        { id: 'research', name: 'Deep Research', description: 'Căutare web avansată și sinteză de informații externe.', icon: 'Search', status: 'available' }
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
        { id: 'terminal-access', name: 'Native Terminal', description: 'Execuție securizată de comenzi shell și scripturi.', icon: 'Command', status: 'installed' },
        { id: 'file-system', name: 'FileSystem Bridge', description: 'Acces direct de citire/scriere în workspace-ul activ.', icon: 'HardDrive', status: 'installed' }
    ]
};