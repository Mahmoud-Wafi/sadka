from django.core.validators import MaxLengthValidator, MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


class Khatma(models.Model):
    number = models.PositiveIntegerField(unique=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-number"]

    def __str__(self) -> str:
        return f"الختمة رقم {self.number}"


class Juz(models.Model):
    khatma = models.ForeignKey(Khatma, on_delete=models.CASCADE, related_name="ajzaa")
    juz_number = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(30)])
    reserved_by = models.CharField(max_length=120, null=True, blank=True)
    reserved_at = models.DateTimeField(null=True, blank=True)
    reservation_expires_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.CharField(max_length=120, null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["juz_number"]
        constraints = [
            models.UniqueConstraint(fields=["khatma", "juz_number"], name="unique_juz_per_khatma"),
            models.CheckConstraint(
                check=(Q(reserved_by__isnull=True, reserved_at__isnull=True) | Q(reserved_by__isnull=False, reserved_at__isnull=False)),
                name="juz_reservation_consistency",
            ),
        ]

    def __str__(self) -> str:
        return f"الجزء {self.juz_number} - الختمة {self.khatma.number}"

    @property
    def is_reserved(self) -> bool:
        return bool(self.reserved_by)

    @property
    def is_completed(self) -> bool:
        return self.completed_at is not None

    @property
    def is_expired(self) -> bool:
        return bool(
            self.reservation_expires_at
            and self.completed_at is None
            and timezone.now() >= self.reservation_expires_at
        )


class TasbeehCounter(models.Model):
    phrase = models.CharField(max_length=120, unique=True)
    count = models.PositiveBigIntegerField(default=0)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.phrase}: {self.count}"


class ActivityEvent(models.Model):
    RESERVE = "reserve"
    COMPLETE = "complete"
    TASBEEH = "tasbeeh"
    DUA = "dua"
    EXPIRE = "expire"

    EVENT_CHOICES = [
        (RESERVE, "حجز"),
        (COMPLETE, "إنجاز"),
        (TASBEEH, "تسبيح"),
        (DUA, "دعاء"),
        (EXPIRE, "انتهاء حجز"),
    ]

    event_type = models.CharField(max_length=20, choices=EVENT_CHOICES)
    message = models.CharField(max_length=255)
    actor_name = models.CharField(max_length=120, blank=True, default="")
    khatma_number = models.PositiveIntegerField(null=True, blank=True)
    juz_number = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(30)],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["event_type", "-created_at"]),
        ]

    def __str__(self) -> str:
        return self.message


class DuaMessage(models.Model):
    name = models.CharField(max_length=120)
    content = models.TextField(validators=[MaxLengthValidator(500)])
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"دعاء من {self.name}"


class ParticipantProgress(models.Model):
    name = models.CharField(max_length=120, unique=True)
    reservations_count = models.PositiveIntegerField(default=0)
    completions_count = models.PositiveIntegerField(default=0)
    tasbeeh_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return self.name
