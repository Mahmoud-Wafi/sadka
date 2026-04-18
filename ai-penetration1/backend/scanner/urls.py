from django.urls import path

from . import views

urlpatterns = [
    path("", views.api_index, name="api-index"),
    path("auth/csrf", views.auth_csrf, name="auth-csrf"),
    path("auth/session", views.auth_session, name="auth-session"),
    path("auth/login", views.auth_login, name="auth-login"),
    path("auth/signup", views.auth_signup, name="auth-signup"),
    path("auth/logout", views.auth_logout, name="auth-logout"),
    path("status", views.system_status, name="system-status"),
    path("scan", views.start_scan, name="start-scan"),
    path("scan/<str:task_id>", views.scan_detail, name="scan-detail"),
    path("history", views.scan_history, name="scan-history"),
]
