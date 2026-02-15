from django.db.models import F
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Juz, Khatma, TasbeehCounter
from .realtime import broadcast_live_event
from .serializers import (
    JuzSerializer,
    KhatmaSerializer,
    ReserveSerializer,
    TasbeehCounterSerializer,
    TasbeehIncrementSerializer,
)
from .services import ensure_default_tasbeeh_phrases, fetch_juz_content, get_or_create_current_khatma, reserve_juz


class CurrentKhatmaView(APIView):
    def get(self, request):
        khatma = get_or_create_current_khatma()
        serializer = KhatmaSerializer(khatma)
        reserved_count = Juz.objects.filter(khatma=khatma, reserved_by__isnull=False).count()
        return Response(
            {
                "khatma": serializer.data,
                "reserved_count": reserved_count,
                "total_juz": 30,
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
        broadcast_live_event(
            "khatma_reserved",
            {
                "khatma_number": result["current_khatma"].number,
                "juz_number": result["reserved_juz"].juz_number,
                "reserved_by": result["reserved_juz"].reserved_by,
                "khatma_completed_now": result["khatma_completed_now"],
                "next_khatma_number": result["next_khatma_number"],
            },
        )
        return Response(
            {
                "detail": "تم حجز الجزء بنجاح.",
                "reserved_juz": reserved_serializer.data,
                "khatma_number": result["current_khatma"].number,
                "khatma_completed_now": result["khatma_completed_now"],
                "next_khatma_number": result["next_khatma_number"],
            },
            status=status.HTTP_201_CREATED,
        )


class StatsView(APIView):
    def get(self, request):
        current = get_or_create_current_khatma()
        total_completed = Khatma.objects.filter(is_completed=True).count()
        reserved_count = Juz.objects.filter(khatma=current, reserved_by__isnull=False).count()
        total_participants = (
            Juz.objects.exclude(reserved_by__isnull=True)
            .exclude(reserved_by="")
            .values("reserved_by")
            .distinct()
            .count()
        )

        return Response(
            {
                "total_completed_khatmas": total_completed,
                "current_khatma_number": current.number,
                "reserved_count": reserved_count,
                "total_participants": total_participants,
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

        phrase = serializer.validated_data["phrase"]
        counter, _ = TasbeehCounter.objects.get_or_create(phrase=phrase)
        counter.count = F("count") + 1
        counter.save(update_fields=["count"])
        counter.refresh_from_db()

        output = TasbeehCounterSerializer(counter)
        broadcast_live_event(
            "tasbeeh_incremented",
            {
                "phrase": counter.phrase,
                "count": counter.count,
            },
        )
        return Response(output.data, status=status.HTTP_200_OK)


class JuzContentView(APIView):
    def get(self, request, juz_number: int):
        try:
            content = fetch_juz_content(juz_number)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except ConnectionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(content, status=status.HTTP_200_OK)
