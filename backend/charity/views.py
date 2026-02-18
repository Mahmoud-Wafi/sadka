from __future__ import annotations

from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ActivityEvent, DuaMessage, Juz, Khatma, TasbeehCounter
from .realtime import broadcast_live_event
from .serializers import (
    ActivityEventSerializer,
    CompleteJuzSerializer,
    DuaMessageSerializer,
    JuzSerializer,
    KhatmaSerializer,
    ProfileNameSerializer,
    ReserveSerializer,
    TasbeehCounterSerializer,
    TasbeehIncrementSerializer,
)
from .services import (
    add_dua_message,
    complete_juz,
    ensure_default_tasbeeh_phrases,
    fetch_juz_content,
    get_daily_wird,
    get_khatma_history,
    get_or_create_current_khatma,
    get_pending_reminders,
    get_profile_stats,
    increment_tasbeeh_phrase,
    release_expired_reservations,
    reservation_expiry_hours,
    reserve_juz,
)


class CurrentKhatmaView(APIView):
    def get(self, request):
        khatma = get_or_create_current_khatma()
        expired = release_expired_reservations(khatma=khatma)
        if expired:
            broadcast_live_event(
                "reservation_expired",
                {"count": len(expired), "khatma_number": khatma.number},
            )

        serializer = KhatmaSerializer(khatma)
        reserved_count = Juz.objects.filter(khatma=khatma, reserved_by__isnull=False, completed_at__isnull=True).count()
        completed_count = Juz.objects.filter(khatma=khatma, completed_at__isnull=False).count()
        return Response(
            {
                "khatma": serializer.data,
                "reserved_count": reserved_count,
                "completed_count": completed_count,
                "total_juz": 30,
                "reservation_expiry_hours": reservation_expiry_hours(),
            }
        )


class ReserveJuzView(APIView):
    def post(self, request):
        serializer = ReserveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = reserve_juz(
                juz_number=serializer.validated_data["juz_number"],
                name=serializer.validated_data["name"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        reserved_serializer = JuzSerializer(result["reserved_juz"])
        participant = get_profile_stats(serializer.validated_data["name"])

        broadcast_live_event(
            "khatma_reserved",
            {
                "khatma_number": result["current_khatma"].number,
                "juz_number": result["reserved_juz"].juz_number,
                "reserved_by": result["reserved_juz"].reserved_by,
                "reservation_expires_at": result["reserved_juz"].reservation_expires_at.isoformat()
                if result["reserved_juz"].reservation_expires_at
                else None,
            },
        )
        return Response(
            {
                "detail": "تم حجز الجزء بنجاح.",
                "reserved_juz": reserved_serializer.data,
                "khatma_number": result["current_khatma"].number,
                "khatma_completed_now": result["khatma_completed_now"],
                "next_khatma_number": result["next_khatma_number"],
                "participant_stats": participant,
            },
            status=status.HTTP_201_CREATED,
        )


class CompleteJuzView(APIView):
    def post(self, request):
        serializer = CompleteJuzSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = complete_juz(
                juz_number=serializer.validated_data["juz_number"],
                name=serializer.validated_data["name"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        completed_serializer = JuzSerializer(result["completed_juz"])
        participant = get_profile_stats(serializer.validated_data["name"])

        broadcast_live_event(
            "juz_completed",
            {
                "khatma_number": result["current_khatma"].number,
                "juz_number": result["completed_juz"].juz_number,
                "completed_by": result["completed_juz"].completed_by,
                "khatma_completed_now": result["khatma_completed_now"],
                "next_khatma_number": result["next_khatma_number"],
            },
        )

        return Response(
            {
                "detail": "تم تسجيل الجزء كمكتمل. جزاكم الله خيرًا.",
                "completed_juz": completed_serializer.data,
                "khatma_number": result["current_khatma"].number,
                "khatma_completed_now": result["khatma_completed_now"],
                "next_khatma_number": result["next_khatma_number"],
                "participant_stats": participant,
            },
            status=status.HTTP_200_OK,
        )


class StatsView(APIView):
    def get(self, request):
        current = get_or_create_current_khatma()
        release_expired_reservations(khatma=current)
        now = timezone.now()
        total_completed = Khatma.objects.filter(is_completed=True).count()
        reserved_count = Juz.objects.filter(khatma=current, reserved_by__isnull=False, completed_at__isnull=True).count()
        completed_count = Juz.objects.filter(khatma=current, completed_at__isnull=False).count()
        total_participants = (
            Juz.objects.exclude(reserved_by__isnull=True)
            .exclude(reserved_by="")
            .values("reserved_by")
            .distinct()
            .count()
        )
        due_soon_count = Juz.objects.filter(
            khatma=current,
            completed_at__isnull=True,
            reservation_expires_at__gt=now,
            reservation_expires_at__lte=now + timedelta(minutes=60),
        ).count()

        return Response(
            {
                "total_completed_khatmas": total_completed,
                "current_khatma_number": current.number,
                "reserved_count": reserved_count,
                "completed_count": completed_count,
                "total_participants": total_participants,
                "due_soon_count": due_soon_count,
            }
        )


class TasbeehView(APIView):
    def get(self, request):
        ensure_default_tasbeeh_phrases()
        counters = TasbeehCounter.objects.all()
        serializer = TasbeehCounterSerializer(counters, many=True)
        return Response(serializer.data)

    def post(self, request):
        ensure_default_tasbeeh_phrases()
        serializer = TasbeehIncrementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            counter = increment_tasbeeh_phrase(
                phrase=serializer.validated_data["phrase"],
                name=serializer.validated_data.get("name", ""),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        output = TasbeehCounterSerializer(counter)
        broadcast_live_event(
            "tasbeeh_incremented",
            {
                "phrase": counter.phrase,
                "count": counter.count,
            },
        )
        return Response(output.data, status=status.HTTP_200_OK)


class ActivityFeedView(APIView):
    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", 30))
        except ValueError:
            limit = 30
        limit = min(max(limit, 5), 100)
        events = ActivityEvent.objects.all()[:limit]
        serializer = ActivityEventSerializer(events, many=True)
        return Response(serializer.data)


class DuaWallView(APIView):
    def get(self, request):
        messages = DuaMessage.objects.filter(is_approved=True)[:80]
        serializer = DuaMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DuaMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            dua = add_dua_message(
                name=serializer.validated_data["name"],
                content=serializer.validated_data["content"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        broadcast_live_event(
            "dua_added",
            {
                "name": dua.name,
                "content": dua.content,
                "created_at": dua.created_at.isoformat(),
            },
        )
        return Response(DuaMessageSerializer(dua).data, status=status.HTTP_201_CREATED)


class ProfileStatsView(APIView):
    def get(self, request):
        serializer = ProfileNameSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        try:
            data = get_profile_stats(serializer.validated_data["name"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(data)


class KhatmaHistoryView(APIView):
    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", 20))
        except ValueError:
            limit = 20
        limit = min(max(limit, 1), 100)
        history = get_khatma_history(limit=limit)
        return Response(history)


class DailyWirdView(APIView):
    def get(self, request):
        return Response(get_daily_wird())


class ReminderView(APIView):
    def get(self, request):
        serializer = ProfileNameSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        try:
            result = get_pending_reminders(serializer.validated_data["name"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result)


class JuzContentView(APIView):
    def get(self, request, juz_number: int):
        try:
            content = fetch_juz_content(juz_number)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except ConnectionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(content, status=status.HTTP_200_OK)
