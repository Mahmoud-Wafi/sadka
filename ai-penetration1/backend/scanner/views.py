from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
import mimetypes
from threading import Lock
from typing import Any

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.decorators import login_required
from django.db import OperationalError
from django.http import FileResponse, Http404, HttpResponse, JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import redirect, render
from django.utils import timezone
import logging
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.throttling import AnonRateThrottle
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import ScanTask
from .openai_report import generate_report
from .services import (
    build_scan_summary,
    get_tool_availability,
    is_valid_target,
    run_tool_scan,
    sanitize_scan_type,
    sanitize_tools,
)

EXECUTOR = ThreadPoolExecutor(max_workers=4)
ACTIVE_TASKS_LOCK = Lock()
ACTIVE_TASK_IDS: set[str] = set()
User = get_user_model()
CONTACT_NAME = "Eng. Ahmed Samir"
CONTACT_WHATSAPP = "01012568949"
CONTACT_PHONE = "01558715284"
MODEL_AUTH_BACKEND = "django.contrib.auth.backends.ModelBackend"

logger = logging.getLogger("scanner")


def _mark_active(task_id: str) -> None:
    with ACTIVE_TASKS_LOCK:
        ACTIVE_TASK_IDS.add(task_id)


def _mark_inactive(task_id: str) -> None:
    with ACTIVE_TASKS_LOCK:
        ACTIVE_TASK_IDS.discard(task_id)


def _safe_next_url(request, fallback: str = "/dashboard.html") -> str:
    next_url = request.POST.get("next") or request.GET.get("next") or fallback
    if url_has_allowed_host_and_scheme(next_url, allowed_hosts={request.get_host()}):
        return next_url
    return fallback


def _serve_project_asset(folder: str, path: str) -> FileResponse:
    file_path = settings.BASE_DIR.parent / folder / path
    if not file_path.is_file():
        raise Http404("Asset not found")

    content_type, _ = mimetypes.guess_type(file_path.name)
    return FileResponse(
        file_path.open("rb"),
        content_type=content_type or "application/octet-stream",
    )


def _auth_contact_payload() -> dict[str, str]:
    return {
        "name": CONTACT_NAME,
        "whatsapp": CONTACT_WHATSAPP,
        "phone": CONTACT_PHONE,
    }


def _auth_user_payload(user) -> dict[str, Any]:
    full_name = " ".join(
        part for part in [user.first_name, user.last_name] if part
    ).strip()
    return {
        "email": user.email or user.username,
        "full_name": full_name or user.username,
    }


def _auth_error_response(message: str, http_status: int) -> Response:
    return Response(
        {
            "success": False,
            "error": message,
            "contact": _auth_contact_payload(),
        },
        status=http_status,
    )


def landing(request):
    index_path = settings.BASE_DIR.parent / "index.html"
    if not index_path.is_file():
        raise Http404("Landing file not found")
    response = HttpResponse(index_path.read_text(encoding="utf-8"), content_type="text/html")
    response["Cache-Control"] = "no-store"
    return response


@login_required(login_url="/login/")
def dashboard(request):
    dashboard_path = settings.BASE_DIR.parent / "dashboard.html"
    if not dashboard_path.is_file():
        raise Http404("Dashboard file not found")

    # Ensure the CSRF cookie exists for authenticated JavaScript API calls.
    get_token(request)
    response = HttpResponse(dashboard_path.read_text(encoding="utf-8"), content_type="text/html")
    response["Cache-Control"] = "no-store"
    return response


def login_view(request):
    if request.user.is_authenticated:
        return redirect(_safe_next_url(request))

    context = {
        "error": "",
        "next_url": _safe_next_url(request),
        "form_values": {
            "email": "",
        },
    }

    if request.method == "POST":
        email = str(request.POST.get("email", "")).strip().lower()
        password = request.POST.get("password", "")
        context["form_values"]["email"] = email
        user = authenticate(request, username=email, password=password)

        if user is None:
            context["error"] = "Invalid email or password."
        else:
            login(request, user)
            return redirect(_safe_next_url(request))

    return render(request, "scanner/login.html", context)


def signup_view(request):
    if request.user.is_authenticated:
        return redirect(_safe_next_url(request))

    context = {
        "error": "",
        "next_url": _safe_next_url(request),
        "contact_name": CONTACT_NAME,
        "contact_whatsapp": CONTACT_WHATSAPP,
        "contact_phone": CONTACT_PHONE,
        "form_values": {
            "full_name": "",
            "email": "",
            "access_code": "",
        },
    }

    if request.method == "POST":
        full_name = str(request.POST.get("full_name", "")).strip()
        email = str(request.POST.get("email", "")).strip().lower()
        password = request.POST.get("password", "")
        confirm_password = request.POST.get("confirm_password", "")
        access_code = request.POST.get("access_code", "")
        context["form_values"].update(
            {
                "full_name": full_name,
                "email": email,
                "access_code": access_code,
            }
        )

        if not full_name or not email or not password:
            context["error"] = "All fields are required."
        elif access_code != settings.SIGNUP_ACCESS_CODE:
            context["error"] = "Invalid access code. If you need one, contact us."
        elif password != confirm_password:
            context["error"] = "Passwords do not match."
        elif User.objects.filter(username__iexact=email).exists():
            context["error"] = "An account with this email already exists."
        else:
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=full_name,
            )
            login(request, user, backend=MODEL_AUTH_BACKEND)
            return redirect(_safe_next_url(request))

    return render(request, "scanner/signup.html", context)


