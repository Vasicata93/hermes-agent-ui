import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DocumentItem } from "./safedigital-types";
import {
  ShieldIcon,
  FinanceIcon,
  LockIcon,
  TrashIcon,
  EditIcon,
  FolderIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  VaultIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
  NotesIcon,
} from "./Icons";

interface SafeDigitalVaultProps {
  documents: DocumentItem[];
  onDelete: (id: number) => void;
  onEdit: (doc: DocumentItem) => void;
  onAdd: (initialData?: any) => void;
  onView?: (doc: DocumentItem) => void;
}

export const folderHierarchy = [
  {
    id: "Personal",
    title: "Documente Personale",
    description: "Acte de identitate, contracte și sănătate",
    icon: <ShieldIcon className="w-5 h-5" />,
    subfolders: [
      "Acte de identitate, rezidență",
      "Contracte profesionale, personale",
      "Documente medicale, evidențe sănătate",
      "Facturi, chitanțe",
    ],
  },
  {
    id: "Finance",
    title: "Finanțe & Proprietăți",
    description: "Conturi bancare, crypto și active",
    icon: <FinanceIcon className="w-5 h-5" />,
    subfolders: [
      "Conturi bancare, carduri",
      "Portofolii digitale: cripto",
      "Proprietăți, dovezi de achiziție",
    ],
  },
  {
    id: "Security",
    title: "Securitate Digitală",
    description: "Accese, parole și coduri recovery",
    icon: <LockIcon className="w-5 h-5" />,
    subfolders: [
      "Conturi online (mail, social media)",
      "Parole, manager parole",
      "Recovery codes, 2FA",
    ],
  },
];

