import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import {
  SkillInfo,
  SkillHubItem,
  api,
} from "@/lib/api";
import { CheckCircle, XCircle, Plus, Settings, Search, ExternalLink, RefreshCw, Download, Upload } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  disabled: "bg-gray-500",
  hub_installed: "bg-blue-500",
  updating: "bg-yellow-500",
};

export default function SkillsPage() {
  const { toast } = useToast();
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [hubCatalog, setHubCatalog] = useState<SkillHubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingHub, setLoadingHub] = useState(false);
  const [activeTab, setActiveTab] = useState<"installed" | "hub">("installed");

  const fetchData = async () => {
    try {
      const response = await api.getSkills();
      setSkills(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la încărcarea skill-urilor";
      toast({
        title: "Eroare",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHubCatalog = async () => {
    setLoadingHub(true);
    try {
      const response = await api.getSkillHubCatalog({ page: 1, pageSize: 100 });
      setHubCatalog(response.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la încărcarea SkillHub";
      toast({
        title: "Eroare",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingHub(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "hub") {
      fetchHubCatalog();
    }
  }, [activeTab]);

  const handleToggleSkill = async (name: string, enabled: boolean) => {
    try {
      await api.toggleSkill(name, enabled);
      toast({
        title: "Reușit",
        description: enabled
          ? `Skill-ul ${name} a fost activat`
          : `Skill-ul ${name} a fost dezactivat`,
        variant: "success",
      });
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la modificare";
      toast({
        title: "Eroare",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleSearchHub = async (query: string) => {
    setSearchQuery(query);
    if (!query) return;
    setLoadingHub(true);
    try {
      const response = await api.getSkillHubCatalog({ query, page: 1, pageSize: 100 });
      setHubCatalog(response.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la căutare";
      toast({
        title: "Eroare",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingHub(false);
    }
  };

  const handleInstallHubItem = async (item: SkillHubItem) => {
    try {
      const response = await api.installSkillHubItem({
        identifier: item.identifier,
        category: item.source,
        force: false,
      });
      toast({
        title: "Reușit",
        description: `Skill-ul ${item.name} a fost instalat`,
        variant: "success",
      });
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la instalare";
      toast({
        title: "Eroare",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateHubItem = async (name: string) => {
    try {
      const response = await api.updateHubSkillItems(name);
      toast({
        title: "Reușit",
        description: `Skill-ul ${name} a fost actualizat`,
        variant: "success",
      });
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la actualizare";
      toast({
        title: "Eroare",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleCheckUpdates = async () => {
    try {
      const updates = await api.checkHubSkillUpdates();
      const updateNames = Object.keys(updates);
      if (updateNames.length === 0) {
        toast({
          title: "Reușit",
          description: "Nu există actualizări disponibile",
          variant: "success",
        });
      } else {
        toast({
          title: "Reușit",
          description: `${updateNames.length} skill-uri au actualizări disponibile`,
          variant: "success",
        });
      }
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la verificare";
      toast({
        title: "Eroare",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleUninstallSkill = async (name: string) => {
    try {
      await api.uninstallHubSkill(name);
      toast({
        title: "Reușit",
        description: `Skill-ul ${name} a fost dezinstalat`,
        variant: "success",
      });
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la dezinstalare";
      toast({
        title: "Eroare",
        description: message,
        variant: "destructive",
      });
    }
  };

  const getSkillStatus = (skill: SkillInfo) => {
    if (skill.enabled) return "active";
    if (skill.hub_installed && skill.update_status) return "updating";
    if (skill.hub_installed) return "hub_installed";
    return "disabled";
  };

  const getSkillStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Activ";
      case "disabled": return "Inactiv";
      case "hub_installed": return "De la Hub";
      case "updating": return "Actualizare";
      default: return status;
    }
  };

  const getHubInstalledSkills = () =>
    skills.filter((skill) => skill.hub_installed);

  const getOtherSkills = () => skills.filter((skill) => !skill.hub_installed);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Se încarcă skill-urile...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestionare Skill-uri</h1>
          <p className="text-muted-foreground">Activează, dezactivează și actualizează skill-uri</p>
        </div>
        <div className="flex gap-2">
          <a
            href="https://skillhub.luo.ac/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            Deschide SkillHub
          </a>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-4">
        <Button
          variant={activeTab === "installed" ? "default" : "outline"}
          onClick={() => setActiveTab("installed")}
        >
          <Settings className="w-4 h-4 mr-2" />
          Installed
        </Button>
        <Button
          variant={activeTab === "hub" ? "default" : "outline"}
          onClick={() => setActiveTab("hub")}
        >
          <Search className="w-4 h-4 mr-2" />
          SkillHub Catalog
        </Button>
        <Button
          variant="outline"
          onClick={handleCheckUpdates}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Check Updates
        </Button>
      </div>

      <div className="space-y-6">
        {activeTab === "installed" ? (
          <>
            {getHubInstalledSkills().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Installate din SkillHub</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getHubInstalledSkills().map((skill) => {
                      const status = getSkillStatus(skill);
                      return (
                        <div
                          key={skill.name}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${STATUS_COLORS[status]} bg-opacity-10`}>
                              <CheckCircle
                                className={`h-5 w-5 ${
                                  status === "active" ? "text-green-500" :
                                  status === "hub_installed" ? "text-blue-500" :
                                  status === "updating" ? "text-yellow-500" : "text-gray-500"
                                }`}
                              />
                            </div>
                            <div>
                              <h3 className="font-medium">{skill.name}</h3>
                              <p className="text-sm text-muted-foreground">{skill.description}</p>
                              {skill.source && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {skill.source}
                                </Badge>
                              )}
                              {skill.install_path && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {skill.install_path}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={STATUS_COLORS[status]}>
                              {getSkillStatusLabel(status)}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleToggleSkill(skill.name, !skill.enabled)
                              }
                            >
                              {skill.enabled ? "Dezactivați" : "Activați"}
                            </Button>
                            {skill.update_status && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateHubItem(skill.name)}
                              >
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Update
                              </Button>
                            )}
                            {skill.update_status === null && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUninstallSkill(skill.name)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Uninstall
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {getOtherSkills().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Alte Skill-uri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getOtherSkills().map((skill) => (
                      <div
                        key={skill.name}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <h3 className="font-medium">{skill.name}</h3>
                          <p className="text-sm text-muted-foreground">{skill.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={skill.enabled ? "default" : "outline"}>
                            {skill.enabled ? "Activ" : "Inactiv"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleSkill(skill.name, !skill.enabled)}
                          >
                            {skill.enabled ? "Dezactivați" : "Activați"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {skills.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Niciun skill configurat</h3>
                  <p className="text-muted-foreground mb-4">
                    Accesionați SkillHub pentru a descoperi și adăuga skill-uri
                  </p>
                  <a
                    href="https://skillhub.luo.ac/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Deschide SkillHub
                  </a>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                SkillHub Catalog
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Căutați skill-uri..."
                    value={searchQuery}
                    onChange={(e) => handleSearchHub(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {loadingHub ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : hubCatalog.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nu s-au găsit skill-uri</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hubCatalog.map((item) => (
                      <div
                        key={item.identifier}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            item.trust === "trusted" ? "bg-green-100 dark:bg-green-950/50" :
                            item.trust === "community" ? "bg-blue-100 dark:bg-blue-950/50" :
                            "bg-gray-100 dark:bg-gray-950/50"
                          }`}>
                            <Download
                              className={`h-5 w-5 ${
                                item.trust === "trusted" ? "text-green-600 dark:text-green-400" :
                                item.trust === "community" ? "text-blue-600 dark:text-blue-400" :
                                "text-gray-600 dark:text-gray-400"
                              }`}
                            />
                          </div>
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {item.source}
                              </Badge>
                              {item.installed && (
                                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/50">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Installed
                                </Badge>
                              )}
                              {item.update_status && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 dark:bg-yellow-950/50">
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  {item.update_status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!item.installed ? (
                            <Button
                              size="sm"
                              onClick={() => handleInstallHubItem(item)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Install
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateHubItem(item.name)}
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Update
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}