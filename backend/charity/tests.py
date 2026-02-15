from unittest.mock import patch

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Juz, Khatma, TasbeehCounter
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

        with patch("charity.views.broadcast_live_event") as mock_broadcast:
            first = self.client.post(reverse("reserve-juz"), {"juz_number": 5, "name": "محمد"}, format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(first.data["reserved_juz"]["read_url"], "https://quran.com/juz/5")
        mock_broadcast.assert_called()

        second = self.client.post(reverse("reserve-juz"), {"juz_number": 5, "name": "أحمد"}, format="json")
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_completing_khatma_creates_next_one(self):
        khatma = create_khatma_with_juz(1)
        for i in range(1, 30):
            Juz.objects.filter(khatma=khatma, juz_number=i).update(
                reserved_by=f"قارئ {i}",
                reserved_at=timezone.now(),
            )

        response = self.client.post(reverse("reserve-juz"), {"juz_number": 30, "name": "خاتم"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["khatma_completed_now"])
        self.assertEqual(response.data["next_khatma_number"], 2)
        self.assertEqual(Khatma.objects.filter(is_completed=False).count(), 1)

    def test_tasbeeh_counter_increments(self):
        with patch("charity.views.broadcast_live_event") as mock_broadcast:
            response = self.client.post(reverse("tasbeeh"), {"phrase": "سُبْحَانَ اللَّهِ"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        counter = TasbeehCounter.objects.get(phrase="سُبْحَانَ اللَّهِ")
        self.assertEqual(counter.count, 1)
        mock_broadcast.assert_called()

    @patch("charity.views.fetch_juz_content")
    def test_juz_content_endpoint_returns_selected_juz(self, mock_fetch):
        mock_fetch.return_value = {
            "juz_number": 7,
            "ayah_count": 2,
            "first_surah": "سُورَةُ الأنعام",
            "last_surah": "سُورَةُ الأنعام",
            "ayahs": [
                {
                    "surah_number": 6,
                    "surah_name": "سُورَةُ الأنعام",
                    "number_in_surah": 111,
                    "text": "النص الأول",
                },
                {
                    "surah_number": 6,
                    "surah_name": "سُورَةُ الأنعام",
                    "number_in_surah": 112,
                    "text": "النص الثاني",
                },
            ],
        }

        response = self.client.get(reverse("juz-content", kwargs={"juz_number": 7}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["juz_number"], 7)
        self.assertEqual(response.data["ayah_count"], 2)

    def test_juz_content_endpoint_rejects_invalid_juz_number(self):
        response = self.client.get(reverse("juz-content", kwargs={"juz_number": 31}))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