const SafeDigitalVault: React.FC<SafeDigitalVaultProps> = ({
  documents,
  onDelete,
  onEdit,
  onAdd,
  onView,
}) => {
  const [currentMain, setCurrentMain] = useState<string | null>(null);
  const [currentSub, setCurrentSub] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown !== null) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeDropdown]);

  const handleBack = () => {
    if (currentSub) {
      setCurrentSub(null);
    } else if (currentMain) {
      setCurrentMain(null);
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.subCategory.toLowerCase().includes(searchQuery.toLowerCase());

      if (searchQuery && !currentMain) return matchesSearch;

      if (!currentMain) return false;
      if (doc.mainCategory !== currentMain) return false;
      if (currentSub && doc.subCategory !== currentSub) return false;

      return matchesSearch;
    });
  }, [documents, currentMain, currentSub, searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const renderMainFolders = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      {folderHierarchy.map((folder) => (
        <motion.button
          key={folder.id}
          variants={itemVariants}
          whileHover={{
            boxShadow:
              "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          }}
          onClick={() => setCurrentMain(folder.id)}
          className="bg-pplx-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-pplx-border shadow-sm hover:border-pplx-accent/40 transition-colors duration-300 text-left group flex flex-row sm:flex-col items-center sm:items-start h-auto sm:h-full relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none hidden sm:block">
            <div className="scale-[3] text-pplx-accent">{folder.icon}</div>
          </div>

          <div className="p-2.5 sm:p-3 bg-pplx-secondary rounded-xl w-fit mb-0 sm:mb-4 group-hover:scale-110 transition-transform group-hover:bg-pplx-accent/10 shrink-0">
            <div className="text-pplx-accent">{folder.icon}</div>
          </div>

          <div className="ml-4 sm:ml-0 flex-grow">
            <h3 className="text-sm sm:text-lg font-bold text-pplx-text mb-0.5 sm:mb-1.5 font-display tracking-tight leading-tight">
              {folder.title}
            </h3>
            <p className="text-[10px] sm:text-xs text-pplx-muted line-clamp-1 sm:line-clamp-2 leading-relaxed">
              {folder.description}
            </p>
          </div>

          <div className="hidden sm:flex items-center justify-between mt-auto pt-3 border-t border-pplx-border/50 w-full">
            <p className="text-[9px] font-bold text-pplx-muted uppercase tracking-widest">
              {documents.filter((d) => d.mainCategory === folder.id).length}{" "}
              Documente
            </p>
            <ChevronRightIcon className="w-4 h-4 text-pplx-muted group-hover:text-pplx-accent group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="sm:hidden ml-2">
            <ChevronRightIcon className="w-4 h-4 text-pplx-muted" />
          </div>
        </motion.button>
      ))}
    </div>
  );

  const renderSubFolders = () => {
    const main = folderHierarchy.find((f) => f.id === currentMain);
    if (!main) return null;

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleBack}
              className="p-2.5 bg-pplx-card rounded-xl border border-pplx-border hover:bg-pplx-hover transition-colors text-pplx-text shadow-sm active:scale-95"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[9px] font-bold text-pplx-muted uppercase tracking-widest mb-0.5">
                Categorii
              </p>
              <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight">
                {main.title}
              </h2>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {main.subfolders.map((sub) => (
            <motion.button
              key={sub}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
              onClick={() => setCurrentSub(sub)}
              className="flex items-center justify-between p-4 sm:p-5 bg-pplx-card rounded-xl sm:rounded-2xl border border-pplx-border hover:border-pplx-accent/40 hover:bg-pplx-secondary/50 transition-colors group shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 bg-pplx-secondary rounded-lg group-hover:bg-pplx-accent/10 transition-colors">
                  <FolderIcon className="w-4 h-4 text-pplx-muted group-hover:text-pplx-accent" />
                </div>
                <span className="font-bold text-pplx-text text-left text-sm sm:text-base">
                  {sub}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-[10px] font-bold text-pplx-muted bg-pplx-secondary px-2 py-0.5 rounded-full">
                  {
                    documents.filter(
                      (d) =>
                        d.mainCategory === currentMain && d.subCategory === sub,
                    ).length
                  }
                </span>
                <ChevronRightIcon className="w-4 h-4 text-pplx-muted group-hover:text-pplx-accent group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  const renderDocuments = () => {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleBack}
              className="p-2.5 bg-pplx-card rounded-xl border border-pplx-border hover:bg-pplx-hover transition-colors text-pplx-text shadow-sm active:scale-95"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[9px] font-bold text-pplx-muted uppercase tracking-[0.2em] mb-0.5">
                {folderHierarchy.find((f) => f.id === currentMain)?.title}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight">
                {currentSub}
              </h2>
            </div>
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-pplx-card rounded-3xl border border-pplx-border">
            <div className="p-5 bg-pplx-secondary rounded-full mb-4">
              <VaultIcon className="w-10 h-10 text-pplx-muted/30" />
            </div>
            <h3 className="text-lg font-bold mb-1 font-display">
              Niciun document găsit
            </h3>
            <p className="text-xs text-pplx-muted max-w-[240px]">
              Nu am găsit niciun document care să corespundă criteriilor tale.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
          >
            {filteredDocs.map((doc) => (
              <motion.div
                key={doc.id}
                variants={itemVariants}
                onClick={(e) => {
                  // Prevent view if clicking on action buttons
                  const target = e.target as HTMLElement;
                  if (!target.closest('button')) {
                    onView && onView(doc);
                  }
                }}
                className={`bg-pplx-card p-3 rounded-xl border border-pplx-border shadow-sm hover:border-pplx-accent/30 transition-colors duration-200 group relative flex flex-col ${onView ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-pplx-secondary rounded-lg shrink-0">
                      <div className="text-pplx-accent">
                        {doc.content ? (
                          <NotesIcon className="w-4 h-4" />
                        ) : (
                          <>
                            {doc.mainCategory === "Personal" && (
                              <ShieldIcon className="w-4 h-4" />
                            )}
                            {doc.mainCategory === "Finance" && (
                              <FinanceIcon className="w-4 h-4" />
                            )}
                            {doc.mainCategory === "Security" && (
                              <LockIcon className="w-4 h-4" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-pplx-text truncate font-display tracking-tight">
                        {doc.title}
                      </h3>
                      <p className="text-[9px] font-bold text-pplx-muted uppercase tracking-widest truncate">
                        {doc.fileSize || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onEdit(doc)}
                      className="p-1.5 hover:bg-pplx-hover rounded-lg transition-colors text-pplx-muted hover:text-pplx-accent active:scale-90"
                      title="Editează"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(doc.id)}
                      className="p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors text-pplx-muted hover:text-rose-500 active:scale-90"
                      title="Șterge"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {doc.content && (
                  <div className="mt-2 p-2 bg-pplx-secondary/30 rounded-lg border border-pplx-border/50">
                    <p className="text-[9px] text-pplx-muted line-clamp-1 italic">
                      {doc.content}
                    </p>
                  </div>
                )}

                {doc.expiryDate && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-rose-500" />
                    <p className="text-[8px] font-bold text-rose-500 uppercase tracking-wider">
                      Expiră: {doc.expiryDate}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Search & Add Bar */}
      <div className="flex items-center gap-2 max-w-2xl mx-auto sm:mx-0">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Caută în seif..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-pplx-card border border-pplx-border rounded-xl sm:rounded-2xl py-3 sm:py-4 px-10 sm:px-12 text-xs sm:text-sm focus:ring-2 focus:ring-pplx-accent/20 focus:border-pplx-accent outline-none transition-colors font-medium text-pplx-text shadow-sm"
          />
          <SearchIcon className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-pplx-muted" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-pplx-hover rounded-full text-pplx-muted transition-colors"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() =>
            onAdd({ mainCategory: currentMain, subCategory: currentSub })
          }
          className="shrink-0 w-10 h-10 sm:w-[52px] sm:h-[52px] bg-pplx-accent hover:bg-pplx-accent/90 text-pplx-primary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-pplx-accent/10 transition-colors active:scale-95"
          title="Adaugă Document"
        >
          <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentMain + (currentSub || "") + (searchQuery || "")}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.1, ease: "linear" }}
        >
          {!currentMain && !searchQuery
            ? renderMainFolders()
            : !currentSub && !searchQuery
              ? renderSubFolders()
              : renderDocuments()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SafeDigitalVault;
