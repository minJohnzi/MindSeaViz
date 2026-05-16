/** 图渲染器抽象接口 — 当前使用 Cytoscape.js，未来可通过适配器替换 */
export interface IGraphRenderer {
  mount(container: HTMLElement): void;
  setData(nodes: GraphNode[], edges: GraphEdge[]): void;
  destroy(): void;
}

export interface GraphNode {
  id: string;
  title: string;
  tags?: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
}
