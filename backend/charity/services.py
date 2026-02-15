from __future__ import annotations

import json
from typing import TypedDict
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.utils import timezone

from .models import Juz, Khatma, TasbeehCounter

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


class ReserveResult(TypedDict):
    reserved_juz: Juz
    current_khatma: Khatma
    khatma_completed_now: bool
    next_khatma_number: int | None


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
            # سباق إنشاء متزامن: نحاول إعادة القراءة مرة أخرى.
            continue

    raise RuntimeError("تعذر تحديد أو إنشاء الختمة الحالية.")


@transaction.atomic
def reserve_juz(juz_number: int, name: str) -> ReserveResult:
    safe_name = name.strip()
    if not safe_name:
        raise ValueError("الاسم مطلوب.")

    current = get_or_create_current_khatma(lock=True)

    try:
        juz = Juz.objects.select_for_update().get(khatma=current, juz_number=juz_number)
    except Juz.DoesNotExist as exc:
        raise ValueError("الجزء المطلوب غير موجود في الختمة الحالية.") from exc

    if juz.reserved_by:
        raise ValueError("هذا الجزء محجوز بالفعل.")

    now = timezone.now()
    juz.reserved_by = safe_name
    juz.reserved_at = now
    juz.save(update_fields=["reserved_by", "reserved_at"])

    reserved_count = Juz.objects.filter(khatma=current, reserved_by__isnull=False).count()
    khatma_completed_now = False
    next_khatma_number = None

    if reserved_count == 30:
        current.is_completed = True
        current.completed_at = now
        current.save(update_fields=["is_completed", "completed_at"])

        next_khatma = create_khatma_with_juz(current.number + 1)
        khatma_completed_now = True
        next_khatma_number = next_khatma.number

    return {
        "reserved_juz": juz,
        "current_khatma": current,
        "khatma_completed_now": khatma_completed_now,
        "next_khatma_number": next_khatma_number,
    }


def ensure_default_tasbeeh_phrases() -> None:
    existing = set(TasbeehCounter.objects.values_list("phrase", flat=True))
    missing = [TasbeehCounter(phrase=phrase) for phrase in DEFAULT_TASBEEH_PHRASES if phrase not in existing]
    if missing:
        TasbeehCounter.objects.bulk_create(missing)


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
