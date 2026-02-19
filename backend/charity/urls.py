from django.urls import path

from .views import (
    ActivityFeedView,
    CompleteJuzView,
    CurrentKhatmaView,
    DailyWirdView,
    DuaWallView,
    InviteLeaderboardView,
    JuzContentView,
    KhatmaHistoryView,
    ProfileStatsView,
    RamadanImpactView,
    ReminderView,
    ReserveJuzView,
    StatsView,
    TasbeehView,
    TeamJoinView,
    TeamListCreateView,
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
    path("invite-leaderboard/", InviteLeaderboardView.as_view(), name="invite-leaderboard"),
    path("ramadan-impact/", RamadanImpactView.as_view(), name="ramadan-impact"),
    path("teams/", TeamListCreateView.as_view(), name="teams"),
    path("teams/join/", TeamJoinView.as_view(), name="team-join"),
    path("reminders/", ReminderView.as_view(), name="reminders"),
    path("juz/<int:juz_number>/", JuzContentView.as_view(), name="juz-content"),
]