def logout_view(request):
    logout(request)
    return redirect("/login/")


def css_asset(request, path: str):
    return _serve_project_asset("css", path)


def js_asset(request, path: str):
    return _serve_project_asset("js", path)


def _serialize_scan(task: ScanTask) -> dict[str, Any]:
    summary = build_scan_summary(task.results or {}, task.tools, task.progress)
    return {
        "task_id": task.task_id,
        "target": task.target,
        "tools": task.tools,
        "scan_type": task.scan_type,
        "status": task.status,
        "progress": task.progress,
        "results": task.results or {},
        "error": task.error,
        "ai_report": task.ai_report,
        "summary": summary,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
    }


def _serialize_history_item(task: ScanTask) -> dict[str, Any]:
    summary = build_scan_summary(task.results or {}, task.tools, task.progress)
    return {
        "task_id": task.task_id,
        "target": task.target,
        "tools": task.tools,
        "scan_type": task.scan_type,
        "status": task.status,
        "progress": task.progress,
        "summary": summary,
        "ai_preview": "\n".join((task.ai_report or "").splitlines()[:4]).strip(),
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
    }


def _run_scan_task(task_id: str) -> None:
    task = ScanTask.objects.filter(task_id=task_id).first()
    if not task:
        return

    _mark_active(task_id)
    try:
        tools = sanitize_tools(task.tools)
        if not tools:
            task.status = ScanTask.STATUS_FAILED
            task.error = "No valid tools selected"
            task.completed_at = timezone.now()
            task.save(update_fields=["status", "error", "completed_at", "updated_at"])
            return

        target = task.target
        scan_type = sanitize_scan_type(task.scan_type)

        task.status = ScanTask.STATUS_RUNNING
        task.progress = 5
        task.error = ""
        task.save(update_fields=["status", "progress", "error", "updated_at"])

        results: dict[str, Any] = {}
        total_tools = len(tools)

        for index, tool in enumerate(tools, start=1):
            current = ScanTask.objects.filter(task_id=task_id).first()
            if not current:
                return
            if current.status == ScanTask.STATUS_CANCELLED:
                return

            tool_result = run_tool_scan(tool=tool, target=target, scan_type=scan_type)
            results[tool] = tool_result

            progress = min(99, int((index / total_tools) * 100))
            ScanTask.objects.filter(task_id=task_id).update(
                results=results,
                progress=progress,
                updated_at=timezone.now(),
            )

        ai_report = generate_report(target=target, results=results)

        ScanTask.objects.filter(task_id=task_id).update(
            status=ScanTask.STATUS_COMPLETED,
            progress=100,
            results=results,
            ai_report=ai_report,
            error="",
            completed_at=timezone.now(),
            updated_at=timezone.now(),
        )
    except Exception as exc:
        ScanTask.objects.filter(task_id=task_id).update(
            status=ScanTask.STATUS_FAILED,
            error=str(exc),
            completed_at=timezone.now(),
            updated_at=timezone.now(),
        )
    finally:
        _mark_inactive(task_id)


