from django.contrib import admin

from .models import ActivityEvent, DuaMessage, Juz, Khatma, ParticipantProgress, TasbeehCounter


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


@admin.register(ActivityEvent)
class ActivityEventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "actor_name", "khatma_number", "juz_number", "created_at")
    list_filter = ("event_type",)
    search_fields = ("actor_name", "message")
    readonly_fields = ("created_at",)


@admin.register(DuaMessage)
class DuaMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "is_approved", "created_at")
    list_filter = ("is_approved",)
    search_fields = ("name", "content")
    readonly_fields = ("created_at",)


@admin.register(ParticipantProgress)
class ParticipantProgressAdmin(admin.ModelAdmin):
    list_display = ("name", "reservations_count", "completions_count", "tasbeeh_count", "updated_at")
    search_fields = ("name",)
    readonly_fields = ("created_at", "updated_at")
