import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, Check, FolderOpen, Cpu, Search, Server } from "lucide-react";

interface AppConfig {
  vault: { path: string; ignore_patterns: string[] };
  server: { host: string; port: number };
  ai: { provider: string; model: string; api_key_env: string };
  embedding: { model: string; device: string; onnx: boolean };
  search: { hybrid: { algorithm: string; rrf_k: number }; top_k: number };
  index: { auto_index: boolean; debounce_ms: number };
}

export function SettingsPanel() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiGet<AppConfig>("/api/config").then(setConfig);
  }, []);

  const update = useCallback(
    (path: string, value: unknown) => {
      if (!config) return;
      const keys = path.split(".");
      const next = { ...config };
      let obj: Record<string, unknown> = next as unknown as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]] as Record<string, unknown>;
      }
      obj[keys[keys.length - 1]] = value;
      setConfig(next);
      setDirty(true);
      setSaved(false);
    },
    [config]
  );

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await apiPost("/api/config", config);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    apiGet<AppConfig>("/api/config").then((c) => {
      setConfig(c);
      setDirty(false);
    });
  };

  if (!config) return null;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto p-8 space-y-8">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight mb-1">设置</h2>
            <p className="text-sm text-muted-foreground">管理 MindSeaViz 的运行配置</p>
          </div>
          <div className="flex gap-2">
            {dirty && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1.5" />
                重置
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
              {saved ? (
                <Check className="h-4 w-4 mr-1.5" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              {saving ? "保存中..." : saved ? "已保存" : "保存"}
            </Button>
          </div>
        </div>

        {/* Vault */}
        <Section icon={<FolderOpen className="h-4 w-4" />} title="笔记库">
          <Field label="Vault 路径">
            <Input
              value={config.vault.path}
              onChange={(e) => update("vault.path", e.target.value)}
              className="text-sm"
            />
          </Field>
          <Field label="忽略目录">
            <Input
              value={config.vault.ignore_patterns.join(", ")}
              onChange={(e) =>
                update(
                  "vault.ignore_patterns",
                  e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                )
              }
              className="text-sm"
              placeholder=".git, .obsidian, _templates"
            />
          </Field>
        </Section>

        {/* AI */}
        <Section icon={<Cpu className="h-4 w-4" />} title="AI 模型">
          <Field label="提供商">
            <Input value={config.ai.provider} disabled className="text-sm" />
          </Field>
          <Field label="模型">
            <Input
              value={config.ai.model}
              onChange={(e) => update("ai.model", e.target.value)}
              className="text-sm"
            />
          </Field>
          <Field label="API Key">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {config.ai.api_key_env}
              </Badge>
              <span className="text-xs text-muted-foreground">
                在 .env 文件中设置
              </span>
            </div>
          </Field>
        </Section>

        {/* Embedding */}
        <Section icon={<Cpu className="h-4 w-4" />} title="嵌入模型">
          <Field label="模型">
            <Input value={config.embedding.model} disabled className="text-sm" />
          </Field>
          <Field label="设备">
            <Input
              value={config.embedding.device}
              onChange={(e) => update("embedding.device", e.target.value)}
              className="text-sm"
              placeholder="cpu / cuda"
            />
          </Field>
          <Field label="ONNX 加速">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={config.embedding.onnx}
                onChange={(e) => update("embedding.onnx", e.target.checked)}
                className="rounded"
              />
              启用 ONNX Runtime
            </label>
          </Field>
        </Section>

        {/* Search */}
        <Section icon={<Search className="h-4 w-4" />} title="搜索">
          <Field label="融合算法">
            <Input value={config.search.hybrid.algorithm} disabled className="text-sm" />
          </Field>
          <Field label="RRF 平滑常数 (k)">
            <Input
              type="number"
              value={config.search.hybrid.rrf_k}
              onChange={(e) => update("search.hybrid.rrf_k", Number(e.target.value))}
              className="text-sm"
            />
          </Field>
          <Field label="返回数量 (top_k)">
            <Input
              type="number"
              value={config.search.top_k}
              onChange={(e) => update("search.top_k", Number(e.target.value))}
              className="text-sm"
            />
          </Field>
        </Section>

        {/* Server (只读) */}
        <Section icon={<Server className="h-4 w-4" />} title="服务">
          <Field label="地址">
            <Input value={config.server.host} disabled className="text-sm" />
          </Field>
          <Field label="端口">
            <Input value={config.server.port} disabled className="text-sm" />
          </Field>
        </Section>

        {/* 索引 */}
        <Section icon={<Search className="h-4 w-4" />} title="索引">
          <Field label="自动索引">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={config.index.auto_index}
                onChange={(e) => update("index.auto_index", e.target.checked)}
                className="rounded"
              />
              监听 vault 文件变更自动重建索引
            </label>
          </Field>
          <Field label="防抖延迟 (ms)">
            <Input
              type="number"
              value={config.index.debounce_ms}
              onChange={(e) => update("index.debounce_ms", Number(e.target.value))}
              className="text-sm"
            />
          </Field>
        </Section>

        {/* 底部留白 */}
        <div className="h-16" />
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
        {icon}
        {title}
      </h3>
      <div className="space-y-3 pl-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-muted-foreground shrink-0 w-28">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
