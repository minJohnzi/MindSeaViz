"""SSE 聊天端点：POST /api/chat/send → event: sources + event: message + event: done。"""

import json

from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse

from models.schemas import ChatSendRequest
from api.dependencies import get_ai_agent, get_session_manager
from services.chat.agent import AIAgent
from services.chat.session import ChatSessionManager

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/sessions")
async def list_sessions(mgr: ChatSessionManager = Depends(get_session_manager)):
    return {"sessions": mgr.list_sessions()}


@router.post("/send")
async def send_message(
    req: ChatSendRequest,
    agent: AIAgent = Depends(get_ai_agent),
    mgr: ChatSessionManager = Depends(get_session_manager),
):
    # 保存用户消息
    mgr.add_message(req.session_id, "user", req.message)

    sources, queue = await agent.stream(req.message)

    async def event_stream():
        yield {"event": "sources", "data": json.dumps(sources, ensure_ascii=False)}
        full = ""
        while True:
            token = await queue.get()
            if token["type"] == "done":
                break
            if token["type"] == "error":
                yield {"event": "error", "data": json.dumps({"message": token["content"]})}
                break
            full += token["content"]
            yield {"event": "message", "data": json.dumps({"delta": token["content"]}, ensure_ascii=False)}
        # 保存 assistant 消息
        mgr.add_message(req.session_id, "assistant", full, sources)
        yield {"event": "done", "data": json.dumps({})}

    return EventSourceResponse(event_stream())


@router.get("/history/{session_id}")
async def history(session_id: str, mgr: ChatSessionManager = Depends(get_session_manager)):
    return {"messages": mgr.get_history(session_id)}


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, mgr: ChatSessionManager = Depends(get_session_manager)):
    mgr.delete(session_id)
    return {"ok": True}
