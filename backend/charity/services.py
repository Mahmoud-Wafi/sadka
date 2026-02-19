from __future__ import annotations

import json
import os
import secrets
from datetime import timedelta
from typing import TypedDict
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.db.models import Count, F, Q, Sum
from django.utils import timezone

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

DEFAULT_TASBEEH_PHRASES = [
    "سُبْحَانَ اللَّهِ",
    "الْحَمْدُ لِلَّهِ",
    "اللَّهُ أَكْبَرُ",
    "لَا إِلٰهَ إِلَّا اللَّهُ",
    "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    "سُبْحَانَ اللَّهِ الْعَظِيمِ",
    "أَسْتَغْفِرُ اللَّهَ",
    "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ",
    "حَسْبِيَ اللَّهُ وَنِعْمَ الْوَكِيلُ",
    "رَبِّ اغْفِرْ لِي",
    "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
]

DAILY_WIRD_ENTRIES = [
    {
        "title": "ورد اليوم: الاستغفار",
        "body": "اجعل لنفسك اليوم 100 استغفار بنية الرحمة والمغفرة لعبدالسلام عيسى.",
        "dua": "اللهم اغفر له وارحمه وعافه واعف عنه.",
        "tasbeeh_phrase": "أَسْتَغْفِرُ اللَّهَ",
    },
    {
        "title": "ورد اليوم: الصلاة على النبي",
        "body": "صلِّ على النبي صلى الله عليه وسلم 100 مرة، واهدِ ثواب الدعاء لعبدالسلام.",
        "dua": "اللهم صل وسلم وبارك على نبينا محمد.",
        "tasbeeh_phrase": "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ",
    },
    {
        "title": "ورد اليوم: التسبيح",
        "body": "ردد سبحان الله وبحمده قدر استطاعتك، واكتب دعاءً طيبًا في حائط الدعاء.",
        "dua": "اللهم اجعل قبره نورًا وراحةً وسكينة.",
        "tasbeeh_phrase": "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    },
    {
        "title": "ورد اليوم: الدعاء",
        "body": "خصص دقائق بعد كل صلاة للدعاء للميت، فالدعاء أنفع ما يُهدى.",
        "dua": "اللهم اجعل له نصيبًا من كل دعوة صادقة.",
        "tasbeeh_phrase": "رَبِّ اغْفِرْ لِي",
    },
]

CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
REFERRAL_CODE_LENGTH = 8
TEAM_CODE_LENGTH = 6


class ReserveResult(TypedDict):
    reserved_juz: Juz
    current_khatma: Khatma
    khatma_completed_now: bool
    next_khatma_number: int | None


class CompleteResult(TypedDict):
    completed_juz: Juz
    current_khatma: Khatma
    khatma_completed_now: bool
    next_khatma_number: int | None


def normalize_name(name: str) -> str:
    return name.strip()


def normalize_referral_code(value: str) -> str:
    return "".join(ch for ch in value.strip().upper() if ch.isalnum())[:16]


def normalize_team_code(value: str) -> str:
    return "".join(ch for ch in value.strip().upper() if ch.isalnum())[:12]


def public_site_url() -> str:
    return (os.getenv("PUBLIC_SITE_URL") or "https://sadka-ten.vercel.app").rstrip("/")


def build_invite_link(referral_code: str) -> str:
    code = normalize_referral_code(referral_code)
    if not code:
        return public_site_url()
    return f"{public_site_url()}/?ref={code}"


def reservation_expiry_hours() -> int:
    try:
        value = int(os.getenv("RESERVATION_EXPIRY_HOURS", "18"))
        return max(1, min(value, 168))
    except ValueError:
        return 18


def create_activity_event(
    event_type: str,
    message: str,
    *,
    actor_name: str = "",
    khatma_number: int | None = None,
    juz_number: int | None = None,
) -> ActivityEvent:
    return ActivityEvent.objects.create(
        event_type=event_type,
        message=message,
        actor_name=actor_name,
        khatma_number=khatma_number,
        juz_number=juz_number,
    )


def _generate_unique_code(model, field_name: str, length: int) -> str:
    for _ in range(30):
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(length))
        if not model.objects.filter(**{field_name: code}).exists():
            return code
    raise RuntimeError("تعذر إنشاء رمز فريد حاليًا. حاول مرة أخرى.")


