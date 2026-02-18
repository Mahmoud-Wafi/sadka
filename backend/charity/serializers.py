from __future__ import annotations

from rest_framework import serializers

from .models import ActivityEvent, DuaMessage, Juz, Khatma, ParticipantProgress, TasbeehCounter


class JuzSerializer(serializers.ModelSerializer):
    is_reserved = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    read_url = serializers.SerializerMethodField()

    class Meta:
        model = Juz
        fields = [
            "id",
            "juz_number",
            "reserved_by",
            "reserved_at",
            "reservation_expires_at",
            "completed_by",
            "completed_at",
            "is_reserved",
            "is_completed",
            "is_expired",
            "read_url",
        ]

    def get_is_reserved(self, obj: Juz) -> bool:
        return obj.is_reserved

    def get_is_completed(self, obj: Juz) -> bool:
        return obj.is_completed

    def get_is_expired(self, obj: Juz) -> bool:
        return obj.is_expired

    def get_read_url(self, obj: Juz) -> str:
        return f"https://quran.com/juz/{obj.juz_number}"


class KhatmaSerializer(serializers.ModelSerializer):
    ajzaa = JuzSerializer(many=True)

    class Meta:
        model = Khatma
        fields = ["id", "number", "is_completed", "created_at", "completed_at", "ajzaa"]


class ReserveSerializer(serializers.Serializer):
    juz_number = serializers.IntegerField(
        min_value=1,
        max_value=30,
        error_messages={
            "required": "رقم الجزء مطلوب.",
            "invalid": "رقم الجزء غير صالح.",
            "min_value": "رقم الجزء يجب أن يكون بين 1 و30.",
            "max_value": "رقم الجزء يجب أن يكون بين 1 و30.",
        },
    )
    name = serializers.CharField(
        max_length=120,
        error_messages={
            "required": "الاسم مطلوب.",
            "blank": "الاسم لا يمكن أن يكون فارغًا.",
            "max_length": "الاسم طويل جدًا.",
        },
    )

    def validate_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("الاسم لا يمكن أن يكون فارغًا.")
        return value


class CompleteJuzSerializer(ReserveSerializer):
    pass


class TasbeehCounterSerializer(serializers.ModelSerializer):
    class Meta:
        model = TasbeehCounter
        fields = ["id", "phrase", "count"]


class TasbeehIncrementSerializer(serializers.Serializer):
    phrase = serializers.CharField(
        max_length=120,
        error_messages={
            "required": "الذكر مطلوب.",
            "blank": "الذكر لا يمكن أن يكون فارغًا.",
            "max_length": "نص الذكر طويل جدًا.",
        },
    )
    name = serializers.CharField(max_length=120, required=False, allow_blank=True, default="")

    def validate_phrase(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("الذكر مطلوب.")
        return value

    def validate_name(self, value: str) -> str:
        return value.strip()


class ActivityEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityEvent
        fields = ["id", "event_type", "message", "actor_name", "khatma_number", "juz_number", "created_at"]


class DuaMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DuaMessage
        fields = ["id", "name", "content", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("الاسم مطلوب.")
        return value

    def validate_content(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("نص الدعاء مطلوب.")
        if len(value) < 5:
            raise serializers.ValidationError("الدعاء قصير جدًا.")
        return value


class ProfileNameSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)

    def validate_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("الاسم مطلوب.")
        return value


class ParticipantProgressSerializer(serializers.ModelSerializer):
    badges = serializers.ListField(child=serializers.DictField(), read_only=True)

    class Meta:
        model = ParticipantProgress
        fields = [
            "name",
            "reservations_count",
            "completions_count",
            "tasbeeh_count",
            "updated_at",
            "badges",
        ]

