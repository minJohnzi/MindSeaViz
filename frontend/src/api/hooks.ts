import { useEffect } from "react";
import { apiGet, apiPost } from "./client";
import { useGraphStore, useDashboardStore, useChatStore } from "@/stores";
import type { ChatSession } from "@/stores";

// ── Graph ──

export function useGraphData() {
  const setGraphData = useGraphStore((s) => s.setGraphData);
  const graphData = useGraphStore((s) => s.graphData);

  useEffect(() => {
    if (!graphData) {
      apiGet<{ nodes: unknown[]; edges: unknown[] }>("/api/graph").then(
        (data) => setGraphData(data)
      );
    }
  }, []);

  return graphData;
}

// ── Dashboard ──

export function useStats() {
  const { stats, setStats, orphans, setOrphans, recent, setRecent } =
    useDashboardStore();

  useEffect(() => {
    if (!stats) {
      apiGet<ReturnType<typeof useDashboardStore.getState>["stats"]>(
        "/api/stats/overview"
      ).then(setStats);
    }
  }, []);

  useEffect(() => {
    if (orphans.length === 0) {
      apiGet<{ orphans: typeof orphans }>("/api/stats/orphans").then((d) =>
        setOrphans(d.orphans)
      );
    }
  }, []);

  useEffect(() => {
    if (recent.length === 0) {
      apiGet<{ recent: typeof recent }>("/api/stats/recent").then((d) =>
        setRecent(d.recent)
      );
    }
  }, []);

  return { stats, orphans, recent };
}

// ── Chat Sessions ──

export function useChatSessions() {
  const { sessions, setSessions, sessionId, setSessionId } = useChatStore();

  const loadSessions = () => {
    apiGet<{ sessions: ChatSession[] }>("/api/chat/sessions").then((d) =>
      setSessions(d.sessions)
    );
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const createSession = async (title?: string) => {
    // 会话创建在前端做（后端在第一次发消息时自动创建）
    const id = crypto.randomUUID().slice(0, 12);
    setSessionId(id);
    return id;
  };

  const selectSession = async (id: string) => {
    setSessionId(id);
    const data = await apiGet<{ messages: Array<{ role: string; content: string; sources?: unknown }> }>(
      `/api/chat/history/${id}`
    );
    useChatStore.getState().setMessages(
      data.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        sources: m.sources as ChatMessage["sources"],
      }))
    );
  };

  return { sessions, sessionId, loadSessions, createSession, selectSession };
}

import type { ChatMessage } from "@/stores";