def _resolve_referrer(ref_code: str) -> ParticipantProgress | None:
    code = normalize_referral_code(ref_code)
    if not code:
        return None
    return ParticipantProgress.objects.filter(referral_code__iexact=code).first()


def ensure_participant_referral_code(participant: ParticipantProgress) -> str:
    if participant.referral_code:
        return participant.referral_code

    participant.referral_code = _generate_unique_code(ParticipantProgress, "referral_code", REFERRAL_CODE_LENGTH)
    participant.save(update_fields=["referral_code", "updated_at"])
    return participant.referral_code


def attach_referrer_if_possible(participant: ParticipantProgress, ref_code: str) -> None:
    if participant.referred_by_id:
        return

    referrer = _resolve_referrer(ref_code)
    if not referrer or referrer.pk == participant.pk:
        return

    participant.referred_by = referrer
    participant.save(update_fields=["referred_by", "updated_at"])
    create_activity_event(
        ActivityEvent.INVITE,
        f"{participant.name} انضم عبر رابط مشاركة {referrer.name}.",
        actor_name=participant.name,
    )


def mark_participant_activity(participant: ParticipantProgress) -> ParticipantProgress:
    today = timezone.localdate()
    if participant.last_activity_date == today:
        return participant

    if participant.last_activity_date == today - timedelta(days=1):
        participant.streak_days += 1
    else:
        participant.streak_days = 1

    participant.last_activity_date = today
    participant.best_streak_days = max(participant.best_streak_days, participant.streak_days)
    participant.save(update_fields=["last_activity_date", "streak_days", "best_streak_days", "updated_at"])
    return participant


