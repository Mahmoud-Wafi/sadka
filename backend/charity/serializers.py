from rest_framework import serializers

from .models import Juz, Khatma, TasbeehCounter


class JuzSerializer(serializers.ModelSerializer):
    is_reserved = serializers.SerializerMethodField()
    read_url = serializers.SerializerMethodField()

    class Meta:
        model = Juz
        fields = ["id", "juz_number", "reserved_by", "reserved_at", "is_reserved", "read_url"]

    def get_is_reserved(self, obj: Juz) -> bool:
        return bool(obj.reserved_by)

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

    def validate_phrase(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("الذكر مطلوب.")
        return value
