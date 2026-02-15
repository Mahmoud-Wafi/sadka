from channels.generic.websocket import AsyncJsonWebsocketConsumer


class LiveUpdatesConsumer(AsyncJsonWebsocketConsumer):
    group_name = "live_updates"

    async def connect(self):
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({"type": "connected", "detail": "live_updates_connected"})

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def live_event(self, event):
        await self.send_json(
            {
                "type": event.get("event_type", "update"),
                "payload": event.get("payload", {}),
            }
        )
