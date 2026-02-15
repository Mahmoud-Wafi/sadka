from __future__ import annotations

from typing import Any

try:
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer

    HAS_REALTIME = True
except Exception:
    HAS_REALTIME = False


def broadcast_live_event(event_type: str, payload: dict[str, Any] | None = None) -> None:
    if not HAS_REALTIME:
        return

    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return

        async_to_sync(channel_layer.group_send)(
            "live_updates",
            {
                "type": "live_event",
                "event_type": event_type,
                "payload": payload or {},
            },
        )
    except Exception:
        # لا نسمح لأي خلل في WebSocket أن يعطل الاستجابة الأساسية.
        return
