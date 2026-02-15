from django.urls import path

from .views import CurrentKhatmaView, JuzContentView, ReserveJuzView, StatsView, TasbeehView

urlpatterns = [
    path("current-khatma/", CurrentKhatmaView.as_view(), name="current-khatma"),
    path("reserve/", ReserveJuzView.as_view(), name="reserve-juz"),
    path("stats/", StatsView.as_view(), name="stats"),
    path("tasbeeh/", TasbeehView.as_view(), name="tasbeeh"),
    path("juz/<int:juz_number>/", JuzContentView.as_view(), name="juz-content"),
]
