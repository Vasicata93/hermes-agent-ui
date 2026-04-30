import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import {
  PlatformStatus,
  OverviewResponse,
  getOverview,
  PlatformStatus as PlatformStatusType,
} from "@/lib/api";
import { PlatformsCard } from "@/components/PlatformsCard";
import { isoTimeAgo } from "@/lib/utils";
import { Database, Activity, Clock, MessageSquare, Zap, ExternalLink, CheckCircle, XCircle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  connected: "bg-green-500",
  disconnected: "bg-yellow-500",
  fatal: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  connected: "Conectat",
  disconnected: "Deconectat",
  fatal: "Eroare",
  error: "Eroare",
};

const USAGE_COLORS: Record<string, string> = {
  sessions: "bg-green-500",
  messages: "bg-blue-500",
  tokens: "bg-purple-500",
  api_calls: "bg-orange-500",
};

const PERFORMANCE_COLORS: Record<string, string> = {
  avg_response_time: "bg-blue-500",
  memory_usage: "bg-purple-500",
  cpu_usage: "bg-yellow-500",
};

type GatewayStatus = "connected" | "disconnected" | "error";

export default function OverviewPage() {
  const { toast } = useToast();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await getOverview();
      setData(response);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la încărcarea datelor";
      setError(message);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Nu s-au putut încărca datele. Vă rugăm reîncercați.
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const colors = STATUS_COLORS[status] || "bg-gray-500";
    const label = STATUS_LABELS[status] || status;
    return (
      <Badge className={`${colors} text-white`}>
        {label}
      </Badge>
    );
  };

  const getConnectedPlatformStatus = (platformName: string) => {
    const platform = data.gateway_gateway_platforms?.[platformName];
    if (!platform) return null;

    const icon = platform.state === "connected" ? <Wifi className="w-4 h-4 text-green-500" /> :
                 platform.state === "fatal" ? <XCircle className="w-4 h-4 text-red-500" /> :
                 <MessageSquare className="w-4 h-4 text-yellow-500" />;

    return (
      <div key={platformName} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{platformName}</span>
        </div>
        <Badge variant={platform.state === "connected" ? "default" : "outline"} className="text-xs">
          {platform.state}
        </Badge>
      </div>
    );
  };

  const platformStatusList: PlatformStatusType[] = data.gateway_gateway_platforms
    ? Object.entries(data.gateway_gateway_platforms).map(([name, status]) => ({ [name]: status }))
    : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Agent</h1>
          <p className="text-muted-foreground">Supraveghere în timp real a stării agentului</p>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Status Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Stare Gateway</span>
              {getStatusBadge(data.gateway_gateway_running ? "connected" : "disconnected")}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Versiune</p>
                <p className="font-mono text-sm">{data.gateway_gateway_running ? data.gateway_version : "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sesiuni active</p>
                <p className="font-mono text-sm">{data.agent_active_sessions}</p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Conectori conectați</p>
              {data.capabilities_connected_connectors > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.capabilities_connected_connectors > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {data.capabilities_connected_connectors} conectori activi
                    </Badge>
                  )}
                  {data.capabilities_enabled_connectors > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {data.capabilities_enabled_connectors} configurat
                    </Badge>
                  )}
                  {data.capabilities_configured_connectors > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {data.capabilities_configured_connectors} total
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Niciun conector activ</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
              Utilizare
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-green-600">{data.usage_totals?.total_sessions || 0}</p>
                <p className="text-xs text-muted-foreground">Sesiuni totale</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-green-600">{data.usage_totals?.total_api_calls || 0}</p>
                <p className="text-xs text-muted-foreground">Apeluri API</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-blue-600">{data.usage_totals?.total_input || 0}</p>
                <p className="text-xs text-muted-foreground">Tokeni input</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-purple-600">{data.usage_totals?.total_output || 0}</p>
                <p className="text-xs text-muted-foreground">Tokeni output</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Performanță
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Timp mediu răspuns</span>
                <span className="font-mono">{data.agent_effective_context_length / 1000}ms</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: Math.min((data.agent_effective_context_length / 5000) * 100, 100) + "%" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Memorie utilizată</span>
                  <span className="font-mono">{data.system_memory_rss_mb ? (data.system_memory_rss_mb / 1024).toFixed(1) + " GB" : "N/A"}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: Math.min((data.system_memory_rss_mb || 0) / (data.system_disk_total_gb * 1024) * 100, 100) + "%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">CPU Load</span>
                  <span className="font-mono">{data.system_load_avg_1m?.toFixed(2) || "N/A"}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: Math.min((data.system_load_avg_1m || 0) / 8 * 100, 100) + "%" }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              Activitate recentă
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.activity_recent_sessions && data.activity_recent_sessions.length > 0 ? (
              <div className="space-y-2">
                {data.activity_recent_sessions.slice(0, 5).map((session, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{session.id}</span>
                        <span className="text-xs text-muted-foreground">
                          {session.model} · {session.message_count} mesaje
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {isoTimeAgo(session.last_active)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nicio activitate recentă</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Capabilități
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Skill-uri totale</span>
                <Badge className="bg-green-500">{data.capabilities_total_skills}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Skill-uri active</span>
                <Badge className="bg-blue-500">{data.capabilities_enabled_skills}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Toolsets totale</span>
                <Badge className="bg-purple-500">{data.capabilities_total_toolsets}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Toolsets active</span>
                <Badge className="bg-yellow-500">{data.capabilities_enabled_toolsets}</Badge>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ultima actualizare</span>
                <Badge variant="outline" className="text-xs">
                  {isoTimeAgo(data.refreshed_at || new Date().toISOString())}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Memorie disponibilă</span>
                <Badge variant="outline" className="text-xs">
                  {data.system_disk_free_gb?.toFixed(1) + " GB"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {data.gateway_gateway_running && data.gateway_gateway_platforms && Object.keys(data.gateway_gateway_platforms).length > 0 && (
        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-blue-500" />
              Conectori Platformă
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlatformsCard platforms={Object.entries(data.gateway_gateway_platforms)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}