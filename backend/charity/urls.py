from django.urls import path

from .views import (
    ActivityFeedView,
    CompleteJuzView,
    CurrentKhatmaView,
    DailyWirdView,
    DuaWallView,
    JuzContentView,
    KhatmaHistoryView,
    ProfileStatsView,
    ReminderView,
    ReserveJuzView,
    StatsView,
    TasbeehView,
)

urlpatterns = [
    path("current-khatma/", CurrentKhatmaView.as_view(), name="current-khatma"),
    path("reserve/", ReserveJuzView.as_view(), name="reserve-juz"),
    path("complete-juz/", CompleteJuzView.as_view(), name="complete-juz"),
    path("stats/", StatsView.as_view(), name="stats"),
    path("tasbeeh/", TasbeehView.as_view(), name="tasbeeh"),
    path("activity/", ActivityFeedView.as_view(), name="activity-feed"),
    path("dua-wall/", DuaWallView.as_view(), name="dua-wall"),
    path("profile-stats/", ProfileStatsView.as_view(), name="profile-stats"),
    path("khatma-history/", KhatmaHistoryView.as_view(), name="khatma-history"),
    path("daily-wird/", DailyWirdView.as_view(), name="daily-wird"),
    path("reminders/", ReminderView.as_view(), name="reminders"),
    path("juz/<int:juz_number>/", JuzContentView.as_view(), name="juz-content"),
]
