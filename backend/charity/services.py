from __future__ import annotations

import json
import os
from datetime import timedelta
from typing import TypedDict
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone

from .models import ActivityEvent, DuaMessage, Juz, Khatma, ParticipantProgress, TasbeehCounter

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


def get_or_create_participant(name: str) -> ParticipantProgress:
    safe_name = normalize_name(name)
    if not safe_name:
        raise ValueError("الاسم مطلوب.")
    participant = ParticipantProgress.objects.filter(name__iexact=safe_name).first()
    if participant:
        return participant
    return ParticipantProgress.objects.create(name=safe_name)


def bump_participant_counter(name: str, field_name: str) -> ParticipantProgress:
    participant = get_or_create_participant(name)
    ParticipantProgress.objects.filter(pk=participant.pk).update(**{field_name: F(field_name) + 1})
    participant.refresh_from_db()
    return participant


def build_badges(*, reservations_count: int, completions_count: int, tasbeeh_count: int) -> list[dict]:
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

    return badges


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
def reserve_juz(juz_number: int, name: str) -> ReserveResult:
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

    bump_participant_counter(safe_name, "reservations_count")
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
def complete_juz(juz_number: int, name: str) -> CompleteResult:
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

    bump_participant_counter(safe_name, "completions_count")
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


def increment_tasbeeh_phrase(*, phrase: str, name: str = "") -> TasbeehCounter:
    phrase = phrase.strip()
    if not phrase:
        raise ValueError("الذكر مطلوب.")

    counter, _ = TasbeehCounter.objects.get_or_create(phrase=phrase)
    counter.count = F("count") + 1
    counter.save(update_fields=["count"])
    counter.refresh_from_db()

    actor_name = normalize_name(name)
    if actor_name:
        bump_participant_counter(actor_name, "tasbeeh_count")
        message = f"{actor_name} شارك في الذكر: {phrase}."
    else:
        message = f"تمت زيادة الذكر: {phrase}."

    create_activity_event(
        ActivityEvent.TASBEEH,
        message,
        actor_name=actor_name,
    )
    return counter


def add_dua_message(*, name: str, content: str) -> DuaMessage:
    safe_name = normalize_name(name)
    safe_content = content.strip()
    if not safe_name:
        raise ValueError("الاسم مطلوب.")
    if not safe_content:
        raise ValueError("نص الدعاء مطلوب.")

    dua = DuaMessage.objects.create(name=safe_name, content=safe_content)
    create_activity_event(
        ActivityEvent.DUA,
        f"{safe_name} أضاف دعاءً جديدًا.",
        actor_name=safe_name,
    )
    return dua


def get_profile_stats(name: str) -> dict:
    safe_name = normalize_name(name)
    if not safe_name:
        raise ValueError("الاسم مطلوب.")

    participant = ParticipantProgress.objects.filter(name__iexact=safe_name).first()
    reservations_count = participant.reservations_count if participant else 0
    completions_count = participant.completions_count if participant else 0
    tasbeeh_count = participant.tasbeeh_count if participant else 0
    updated_at = participant.updated_at if participant else None

    now = timezone.now()
    pending_reservations = Juz.objects.filter(
        reserved_by__iexact=safe_name,
        completed_at__isnull=True,
        reservation_expires_at__gt=now,
    ).count()
    completed_total = Juz.objects.filter(completed_by__iexact=safe_name).count()

    return {
        "name": participant.name if participant else safe_name,
        "reservations_count": reservations_count,
        "completions_count": completions_count,
        "tasbeeh_count": tasbeeh_count,
        "pending_reservations": pending_reservations,
        "completed_total": completed_total,
        "updated_at": updated_at,
        "badges": build_badges(
            reservations_count=reservations_count,
            completions_count=completions_count,
            tasbeeh_count=tasbeeh_count,
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