@api_view(["GET"])
@permission_classes([AllowAny])
def root_info(request):
    return Response(
        {
            "service": "AI Penetration Backend",
            "status": "ok",
            "api_root": "/api/",
            "docs_hint": "Use /api/status, /api/scan, /api/history",
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def auth_csrf(request):
    get_token(request)
    return Response({"success": True})


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def auth_session(request):
    get_token(request)
    return Response(
        {
            "authenticated": request.user.is_authenticated,
            "user": _auth_user_payload(request.user) if request.user.is_authenticated else None,
            "contact": _auth_contact_payload(),
        }
    )


@api_view(["POST"])
@throttle_classes([AnonRateThrottle])
@permission_classes([AllowAny])
def auth_login(request):
    payload = request.data if isinstance(request.data, dict) else {}
    email = str(payload.get("email", "")).strip().lower()
    password = payload.get("password", "")

    if not email or not password:
        return _auth_error_response("Email and password are required.", status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=email, password=password)
    if user is None:
        return _auth_error_response("Invalid email or password.", status.HTTP_401_UNAUTHORIZED)

    login(request, user)
    get_token(request)
    return Response(
        {
            "success": True,
            "user": _auth_user_payload(user),
        }
    )


@api_view(["POST"])
@throttle_classes([AnonRateThrottle])
@permission_classes([AllowAny])
def auth_signup(request):
    payload = request.data if isinstance(request.data, dict) else {}
    full_name = str(payload.get("full_name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = payload.get("password", "")
    confirm_password = payload.get("confirm_password", "")
    access_code = payload.get("access_code", "")

    if not full_name or not email or not password or not confirm_password:
        return _auth_error_response("All fields are required.", status.HTTP_400_BAD_REQUEST)
    if access_code != settings.SIGNUP_ACCESS_CODE:
        return _auth_error_response(
            "Invalid access code. If you need one, contact us.",
            status.HTTP_400_BAD_REQUEST,
        )
    if password != confirm_password:
        return _auth_error_response("Passwords do not match.", status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username__iexact=email).exists():
        return _auth_error_response(
            "An account with this email already exists.",
            status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=full_name,
    )
    login(request, user, backend=MODEL_AUTH_BACKEND)
    get_token(request)
    return Response(
        {
            "success": True,
            "user": _auth_user_payload(user),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def auth_logout(request):
    logout(request)
    return Response({"success": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_index(request):
    return Response(
        {
            "endpoints": {
                "status": "/api/status",
                "start_scan": "/api/scan",
                "scan_detail": "/api/scan/<task_id>",
                "history": "/api/history?limit=100",
            }
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def system_status(request):
    active_from_db = ScanTask.objects.filter(
        user=request.user,
        status__in=[ScanTask.STATUS_PENDING, ScanTask.STATUS_RUNNING],
    ).count()

    total_scans = ScanTask.objects.filter(user=request.user).count()

    # Determine tool status by checking if they can be executed
    availability = get_tool_availability()
    tool_status = []
    tool_names = {
        "nmap": "Nmap",
        "owaspzap": "OWASPZap",
        "sqlmap": "SQLMap",
        "whatweb": "WhatWeb",
    }
    for tool in ["nmap", "owaspzap", "sqlmap", "whatweb"]:
        tool_status.append(
            {
                "id": tool,
                "name": tool_names.get(tool, tool),
                "status": "online" if availability.get(tool) else "offline",
            }
        )

    return Response(
        {
            "system_status": "operational",
            "active_tasks": active_from_db,
            "total_scans": total_scans,
            "tools": tool_status,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_scan(request):
    payload = request.data
    target = payload.get("target", "").strip()

    if not target:
        return Response(
            {"error": "Target hostname or IP is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not is_valid_target(target):
        return Response(
            {"error": "Target is not allowed. Use approved testing targets only."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    raw_tools = payload.get("tools", [])
    if isinstance(raw_tools, str):
        raw_tools = [raw_tools]
    tools = sanitize_tools(raw_tools)
    if not tools:
        return Response(
            {"error": "At least one supported tool is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    scan_type = sanitize_scan_type(payload.get("scan_type", "normal"))

    try:
        scan_task = ScanTask.objects.create(
            user=request.user,
            target=target,
            tools=tools,
            scan_type=scan_type,
            status=ScanTask.STATUS_PENDING,
            progress=0,
            results={},
        )
        logger.info("Created scan task %s for user %s", scan_task.task_id, request.user)
    except OperationalError as exc:
        logger.error("DB error creating scan task: %s", exc)
        if "database or disk is full" in str(exc).lower():
            return Response(
                {
                    "error": (
                        "Server storage is full. Free disk space and retry the scan."
                    )
                },
                status=status.HTTP_507_INSUFFICIENT_STORAGE,
            )
        raise

    EXECUTOR.submit(_run_scan_task, scan_task.task_id)

    return Response(
        {
            "task_id": scan_task.task_id,
            "status": scan_task.status,
            "target": scan_task.target,
            "tools": scan_task.tools,
            "scan_type": scan_task.scan_type,
        },
        status=status.HTTP_202_ACCEPTED,
    )


@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def scan_detail(request, task_id: str):
    scan_task = ScanTask.objects.filter(task_id=task_id, user=request.user).first()
    if not scan_task:
        return Response({"error": "Scan not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(_serialize_scan(scan_task))

    if scan_task.status in {ScanTask.STATUS_PENDING, ScanTask.STATUS_RUNNING}:
        scan_task.status = ScanTask.STATUS_CANCELLED
        scan_task.completed_at = timezone.now()
        scan_task.save(update_fields=["status", "completed_at", "updated_at"])
        logger.info("Cancelled task %s by user %s", task_id, request.user)

    scan_task.delete()
    logger.info("Deleted task %s by user %s", task_id, request.user)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def scan_history(request):
    raw_limit = request.query_params.get("limit", "100")
    try:
        limit = max(1, min(500, int(raw_limit)))
    except ValueError:
        limit = 100

    history_items = ScanTask.objects.filter(user=request.user).order_by("-created_at")[:limit]
    payload = [_serialize_history_item(task) for task in history_items]
    return Response({"history": payload, "count": len(payload), "limit": limit})


def custom_404(request, exception=None):
    return JsonResponse(
        {"error": "The requested resource was not found.", "status": 404},
        status=404,
    )


def custom_500(request):
    return JsonResponse(
        {
            "error": "A server error occurred. Our engineers have been notified.",
            "status": 500,
        },
        status=500,
    )
