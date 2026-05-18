import { create } from "zustand";
import type { GraphData } from "@/lib/graph-renderer";

export type View = "graph" | "dashboard" | "chat" | "settings";

// ── Theme ──

type Theme = "dark" | "light";

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem("mindsea-theme");
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
};

const applyTheme = (t: Theme) => {
  document.documentElement.classList.toggle("dark", t === "dark");
};

applyTheme(getInitialTheme());

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((s) => {
      const next: Theme = s.theme === "dark" ? "light" : "dark";
      localStorage.setItem("mindsea-theme", next);
      applyTheme(next);
      return { theme: next };
    }),
}));

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

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    note_path: string;
    title: string;
    chunk: string;
    score: number;
  }>;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

interface ChatState {
  sessionId: string | null;
  sessions: ChatSession[];
  messages: ChatMessage[];
  currentSources: ChatMessage["sources"];
  isStreaming: boolean;
  streamingContent: string;
  setSessionId: (id: string) => void;
  setSessions: (s: ChatSession[]) => void;
  addSession: (s: ChatSession) => void;
  setMessages: (m: ChatMessage[]) => void;
  addMessage: (m: ChatMessage) => void;
  setCurrentSources: (s: ChatMessage["sources"]) => void;
  setIsStreaming: (v: boolean) => void;
  appendStreaming: (delta: string) => void;
  commitStreaming: (sources: ChatMessage["sources"]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessionId: null,
  sessions: [],
  messages: [],
  currentSources: undefined,
  isStreaming: false,
  streamingContent: "",
  setSessionId: (id) => set({ sessionId: id }),
  setSessions: (s) => set({ sessions: s }),
  addSession: (s) => set((st) => ({ sessions: [s, ...st.sessions] })),
  setMessages: (m) => set({ messages: m }),
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  setCurrentSources: (s) => set({ currentSources: s }),
  setIsStreaming: (v) => set({ isStreaming: v }),
  appendStreaming: (delta) =>
    set((s) => ({ streamingContent: s.streamingContent + delta })),
  commitStreaming: (sources) => {
    const content = get().streamingContent;
    set({
      messages: [
        ...get().messages,
        { role: "assistant", content, sources },
      ],
      streamingContent: "",
      isStreaming: false,
      currentSources: undefined,
    });
  },
}));
