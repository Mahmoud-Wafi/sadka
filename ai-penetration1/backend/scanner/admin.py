from django.contrib import admin

from .models import ScanTask


@admin.register(ScanTask)
class ScanTaskAdmin(admin.ModelAdmin):
    list_display = (
        "task_id",
        "target",
        "status",
        "scan_type",
        "progress",
        "created_at",
        "completed_at",
    )
    list_filter = ("status", "scan_type", "created_at")
    search_fields = ("task_id", "target")
    readonly_fields = ("task_id", "created_at", "updated_at", "completed_at")

