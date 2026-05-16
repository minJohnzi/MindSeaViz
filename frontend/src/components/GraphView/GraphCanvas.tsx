import { useEffect, useRef, useCallback } from "react";
import cytoscape, { type Core } from "cytoscape";
import { useGraphStore } from "@/stores";
import { useGraphData } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

export function GraphCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const graphData = useGraphData();
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);

  // 初始化 Cytoscape 实例
  useEffect(() => {
    if (!containerRef.current || cyRef.current) return;
    cyRef.current = cytoscape({
      container: containerRef.current,
      style: [
        {
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
          },
        },
        {
          selector: "node:selected",
          style: {
            "background-color": "#f59e0b",
            "border-width": 2,
            "border-color": "#f59e0b",
            width: 12,
            height: 12,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "#cbd5e1",
            "curve-style": "bezier",
            opacity: 0.5,
          },
        },
      ],
      layout: { name: "cose", animate: false },
    });

    cyRef.current.on("tap", "node", (evt) => {
      setSelectedNodeId(evt.target.id());
    });
    cyRef.current.on("tap", (evt) => {
      if (evt.target === cyRef.current) setSelectedNodeId(null);
    });

    return () => {
      cyRef.current?.destroy();
      cyRef.current = null;
    };
  }, []);

  // 数据注入
  useEffect(() => {
    if (!cyRef.current || !graphData) return;
    const cy = cyRef.current;
    cy.batch(() => {
      cy.elements().remove();
      graphData.nodes.forEach((n) => {
        cy.add({ group: "nodes", data: n });
      });
      graphData.edges.forEach((e) => {
        cy.add({ group: "edges", data: e });
      });
    });
    cy.fit(undefined, 30);
  }, [graphData]);

  const zoomIn = useCallback(() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2), []);
  const zoomOut = useCallback(() => cyRef.current?.zoom(cyRef.current.zoom() / 1.2), []);
  const fit = useCallback(() => cyRef.current?.fit(undefined, 30), []);

  // 选中节点信息
  const selectedNode = graphData?.nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="h-full w-full relative">
      <div ref={containerRef} className="h-full w-full" />

      {/* 控制栏 */}
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
      </div>

      {/* 节点信息面板 */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 bg-card border rounded-lg p-3 shadow-lg max-h-40 overflow-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{selectedNode.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setSelectedNodeId(null)}
            >
              关闭
            </Button>
          </div>
          {selectedNode.tags && selectedNode.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedNode.tags.map((t: string) => (
                <Badge key={t} variant="secondary" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
