import { create } from "zustand";
import type { GraphData } from "@/lib/graph-renderer";

export type View = "graph" | "dashboard" | "chat" | "settings";

// ── Navigation ──

interface NavState {
  view: View;
  setView: (v: View) => void;
}

export const useNavStore = create<NavState>((set) => ({
  view: "graph",
  setView: (v) => set({ view: v }),
}));

// ── Graph ──

interface GraphState {
  graphData: GraphData | null;
  selectedNodeId: string | null;
  setGraphData: (d: GraphData) => void;
  setSelectedNodeId: (id: string | null) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  graphData: null,
  selectedNodeId: null,
  setGraphData: (d) => set({ graphData: d }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
}));

// ── Dashboard ──

interface StatsOverview {
  total_notes: number;
  total_tags: number;
  total_links: number;
  tag_counts: Array<{ tag: string; count: number }>;
  note_type_distribution: Record<string, number>;
  orphan_count: number;
}

interface DashboardState {
  stats: StatsOverview | null;
  orphans: Array<{ path: string; title: string; tags: string[] }>;
  recent: Array<{ path: string; title: string; modified: string }>;
  setStats: (s: StatsOverview) => void;
  setOrphans: (o: DashboardState["orphans"]) => void;
  setRecent: (r: DashboardState["recent"]) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  orphans: [],
  recent: [],
  setStats: (s) => set({ stats: s }),
  setOrphans: (o) => set({ orphans: o }),
  setRecent: (r) => set({ recent: r }),
}));

// ── Chat ──

interface ChatState {
  sessionId: string | null;
  messages: Array<{ role: string; content: string }>;
  isStreaming: boolean;
  setSessionId: (id: string) => void;
  addMessage: (msg: { role: string; content: string }) => void;
  setIsStreaming: (v: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessionId: null,
  messages: [],
  isStreaming: false,
  setSessionId: (id) => set({ sessionId: id }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setIsStreaming: (v) => set({ isStreaming: v }),
}));
