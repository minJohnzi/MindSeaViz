"""从解析后的 vault 笔记构建和查询 wikilinks 知识图谱。

后端使用 NetworkX 进行图算法（中心度、最短路径、邻居），
前端仅接收 {nodes, edges} JSON 做渲染。
"""

from dataclasses import dataclass, field

import networkx as nx

from core.parser.markdown import Parser
from core.vault.reader import VaultReader


@dataclass
class GraphData:
    nodes: list[dict] = field(default_factory=list)
    edges: list[dict] = field(default_factory=list)


class GraphEngine:
    """从 Obsidian wikilinks 构建和查询笔记图谱。"""

    def __init__(self, reader: VaultReader, parser: Parser):
        self.reader = reader
        self.parser = parser
        self._graph: nx.Graph | None = None

    def build(self) -> GraphData:
        """从 vault 构建完整图谱。节点 = 笔记，边 = [[wikilinks]]。"""
        self._graph = nx.Graph()
        files = self.reader.list_files()
        for f in files:
            raw = self.reader.read(f)
            note = self.parser.parse(f, raw)
            node_id = str(f)
            self._graph.add_node(node_id, title=note.title, path=node_id, tags=note.tags)
            for link in note.wikilinks:
                self._graph.add_edge(node_id, link)

        nodes = [
            {
                "id": n,
                "title": self._graph.nodes[n].get("title", n),
                "tags": self._graph.nodes[n].get("tags", []),
            }
            for n in self._graph.nodes
        ]
        edges = [{"source": u, "target": v} for u, v in self._graph.edges]
        return GraphData(nodes=nodes, edges=edges)

    def neighbors(self, node_ids: list[str], depth: int = 1) -> GraphData:
        """返回给定节点周围 depth 跳范围内的子图。"""
        if self._graph is None:
            self.build()
        sub_nodes: set[str] = set(node_ids)
        frontier = set(node_ids)
        for _ in range(depth):
            next_frontier: set[str] = set()
            for n in frontier:
                if n in self._graph:
                    next_frontier.update(set(self._graph.neighbors(n)) - sub_nodes)
            sub_nodes.update(next_frontier)
            frontier = next_frontier

        nodes = [
            {"id": n, "title": self._graph.nodes[n].get("title", n)}
            for n in sub_nodes if n in self._graph
        ]
        sub = self._graph.subgraph(sub_nodes)
        edges = [{"source": u, "target": v} for u, v in sub.edges]
        return GraphData(nodes=nodes, edges=edges)

    def shortest_path(self, source: str, target: str) -> list[str] | None:
        """查找两篇笔记之间通过 wikilinks 的最短路径。"""
        if self._graph is None:
            self.build()
        try:
            return nx.shortest_path(self._graph, source, target)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None
