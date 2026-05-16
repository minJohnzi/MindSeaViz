import { create } from "zustand";

// Graph state
interface GraphState {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
}));

// Chat state
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
  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),
  setIsStreaming: (v) => set({ isStreaming: v }),
}));
