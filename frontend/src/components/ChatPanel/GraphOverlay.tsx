import { useEffect, useRef, useState } from "react";
import cytoscape, { type Core } from "cytoscape";
import { useChatStore } from "@/stores";
import { apiGet } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, GitGraph } from "lucide-react";

interface GraphData {
  nodes: Array<{ id: string; title: string; tags?: string[] }>;
  edges: Array<{ source: string; target: string }>;
}

export function GraphOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const { currentSources, messages, isStreaming } = useChatStore();
  const [expanded, setExpanded] = useState(false);
  const [overlayData, setOverlayData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);

  // 从 RAG sources 提取需要高亮的节点 ID
  const sourceIds = currentSources?.map((s) => s.note_path) ?? [];

  // 有 sources 时自动获取邻居子图
  useEffect(() => {
    if (!sourceIds.length) return;
    setLoading(true);
    const ids = sourceIds.join(",");
    apiGet<GraphData>(`/api/graph/neighbors?ids=${encodeURIComponent(ids)}&depth=1`)
      .then((data) => {
        setOverlayData(data);
        setExpanded(true);
      })
      .catch(() => setOverlayData(null))
      .finally(() => setLoading(false));
  }, [currentSources]);

  // 初始化 Cytoscape mini 图
  useEffect(() => {
    if (!containerRef.current || cyRef.current) return;
    cyRef.current = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#cbd5e1",
            width: 6,
            height: 6,
            label: "data(title)",
            "font-size": "8px",
            "text-valign": "bottom",
            "text-halign": "center",
            color: "#94a3b8",
          },
        },
        {
          selector: "node.source",
          style: {
            "background-color": "#ef4444",
            "border-width": 2,
            "border-color": "#dc2626",
            width: 10,
            height: 10,
            "font-size": "9px",
            color: "#dc2626",
            "font-weight": "bold",
          },
        },
        {
          selector: "node.neighbor",
          style: {
            "background-color": "#94a3b8",
            "border-width": 1,
            "border-color": "#cbd5e1",
            "border-style": "dashed",
            width: 5,
            height: 5,
            "font-size": "7px",
            opacity: 0.6,
          },
        },
        {
          selector: "edge",
          style: {
            width: 0.5,
            "line-color": "#e2e8f0",
            "curve-style": "bezier",
          },
        },
      ],
      layout: { name: "cose", animate: false, nodeRepulsion: 20000 },
      userPanningEnabled: false,
      userZoomingEnabled: false,
      boxSelectionEnabled: false,
    });
    return () => {
      cyRef.current?.destroy();
      cyRef.current = null;
    };
  }, []);

  // 注入图数据
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !overlayData) return;
    cy.batch(() => {
      cy.elements().remove();
      overlayData.nodes.forEach((n) => {
        const isSource = sourceIds.includes(n.id);
        cy.add({
          group: "nodes",
          data: n,
          classes: isSource ? "source" : "neighbor",
        });
      });
      overlayData.edges.forEach((e) => cy.add({ group: "edges", data: e }));
    });
    cy.fit(undefined, 20);
  }, [overlayData, sourceIds]);

  // 没有数据时不渲染
  const totalSources = messages.filter((m) => m.sources?.length).length;
  if (!currentSources?.length && totalSources === 0) return null;

  return (
    <div className="border-t bg-muted/20">
      {/* 折叠头 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-muted/50 text-xs"
      >
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <GitGraph className="h-3.5 w-3.5" />
          知识图谱
          {currentSources && (
            <Badge variant="secondary" className="text-[10px] h-4">
              {currentSources.length} 篇引用
            </Badge>
          )}
        </span>
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
      </button>

      {/* 图谱面板 */}
      {expanded && (
        <div className="px-2 pb-2">
          {loading ? (
            <div className="h-36 flex items-center justify-center text-xs text-muted-foreground">
              加载中...
            </div>
          ) : (
            <div className="relative">
              {/* 图例 */}
              <div className="absolute top-1 left-1 z-10 flex gap-2 text-[9px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  RAG 引用
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 border border-dashed border-slate-300" />
                  wikilink 邻居
                </span>
              </div>
              <div ref={containerRef} className="h-36 w-full rounded border bg-background" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
