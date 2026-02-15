from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q


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


class TasbeehCounter(models.Model):
    phrase = models.CharField(max_length=120, unique=True)
    count = models.PositiveBigIntegerField(default=0)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.phrase}: {self.count}"
