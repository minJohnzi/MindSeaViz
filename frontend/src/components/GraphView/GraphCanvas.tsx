import { useEffect, useRef, useCallback, useState } from "react";
import cytoscape, { type Core, type LayoutOptions } from "cytoscape";
import { useGraphStore } from "@/stores";
import { useGraphData } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Search,
  LayoutGrid,
  X,
} from "lucide-react";

const LAYOUTS: Record<string, LayoutOptions> = {
  cose: { name: "cose", animate: true, animationDuration: 500 } as LayoutOptions,
  breadthfirst: { name: "breadthfirst", animate: true, animationDuration: 400 } as LayoutOptions,
  circle: { name: "circle", animate: true, animationDuration: 400 } as LayoutOptions,
  concentric: { name: "concentric", animate: true, animationDuration: 400 } as LayoutOptions,
  grid: { name: "grid", animate: true, animationDuration: 400 } as LayoutOptions,
};
const LAYOUT_NAMES = Object.keys(LAYOUTS);

const NODE_STYLE = {
  selector: "node",
  style: {
    "background-color": "#6366f1",
    label: "data(title)",
    "font-size": "10px",
    "text-valign": "bottom",
    "text-halign": "center",
    color: "#475569",
    width: 8,
    height: 8,
    "border-width": 0,
    "transition-property": "background-color, width, height, border-width, border-color",
    "transition-duration": "0.2s",
  },
};

const SELECTED_STYLE = {
  selector: "node:selected",
  style: {
    "background-color": "#f59e0b",
    "border-width": 2,
    "border-color": "#f59e0b",
    width: 14,
    height: 14,
  },
};

const HIGHLIGHTED_STYLE = {
  selector: "node.highlighted",
  style: {
    "background-color": "#ef4444",
    "border-width": 3,
    "border-color": "#ef4444",
    width: 14,
    height: 14,
    "font-size": "11px",
    "z-index": 10,
  },
};

const DIMMED_STYLE = {
  selector: "node.dimmed",
  style: {
    "background-color": "#cbd5e1",
    "border-width": 1,
    "border-color": "#cbd5e1",
    "border-style": "dashed",
    width: 5,
    height: 5,
    "font-size": "8px",
    color: "#94a3b8",
    "z-index": 1,
  },
};

const EDGE_STYLE = {
  selector: "edge",
  style: {
    width: 1,
    "line-color": "#cbd5e1",
    "curve-style": "bezier",
    opacity: 0.4,
  },
};

const EDGE_HIGHLIGHTED = {
  selector: "edge.highlighted",
  style: {
    width: 2,
    "line-color": "#6366f1",
    opacity: 0.7,
    "z-index": 5,
  },
};

export function GraphCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const graphData = useGraphData();
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);
  const [search, setSearch] = useState("");
  const [layoutIdx, setLayoutIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // 初始化 Cytoscape
  useEffect(() => {
    if (!containerRef.current || cyRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      style: [
        NODE_STYLE,
        SELECTED_STYLE,
        HIGHLIGHTED_STYLE,
        DIMMED_STYLE,
        EDGE_STYLE,
        EDGE_HIGHLIGHTED,
      ],
      layout: LAYOUTS.cose,
    });
    cy.on("tap", "node", (evt) => setSelectedNodeId(evt.target.id()));
    cy.on("tap", (evt) => {
      if (evt.target === cy) setSelectedNodeId(null);
    });
    cyRef.current = cy;
    return () => { cy.destroy(); cyRef.current = null; };
  }, []);

  // 数据注入
  useEffect(() => {
    if (!cyRef.current || !graphData) return;
    const cy = cyRef.current;
    setLoading(true);
    cy.batch(() => {
      cy.elements().remove();
      graphData.nodes.forEach((n) => cy.add({ group: "nodes", data: n }));
      graphData.edges.forEach((e) => cy.add({ group: "edges", data: e }));
    });
    cy.fit(undefined, 30);
    setLoading(false);
  }, [graphData]);

  // 搜索筛选
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    if (!search.trim()) {
      cy.nodes().removeClass("dimmed");
      cy.edges().removeClass("dimmed");
      return;
    }
    const q = search.toLowerCase();
    cy.nodes().forEach((n) => {
      const title = (n.data("title") || "").toLowerCase();
      const tags = (n.data("tags") || []).join(" ").toLowerCase();
      if (title.includes(q) || tags.includes(q)) {
        n.removeClass("dimmed");
      } else {
        n.addClass("dimmed");
      }
    });
  }, [search]);

  const zoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const zoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.2);
  const fit = () => cyRef.current?.fit(undefined, 30);
  const cycleLayout = () => {
    const next = (layoutIdx + 1) % LAYOUT_NAMES.length;
    setLayoutIdx(next);
    cyRef.current?.layout(LAYOUTS[LAYOUT_NAMES[next]]).run();
  };

  const selectedNode = graphData?.nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="h-full w-full relative">
      {!graphData && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="space-y-3 text-center">
            <Skeleton className="h-48 w-48 rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">加载图谱...</p>
          </div>
        </div>
      )}

      <div ref={containerRef} className="h-full w-full" />

      {/* 顶部搜索栏 */}
      <div className="absolute top-3 left-3 w-48">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="筛选节点..."
            className="h-7 pl-7 pr-6 text-xs"
          />
          {search && (
            <button
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={() => setSearch("")}
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* 右侧控制栏 */}
      <div className="absolute top-3 right-3 flex gap-1">
        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={zoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={zoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={fit}>
          <Maximize className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          onClick={cycleLayout}
          title={`布局: ${LAYOUT_NAMES[layoutIdx]}`}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>

      {/* 布局名称提示 */}
      <div className="absolute top-14 right-3">
        <Badge variant="outline" className="text-[10px]">
          {LAYOUT_NAMES[layoutIdx]}
        </Badge>
      </div>

      {/* 底部节点信息面板 */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 bg-card border rounded-lg p-3 shadow-lg max-h-40 overflow-auto animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm">{selectedNode.title}</h3>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedNodeId(null)}>
              关闭
            </Button>
          </div>
          {selectedNode.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedNode.tags.map((t: string) => (
                <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
