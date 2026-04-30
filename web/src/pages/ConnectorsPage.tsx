import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import {
  ConnectorField,
  ConnectorInfo,
  api,
} from "@/lib/api";
import { AlertCircle, CheckCircle, Wifi, WifiOff, Settings, ExternalLink, Zap } from "lucide-react";

const STATUS_COLORS: Record<string, { badge: string; text: string; icon: any }> = {
  connected: { badge: "bg-green-500", text: "Conectat", icon: Wifi },
  disconnected: { badge: "bg-yellow-500", text: "Deconectat", icon: WifiOff },
  configuring: { badge: "bg-blue-500", text: "Configurare", icon: Settings },
  error: { badge: "bg-red-500", text: "Eroare", icon: AlertCircle },
};

export default function ConnectorsPage() {
  const { toast } = useToast();
  const [connectors, setConnectors] = useState<ConnectorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    try {
      const response = await api.getConnectors();
      setConnectors(response.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la încărcarea conectorilor";
      toast({
        title: "Eroare",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleConnector = async (key: string, enabled: boolean) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await api.updateConnector(key, { enabled });
      toast({
        title: "Reușit",
        description: enabled
          ? `Conectorul ${key} a fost activat`
          : `Conectorul ${key} a fost dezactivat`,
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
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSaveField = async (key: string, fieldName: string, value: string) => {
    const connector = connectors.find((c) => c.key === key);
    if (!connector) return;

    const values = connector.fields.reduce(
      (acc, field) => {
        acc[field.name] = field.value;
        return acc;
      },
      {} as Record<string, string>
    );

    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await api.updateConnector(key, { values });
      toast({
        title: "Reușit",
        description: `Valoarea a fost salvată`,
        variant: "success",
      });
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la salvare";
      toast({
        title: "Eroare",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Se încarcă conectorii...
          </CardContent>
        </Card>
      </div>
    );
  }

  const ConnectionCard = ({ connector }: { connector: ConnectorInfo }) => {
    const status = STATUS_COLORS[connector.state] || STATUS_COLORS.disconnected;
    const StatusIcon = status.icon;
    const isSaving = saving[connector.key];

    return (
      <Card className="border-2 transition-all hover:border-primary/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${status.badge} bg-opacity-10`}>
                <StatusIcon
                  className={`h-5 w-5 ${
                    status.badge === "bg-red-500"
                      ? "text-red-500"
                      : "text-current"
                  }`}
                />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {connector.label}
                  <Badge variant={connector.enabled ? "default" : "outline"}>
                    {connector.enabled ? "Activ" : "Inactiv"}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{connector.key}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connector.connected && (
                <Badge className="bg-green-500 text-white text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Conectat
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving || !connector.enabled}
                onClick={() =>
                  handleToggleConnector(connector.key, !connector.enabled)
                }
              >
                {isSaving ? "Se salvează..." : connector.enabled ? "Dezactivați" : "Activați"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {connector.setup_instructions &&
            connector.setup_instructions.length > 0 && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Instrucțiuni de configurare:
                </p>
                <ul className="space-y-1">
                  {connector.setup_instructions.map((instruction, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2"
                    >
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {connector.fields && connector.fields.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                Configurare
              </p>
              <div className="space-y-3">
                {connector.fields.map((field) => (
                  <div key={field.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {field.label}
                        {field.password && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (Parolă)
                          </span>
                        )}
                      </label>
                      {field.is_set && (
                        <Badge variant="outline" className="text-xs">
                          Configurat
                        </Badge>
                      )}
                    </div>
                    <input
                      type={field.password ? "password" : "text"}
                      value={field.value}
                      onChange={(e) => handleSaveField(connector.key, field.name, e.target.value)}
                      disabled={isSaving || !connector.enabled}
                      className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                    {field.help && (
                      <p className="text-xs text-muted-foreground">
                        {field.help}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>{connector.state}</span>
            {connector.home_channel && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Canal:</span>
                <Badge variant="outline" className="text-xs">
                  {connector.home_channel.name}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestionare Conectori</h1>
          <p className="text-muted-foreground">Configurare și monitorizare conectori platformă</p>
        </div>
        <div className="flex gap-2">
          <a
            href="https://github.com/Luana-AI/hermes-agent/blob/main/docs/gateway/ADDITIONING_A_PLATFORM.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            Adăugă Conector
          </a>
        </div>
      </div>

      <div className="grid gap-6">
        {connectors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <WifiOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Niciun conector configurat</h3>
              <p className="text-muted-foreground mb-4">
                Configurați primul conector pentru a începe
              </p>
              <a
                href="https://github.com/Luana-AI/hermes-agent/blob/main/docs/gateway/ADDITIONING_A_PLATFORM.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Citește documentația
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {connectors.map((connector) => (
              <ConnectionCard key={connector.key} connector={connector} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}