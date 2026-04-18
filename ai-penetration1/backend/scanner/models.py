import uuid

from django.conf import settings
from django.db import models


def generate_task_id() -> str:
    return uuid.uuid4().hex


class ScanTask(models.Model):
    STATUS_PENDING = "pending"
    STATUS_RUNNING = "running"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_RUNNING, "Running"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    task_id = models.CharField(
        max_length=36,
        default=generate_task_id,
        unique=True,
        db_index=True,
        editable=False,
    )
    target = models.CharField(max_length=255)
    tools = models.JSONField(default=list, blank=True)
    scan_type = models.CharField(max_length=20, default="normal")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="scan_tasks",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )
    progress = models.PositiveSmallIntegerField(default=0)
    results = models.JSONField(default=dict, blank=True)
    error = models.TextField(blank=True, default="")
    ai_report = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.task_id} - {self.target} ({self.status})"
