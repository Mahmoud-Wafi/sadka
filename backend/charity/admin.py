from django.contrib import admin

from .models import Juz, Khatma, TasbeehCounter


@admin.register(Khatma)
class KhatmaAdmin(admin.ModelAdmin):
    list_display = ("number", "is_completed", "created_at", "completed_at")
    list_filter = ("is_completed",)
    search_fields = ("number",)


@admin.register(Juz)
class JuzAdmin(admin.ModelAdmin):
    list_display = ("khatma", "juz_number", "reserved_by", "reserved_at")
    list_filter = ("khatma",)
    search_fields = ("reserved_by",)


@admin.register(TasbeehCounter)
class TasbeehCounterAdmin(admin.ModelAdmin):
    list_display = ("phrase", "count")
    search_fields = ("phrase",)
