
from django.contrib import admin
from django.conf import settings
from django.http import FileResponse, Http404
from django.urls import include, path
from scanner import views as scanner_views


def favicon(request):
    favicon_path = settings.BASE_DIR.parent / "favicon.png"
    if not favicon_path.is_file():
        raise Http404
    return FileResponse(favicon_path.open("rb"), content_type="image/png")


urlpatterns = [
    path("", scanner_views.landing, name="landing"),
    path("index.html", scanner_views.landing, name="landing-index"),
    path("dashboard.html", scanner_views.dashboard, name="dashboard"),
    path("login/", scanner_views.login_view, name="login"),
    path("login.html", scanner_views.login_view, name="login-html"),
    path("signup/", scanner_views.signup_view, name="signup"),
    path("signup.html", scanner_views.signup_view, name="signup-html"),
    path("logout/", scanner_views.logout_view, name="logout"),
    path("health/", scanner_views.root_info, name="root-info"),
    path("favicon.ico", favicon, name="favicon"),
    path("favicon.png", favicon, name="favicon-png"),
    path("css/<path:path>", scanner_views.css_asset, name="css-asset"),
    path("js/<path:path>", scanner_views.js_asset, name="js-asset"),
    path("admin/", admin.site.urls),
    path("api/", include("scanner.urls")),
]

handler404 = "scanner.views.custom_404"
handler500 = "scanner.views.custom_500"