def participant_points(participant: ParticipantProgress) -> int:
    return int(
        participant.reservations_count
        + (participant.completions_count * 4)
        + (participant.tasbeeh_count // 10)
        + (participant.dua_count * 2)
        + participant.streak_days
    )


def get_or_create_participant(name: str, *, ref_code: str = "") -> ParticipantProgress:
    safe_name = normalize_name(name)
    if not safe_name:
        raise ValueError("الاسم مطلوب.")

    participant = ParticipantProgress.objects.filter(name__iexact=safe_name).first()
    if participant:
        ensure_participant_referral_code(participant)
        attach_referrer_if_possible(participant, ref_code)
        return participant

    referrer = _resolve_referrer(ref_code)
    participant = ParticipantProgress.objects.create(
        name=safe_name,
        referral_code=_generate_unique_code(ParticipantProgress, "referral_code", REFERRAL_CODE_LENGTH),
        referred_by=referrer,
    )
    if referrer:
        create_activity_event(
            ActivityEvent.INVITE,
            f"{participant.name} انضم عبر رابط مشاركة {referrer.name}.",
            actor_name=participant.name,
        )
    return participant


def bump_participant_counter(name: str, field_name: str, *, ref_code: str = "") -> ParticipantProgress:
    participant = get_or_create_participant(name, ref_code=ref_code)
    ParticipantProgress.objects.filter(pk=participant.pk).update(**{field_name: F(field_name) + 1})
    participant.refresh_from_db()
    return mark_participant_activity(participant)


def record_referral_action(participant: ParticipantProgress, action_type: str) -> None:
    if not participant.referred_by_id:
        return

    ReferralAction.objects.create(
        inviter_id=participant.referred_by_id,
        invited=participant,
        action_type=action_type,
    )


def get_participant_invite_stats(participant: ParticipantProgress) -> dict:
    invited_people_count = participant.invited_participants.count()
    invited_actions_count = participant.referral_actions.count()
    invited_active_people_count = participant.referral_actions.values("invited_id").distinct().count()
    invited_completions_count = participant.referral_actions.filter(action_type=ReferralAction.COMPLETE).count()

    return {
        "invited_people_count": invited_people_count,
        "invited_active_people_count": invited_active_people_count,
        "invited_actions_count": invited_actions_count,
        "invited_completions_count": invited_completions_count,
    }


def build_badges(
    *,
    reservations_count: int,
    completions_count: int,
    tasbeeh_count: int,
    dua_count: int,
    invite_count: int,
    streak_days: int,
) -> list[dict]:
    badges: list[dict] = []

    if reservations_count >= 1 or tasbeeh_count >= 1:
        badges.append(
            {
                "key": "first_step",
                "title": "أول مشاركة",
                "description": "بدأت رحلتك في الصدقة الجارية.",
            }
        )
    if completions_count >= 1:
        badges.append(
            {
                "key": "first_completion",
                "title": "أتممت جزءًا",
                "description": "تم تسجيل أول جزء مكتمل لك.",
            }
        )
    if completions_count >= 5:
        badges.append(
            {
                "key": "five_completions",
                "title": "فارس الأجزاء",
                "description": "أكملت 5 أجزاء أو أكثر.",
            }
        )
    if completions_count >= 10:
        badges.append(
            {
                "key": "ten_completions",
                "title": "قائد الختمات",
                "description": "أكملت 10 أجزاء أو أكثر.",
            }
        )
    if reservations_count >= 10:
        badges.append(
            {
                "key": "ten_reservations",
                "title": "نجم المشاركة",
                "description": "حجزت 10 أجزاء أو أكثر.",
            }
        )
    if tasbeeh_count >= 100:
        badges.append(
            {
                "key": "tasbeeh_100",
                "title": "ذاكر نشيط",
                "description": "سجلت 100 تسبيحة أو أكثر.",
            }
        )
    if tasbeeh_count >= 500:
        badges.append(
            {
                "key": "tasbeeh_500",
                "title": "ذاكر مميز",
                "description": "سجلت 500 تسبيحة أو أكثر.",
            }
        )
    if dua_count >= 3:
        badges.append(
            {
                "key": "dua_helper",
                "title": "صاحب دعاء",
                "description": "أضفت 3 أدعية أو أكثر في حائط الدعاء.",
            }
        )
    if invite_count >= 5:
        badges.append(
            {
                "key": "invite_5",
                "title": "سفير رمضان",
                "description": "دَعوت 5 مشاركين أو أكثر عبر رابطك.",
            }
        )
    if invite_count >= 15:
        badges.append(
            {
                "key": "invite_15",
                "title": "قائد الدعوة",
                "description": "دَعوت 15 مشاركًا أو أكثر.",
            }
        )
    if streak_days >= 3:
        badges.append(
            {
                "key": "streak_3",
                "title": "مواظب 3 أيام",
                "description": "نشاط متواصل لمدة 3 أيام.",
            }
        )
    if streak_days >= 7:
        badges.append(
            {
                "key": "streak_7",
                "title": "مواظب أسبوع",
                "description": "نشاط متواصل لمدة 7 أيام.",
            }
        )

    return badges


def build_certificate_payload(participant: ParticipantProgress, invite_count: int) -> dict:
    milestones: list[str] = []

    if participant.completions_count >= 10:
        milestones.append("أكملت 10 أجزاء أو أكثر")
    if invite_count >= 5:
        milestones.append("دعوت 5 مشاركين أو أكثر")
    if participant.best_streak_days >= 7:
        milestones.append("حافظت على سلسلة نشاط أسبوعية")
    if participant.tasbeeh_count >= 300:
        milestones.append("سجلت 300 تسبيحة أو أكثر")

    return {
        "eligible": bool(milestones),
        "title": "شهادة إنجاز رمضانية",
        "issued_on": str(timezone.localdate()),
        "milestones": milestones,
    }


def create_khatma_with_juz(number: int) -> Khatma:
    khatma = Khatma.objects.create(number=number)
    Juz.objects.bulk_create([Juz(khatma=khatma, juz_number=i) for i in range(1, 31)])
    return khatma


def get_or_create_current_khatma(lock: bool = False) -> Khatma:
    for _ in range(2):
        queryset = Khatma.objects.filter(is_completed=False)
        if lock:
            queryset = queryset.select_for_update()

        current = queryset.order_by("-number").first()
        if current:
            return current

        last_number = Khatma.objects.order_by("-number").values_list("number", flat=True).first() or 0
        try:
            return create_khatma_with_juz(last_number + 1)
        except IntegrityError:
            continue

    raise RuntimeError("تعذر تحديد أو إنشاء الختمة الحالية.")


def release_expired_reservations(*, khatma: Khatma | None = None, lock: bool = False) -> list[Juz]:
    now = timezone.now()
    queryset = Juz.objects.filter(
        reserved_by__isnull=False,
        completed_at__isnull=True,
        reservation_expires_at__isnull=False,
        reservation_expires_at__lte=now,
    )
    if khatma is not None:
        queryset = queryset.filter(khatma=khatma)
    if lock:
        queryset = queryset.select_for_update()

    expired_juz = list(queryset)
    if not expired_juz:
        return []

    for juz in expired_juz:
        juz.reserved_by = None
        juz.reserved_at = None
        juz.reservation_expires_at = None

    Juz.objects.bulk_update(expired_juz, ["reserved_by", "reserved_at", "reservation_expires_at"])
    return expired_juz


def finalize_khatma_if_completed(current: Khatma, *, now=None) -> tuple[bool, int | None]:
    now = now or timezone.now()
    completed_count = Juz.objects.filter(khatma=current, completed_at__isnull=False).count()
    if completed_count < 30 or current.is_completed:
        return False, None

    current.is_completed = True
    current.completed_at = now
    current.save(update_fields=["is_completed", "completed_at"])
    next_khatma = create_khatma_with_juz(current.number + 1)
    return True, next_khatma.number


@transaction.atomic
def reserve_juz(juz_number: int, name: str, *, ref_code: str = "") -> ReserveResult:
    safe_name = normalize_name(name)
    if not safe_name:
        raise ValueError("الاسم مطلوب.")

    current = get_or_create_current_khatma(lock=True)
    expired_juz = release_expired_reservations(khatma=current, lock=True)
    for expired in expired_juz:
        create_activity_event(
            ActivityEvent.EXPIRE,
            f"انتهت مهلة حجز الجزء {expired.juz_number} وأصبح متاحًا من جديد.",
            khatma_number=current.number,
            juz_number=expired.juz_number,
        )

    try:
        juz = Juz.objects.select_for_update().get(khatma=current, juz_number=juz_number)
    except Juz.DoesNotExist as exc:
        raise ValueError("الجزء المطلوب غير موجود في الختمة الحالية.") from exc

    if juz.completed_at:
        raise ValueError("هذا الجزء تم إنجازه بالفعل.")
    if juz.reserved_by:
        raise ValueError("هذا الجزء محجوز بالفعل.")

    now = timezone.now()
    juz.reserved_by = safe_name
    juz.reserved_at = now
    juz.reservation_expires_at = now + timedelta(hours=reservation_expiry_hours())
    juz.save(update_fields=["reserved_by", "reserved_at", "reservation_expires_at"])

    participant = bump_participant_counter(safe_name, "reservations_count", ref_code=ref_code)
    record_referral_action(participant, ReferralAction.RESERVE)

    create_activity_event(
        ActivityEvent.RESERVE,
        f"{safe_name} حجز الجزء {juz.juz_number}.",
        actor_name=safe_name,
        khatma_number=current.number,
        juz_number=juz.juz_number,
    )

    return {
        "reserved_juz": juz,
        "current_khatma": current,
        "khatma_completed_now": False,
        "next_khatma_number": None,
    }


@transaction.atomic
def complete_juz(juz_number: int, name: str, *, ref_code: str = "") -> CompleteResult:
    safe_name = normalize_name(name)
    if not safe_name:
        raise ValueError("الاسم مطلوب.")

    current = get_or_create_current_khatma(lock=True)
    release_expired_reservations(khatma=current, lock=True)

    try:
        juz = Juz.objects.select_for_update().get(khatma=current, juz_number=juz_number)
    except Juz.DoesNotExist as exc:
        raise ValueError("الجزء المطلوب غير موجود في الختمة الحالية.") from exc

    if not juz.reserved_by:
        raise ValueError("لا يمكن إتمام جزء غير محجوز.")
    if juz.completed_at:
        raise ValueError("تم تسجيل هذا الجزء كمكتمل بالفعل.")
    if normalize_name(juz.reserved_by) != safe_name:
        raise ValueError("إتمام الجزء متاح فقط لنفس الاسم الذي قام بالحجز.")

    now = timezone.now()
    juz.completed_by = safe_name
    juz.completed_at = now
    juz.save(update_fields=["completed_by", "completed_at"])

    participant = bump_participant_counter(safe_name, "completions_count", ref_code=ref_code)
    record_referral_action(participant, ReferralAction.COMPLETE)

    create_activity_event(
        ActivityEvent.COMPLETE,
        f"{safe_name} أتم قراءة الجزء {juz.juz_number}.",
        actor_name=safe_name,
        khatma_number=current.number,
        juz_number=juz.juz_number,
    )

    khatma_completed_now, next_khatma_number = finalize_khatma_if_completed(current, now=now)
    if khatma_completed_now:
        create_activity_event(
            ActivityEvent.COMPLETE,
            f"تم اكتمال الختمة رقم {current.number} وبدء الختمة رقم {next_khatma_number}.",
            khatma_number=current.number,
        )

    return {
        "completed_juz": juz,
        "current_khatma": current,
        "khatma_completed_now": khatma_completed_now,
        "next_khatma_number": next_khatma_number,
    }


def ensure_default_tasbeeh_phrases() -> None:
    existing = set(TasbeehCounter.objects.values_list("phrase", flat=True))
    missing = [TasbeehCounter(phrase=phrase) for phrase in DEFAULT_TASBEEH_PHRASES if phrase not in existing]
    if missing:
        TasbeehCounter.objects.bulk_create(missing)


def increment_tasbeeh_phrase(*, phrase: str, name: str = "", ref_code: str = "") -> TasbeehCounter:
    phrase = phrase.strip()
    if not phrase:
        raise ValueError("الذكر مطلوب.")

    counter, _ = TasbeehCounter.objects.get_or_create(phrase=phrase)
    counter.count = F("count") + 1
    counter.save(update_fields=["count"])
    counter.refresh_from_db()

    actor_name = normalize_name(name)
    if actor_name:
        participant = bump_participant_counter(actor_name, "tasbeeh_count", ref_code=ref_code)
        record_referral_action(participant, ReferralAction.TASBEEH)
        message = f"{actor_name} شارك في الذكر: {phrase}."
    else:
        message = f"تمت زيادة الذكر: {phrase}."

    create_activity_event(
        ActivityEvent.TASBEEH,
        message,
        actor_name=actor_name,
    )
    return counter


def add_dua_message(*, name: str, content: str, ref_code: str = "") -> DuaMessage:
    safe_name = normalize_name(name)
    safe_content = content.strip()
    if not safe_name:
        raise ValueError("الاسم مطلوب.")
    if not safe_content:
        raise ValueError("نص الدعاء مطلوب.")

    participant = bump_participant_counter(safe_name, "dua_count", ref_code=ref_code)
    record_referral_action(participant, ReferralAction.DUA)

    dua = DuaMessage.objects.create(name=safe_name, content=safe_content)
    create_activity_event(
        ActivityEvent.DUA,
        f"{safe_name} أضاف دعاءً جديدًا.",
        actor_name=safe_name,
    )
    return dua


def build_team_payload(team: TeamGroup, *, include_members: bool = False) -> dict:
    memberships = list(team.memberships.select_related("participant").all())
    members = [membership.participant for membership in memberships]
    points = sum(participant_points(member) for member in members)
    members_count = len(members)
    target_points = max(team.target_points, 1)

    data = {
        "id": team.id,
        "name": team.name,
        "code": team.code,
        "target_points": team.target_points,
        "points": points,
        "members_count": members_count,
        "remaining_points": max(0, team.target_points - points),
        "progress_percent": min(100, int((points * 100) / target_points)),
        "created_at": team.created_at,
    }

    if include_members:
        data["members"] = [
            {
                "name": member.name,
                "points": participant_points(member),
                "completions_count": member.completions_count,
                "streak_days": member.streak_days,
            }
            for member in members
        ]

    return data


@transaction.atomic
def create_team(*, owner_name: str, team_name: str, target_points: int = 300, ref_code: str = "") -> dict:
    safe_owner_name = normalize_name(owner_name)
    safe_team_name = team_name.strip()
    if not safe_owner_name:
        raise ValueError("اسم القائد مطلوب.")
    if len(safe_team_name) < 3:
        raise ValueError("اسم الفريق قصير جدًا.")

    try:
        safe_target = int(target_points)
    except (TypeError, ValueError):
        safe_target = 300
    safe_target = max(50, min(safe_target, 5000))

    owner = get_or_create_participant(safe_owner_name, ref_code=ref_code)
    existing_membership = TeamMembership.objects.select_related("team").filter(participant=owner).first()
    if existing_membership:
        raise ValueError(f"أنت منضم بالفعل إلى فريق: {existing_membership.team.name}.")

    team = TeamGroup.objects.create(
        name=safe_team_name,
        code=_generate_unique_code(TeamGroup, "code", TEAM_CODE_LENGTH),
        created_by=owner,
        target_points=safe_target,
    )
    TeamMembership.objects.create(team=team, participant=owner)

    create_activity_event(
        ActivityEvent.TEAM,
        f"{owner.name} أنشأ فريق {team.name} برمز {team.code}.",
        actor_name=owner.name,
    )
    return build_team_payload(team, include_members=True)


@transaction.atomic
def join_team(*, name: str, team_code: str, ref_code: str = "") -> dict:
    safe_name = normalize_name(name)
    if not safe_name:
        raise ValueError("الاسم مطلوب.")

    safe_code = normalize_team_code(team_code)
    if not safe_code:
        raise ValueError("رمز الفريق مطلوب.")

    team = TeamGroup.objects.filter(code__iexact=safe_code).first()
    if not team:
        raise ValueError("رمز الفريق غير صحيح.")

    participant = get_or_create_participant(safe_name, ref_code=ref_code)
    existing_membership = TeamMembership.objects.select_related("team").filter(participant=participant).first()
    if existing_membership and existing_membership.team_id == team.id:
        raise ValueError("أنت بالفعل عضو في هذا الفريق.")
    if existing_membership and existing_membership.team_id != team.id:
        raise ValueError(f"أنت منضم لفريق آخر: {existing_membership.team.name}.")

    TeamMembership.objects.create(team=team, participant=participant)
    create_activity_event(
        ActivityEvent.TEAM,
        f"{participant.name} انضم إلى فريق {team.name}.",
        actor_name=participant.name,
    )
    return build_team_payload(team, include_members=True)


def get_teams_leaderboard(limit: int = 20) -> list[dict]:
    safe_limit = max(1, min(int(limit), 100))
    teams = TeamGroup.objects.prefetch_related("memberships__participant").all()

    entries = [build_team_payload(team, include_members=False) for team in teams]
    entries.sort(
        key=lambda item: (
            item["points"],
            item["members_count"],
            -item["remaining_points"],
        ),
        reverse=True,
    )

    for index, item in enumerate(entries, start=1):
        item["rank"] = index

    return entries[:safe_limit]


def get_invite_leaderboard(limit: int = 20) -> list[dict]:
    safe_limit = max(1, min(int(limit), 100))
    participants = ParticipantProgress.objects.annotate(
        invited_people_count=Count("invited_participants", distinct=True),
        invited_actions_count=Count("referral_actions"),
        invited_completions_count=Count(
            "referral_actions",
            filter=Q(referral_actions__action_type=ReferralAction.COMPLETE),
        ),
    ).filter(Q(invited_people_count__gt=0) | Q(invited_actions_count__gt=0))

    entries = []
    for participant in participants:
        score = (
            participant.invited_people_count * 20
            + participant.invited_completions_count * 6
            + participant.invited_actions_count
        )
        entries.append(
            {
                "name": participant.name,
                "referral_code": participant.referral_code,
                "invite_link": build_invite_link(participant.referral_code),
                "invited_people_count": participant.invited_people_count,
                "invited_actions_count": participant.invited_actions_count,
                "invited_completions_count": participant.invited_completions_count,
                "score": score,
            }
        )

    entries.sort(
        key=lambda item: (
            item["score"],
            item["invited_people_count"],
            item["invited_actions_count"],
        ),
        reverse=True,
    )

    for index, item in enumerate(entries, start=1):
        item["rank"] = index

    return entries[:safe_limit]


def get_profile_stats(name: str, *, ref_code: str = "") -> dict:
    safe_name = normalize_name(name)
    if not safe_name:
        raise ValueError("الاسم مطلوب.")

    participant = get_or_create_participant(safe_name, ref_code=ref_code)
    now = timezone.now()

    pending_reservations = Juz.objects.filter(
        reserved_by__iexact=safe_name,
        completed_at__isnull=True,
        reservation_expires_at__gt=now,
    ).count()
    completed_total = Juz.objects.filter(completed_by__iexact=safe_name).count()

    invite_stats = get_participant_invite_stats(participant)
    team_membership = TeamMembership.objects.select_related("team").filter(participant=participant).first()
    team_payload = build_team_payload(team_membership.team, include_members=False) if team_membership else None

    return {
        "name": participant.name,
        "reservations_count": participant.reservations_count,
        "completions_count": participant.completions_count,
        "tasbeeh_count": participant.tasbeeh_count,
        "dua_count": participant.dua_count,
        "pending_reservations": pending_reservations,
        "completed_total": completed_total,
        "updated_at": participant.updated_at,
        "referral_code": participant.referral_code,
        "invite_link": build_invite_link(participant.referral_code),
        "referred_by_name": participant.referred_by.name if participant.referred_by else "",
        "streak_days": participant.streak_days,
        "best_streak_days": participant.best_streak_days,
        "points": participant_points(participant),
        "team": team_payload,
        "certificate": build_certificate_payload(participant, invite_stats["invited_people_count"]),
        **invite_stats,
        "badges": build_badges(
            reservations_count=participant.reservations_count,
            completions_count=participant.completions_count,
            tasbeeh_count=participant.tasbeeh_count,
            dua_count=participant.dua_count,
            invite_count=invite_stats["invited_people_count"],
            streak_days=participant.streak_days,
        ),
    }


def get_pending_reminders(name: str) -> dict:
    safe_name = normalize_name(name)
    if not safe_name:
        raise ValueError("الاسم مطلوب.")

    now = timezone.now()
    items = []
    queryset = (
        Juz.objects.select_related("khatma")
        .filter(
            reserved_by__iexact=safe_name,
            completed_at__isnull=True,
            reservation_expires_at__gt=now,
        )
        .order_by("reservation_expires_at")
    )

    for juz in queryset:
        minutes_left = int((juz.reservation_expires_at - now).total_seconds() // 60)
        items.append(
            {
                "juz_number": juz.juz_number,
                "khatma_number": juz.khatma.number,
                "reserved_at": juz.reserved_at,
                "reservation_expires_at": juz.reservation_expires_at,
                "minutes_left": max(0, minutes_left),
                "due_soon": minutes_left <= 60,
            }
        )

    due_soon_count = sum(1 for item in items if item["due_soon"])
    return {
        "name": safe_name,
        "pending_count": len(items),
        "due_soon_count": due_soon_count,
        "items": items,
    }


def get_khatma_history(limit: int = 20) -> list[dict]:
    result = []
    completed_khatmas = list(Khatma.objects.filter(is_completed=True).order_by("-number")[:limit])
    for khatma in completed_khatmas:
        completed_count = khatma.ajzaa.filter(completed_at__isnull=False).count()
        participants_count = (
            khatma.ajzaa.exclude(completed_by__isnull=True)
            .exclude(completed_by="")
            .values("completed_by")
            .distinct()
            .count()
        )
        result.append(
            {
                "khatma_number": khatma.number,
                "completed_at": khatma.completed_at,
                "completed_juz_count": completed_count,
                "participants_count": participants_count,
            }
        )
    return result


def get_daily_wird() -> dict:
    today = timezone.localdate()
    entry = DAILY_WIRD_ENTRIES[today.toordinal() % len(DAILY_WIRD_ENTRIES)]
    return {
        "date": str(today),
        "title": entry["title"],
        "body": entry["body"],
        "dua": entry["dua"],
        "tasbeeh_phrase": entry["tasbeeh_phrase"],
    }


def get_ramadan_impact(*, inviter_limit: int = 10, team_limit: int = 8) -> dict:
    totals = ParticipantProgress.objects.aggregate(
        total_reservations=Sum("reservations_count"),
        total_completions=Sum("completions_count"),
        total_tasbeeh=Sum("tasbeeh_count"),
        total_dua=Sum("dua_count"),
    )

    total_reservations = totals.get("total_reservations") or 0
    total_completions = totals.get("total_completions") or 0
    total_tasbeeh = totals.get("total_tasbeeh") or 0
    total_dua = totals.get("total_dua") or 0

    active_participants = ParticipantProgress.objects.filter(
        Q(reservations_count__gt=0)
        | Q(completions_count__gt=0)
        | Q(tasbeeh_count__gt=0)
        | Q(dua_count__gt=0)
    ).count()

    total_referred = ParticipantProgress.objects.exclude(referred_by__isnull=True).count()
    total_referral_actions = ReferralAction.objects.count()

    impact_score = int((total_completions * 10) + (total_tasbeeh // 5) + (total_dua * 5) + total_reservations)

    return {
        "generated_at": timezone.now(),
        "public_url": public_site_url(),
        "active_participants": active_participants,
        "total_referred_participants": total_referred,
        "total_referral_actions": total_referral_actions,
        "completed_khatmas": Khatma.objects.filter(is_completed=True).count(),
        "total_reservations": total_reservations,
        "total_completions": total_completions,
        "total_tasbeeh": total_tasbeeh,
        "total_dua": total_dua,
        "impact_score": impact_score,
        "target_completions": 3000,
        "top_inviters": get_invite_leaderboard(limit=inviter_limit),
        "top_teams": get_teams_leaderboard(limit=team_limit),
    }


def fetch_juz_content(juz_number: int) -> dict:
    if juz_number < 1 or juz_number > 30:
        raise ValueError("رقم الجزء يجب أن يكون بين 1 و30.")

    cache_key = f"juz-content-{juz_number}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    request = Request(
        f"https://api.alquran.cloud/v1/juz/{juz_number}/quran-uthmani",
        headers={"User-Agent": "SadaqahJariyah/1.0"},
    )

    try:
        with urlopen(request, timeout=15) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise ConnectionError("تعذر تحميل نص الجزء الآن. حاول لاحقًا.") from exc

    if payload.get("status") != "OK":
        raise ConnectionError("تعذر تحميل نص الجزء الآن. حاول لاحقًا.")

    data = payload.get("data") or {}
    source_ayahs = data.get("ayahs") or []
    ayahs = []
    surah_names = []

    for ayah in source_ayahs:
        surah = ayah.get("surah") or {}
        surah_name = surah.get("name") or "سورة"
        if surah_name not in surah_names:
            surah_names.append(surah_name)

        ayahs.append(
            {
                "surah_number": surah.get("number"),
                "surah_name": surah_name,
                "number_in_surah": ayah.get("numberInSurah"),
                "text": ayah.get("text", ""),
            }
        )

    normalized = {
        "juz_number": juz_number,
        "ayah_count": len(ayahs),
        "first_surah": surah_names[0] if surah_names else "",
        "last_surah": surah_names[-1] if surah_names else "",
        "ayahs": ayahs,
    }
    cache.set(cache_key, normalized, 60 * 60 * 12)
    return normalized
