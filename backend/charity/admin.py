from django.contrib import admin

from .models import (
    ActivityEvent,
    DuaMessage,
    Juz,
    Khatma,
    ParticipantProgress,
    ReferralAction,
    TasbeehCounter,
    TeamGroup,
    TeamMembership,
)


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
    list_display = (
        "name",
        "referral_code",
        "referred_by",
        "reservations_count",
        "completions_count",
        "tasbeeh_count",
        "dua_count",
        "streak_days",
        "updated_at",
    )
    search_fields = ("name",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(ReferralAction)
class ReferralActionAdmin(admin.ModelAdmin):
    list_display = ("inviter", "invited", "action_type", "created_at")
    list_filter = ("action_type",)
    search_fields = ("inviter__name", "invited__name")
    readonly_fields = ("created_at",)


@admin.register(TeamGroup)
class TeamGroupAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "target_points", "created_by", "created_at")
    search_fields = ("name", "code")
    readonly_fields = ("created_at",)


@admin.register(TeamMembership)
class TeamMembershipAdmin(admin.ModelAdmin):
    list_display = ("team", "participant", "joined_at")
    search_fields = ("team__name", "team__code", "participant__name")
    readonly_fields = ("joined_at",)
