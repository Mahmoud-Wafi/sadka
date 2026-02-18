from __future__ import annotations

from unittest.mock import patch

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import DuaMessage, Juz, Khatma, ParticipantProgress, TasbeehCounter
from .services import create_khatma_with_juz


class CharityApiTests(APITestCase):
    def test_current_khatma_is_created_automatically(self):
        self.assertEqual(Khatma.objects.count(), 0)
        response = self.client.get(reverse("current-khatma"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["khatma"]["number"], 1)
        self.assertEqual(len(response.data["khatma"]["ajzaa"]), 30)

    def test_double_reservation_is_blocked(self):
        create_khatma_with_juz(1)
        with patch("charity.views.broadcast_live_event"):
            first = self.client.post(reverse("reserve-juz"), {"juz_number": 5, "name": "محمد"}, format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(first.data["reserved_juz"]["read_url"], "https://quran.com/juz/5")

        second = self.client.post(reverse("reserve-juz"), {"juz_number": 5, "name": "أحمد"}, format="json")
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_juz_completion_requires_same_name_and_marks_done(self):
        create_khatma_with_juz(1)
        self.client.post(reverse("reserve-juz"), {"juz_number": 3, "name": "سالم"}, format="json")

        wrong = self.client.post(reverse("complete-juz"), {"juz_number": 3, "name": "غيره"}, format="json")
        self.assertEqual(wrong.status_code, status.HTTP_400_BAD_REQUEST)

        ok = self.client.post(reverse("complete-juz"), {"juz_number": 3, "name": "سالم"}, format="json")
        self.assertEqual(ok.status_code, status.HTTP_200_OK)
        self.assertEqual(ok.data["completed_juz"]["completed_by"], "سالم")
        self.assertIsNotNone(ok.data["completed_juz"]["completed_at"])

    def test_completing_all_juz_creates_next_khatma(self):
        khatma = create_khatma_with_juz(1)
        for i in range(1, 30):
            Juz.objects.filter(khatma=khatma, juz_number=i).update(
                reserved_by="خاتم",
                reserved_at=timezone.now(),
                completed_by="خاتم",
                completed_at=timezone.now(),
            )

        self.client.post(reverse("reserve-juz"), {"juz_number": 30, "name": "خاتم"}, format="json")
        response = self.client.post(reverse("complete-juz"), {"juz_number": 30, "name": "خاتم"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["khatma_completed_now"])
        self.assertEqual(response.data["next_khatma_number"], 2)
        self.assertEqual(Khatma.objects.filter(is_completed=False).count(), 1)

    def test_tasbeeh_counter_increments_with_optional_name_stats(self):
        response = self.client.post(
            reverse("tasbeeh"),
            {"phrase": "سُبْحَانَ اللَّهِ", "name": "مشارك"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        counter = TasbeehCounter.objects.get(phrase="سُبْحَانَ اللَّهِ")
        self.assertEqual(counter.count, 1)
        progress = ParticipantProgress.objects.get(name="مشارك")
        self.assertEqual(progress.tasbeeh_count, 1)

    def test_dua_wall_create_and_list(self):
        create = self.client.post(
            reverse("dua-wall"),
            {"name": "دعاء", "content": "اللهم اغفر له وارحمه واجعل قبره روضة من رياض الجنة."},
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(DuaMessage.objects.count(), 1)

        listing = self.client.get(reverse("dua-wall"))
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        self.assertEqual(len(listing.data), 1)

    def test_profile_stats_returns_badges(self):
        create_khatma_with_juz(1)
        self.client.post(reverse("reserve-juz"), {"juz_number": 1, "name": "حسن"}, format="json")
        self.client.post(reverse("complete-juz"), {"juz_number": 1, "name": "حسن"}, format="json")
        for _ in range(5):
            self.client.post(reverse("tasbeeh"), {"phrase": "سُبْحَانَ اللَّهِ", "name": "حسن"}, format="json")

        response = self.client.get(reverse("profile-stats"), {"name": "حسن"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["completions_count"], 1)
        self.assertGreaterEqual(len(response.data["badges"]), 2)

    @patch("charity.views.fetch_juz_content")
    def test_juz_content_endpoint_returns_selected_juz(self, mock_fetch):
        mock_fetch.return_value = {
            "juz_number": 7,
            "ayah_count": 2,
            "first_surah": "سُورَةُ الأنعام",
            "last_surah": "سُورَةُ الأنعام",
            "ayahs": [
                {"surah_number": 6, "surah_name": "سُورَةُ الأنعام", "number_in_surah": 111, "text": "النص الأول"},
                {"surah_number": 6, "surah_name": "سُورَةُ الأنعام", "number_in_surah": 112, "text": "النص الثاني"},
            ],
        }
        response = self.client.get(reverse("juz-content", kwargs={"juz_number": 7}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["juz_number"], 7)

