import time

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .views import _run_scan_task


class ScannerApiTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.password = "StrongPass123!"
        self.user = get_user_model().objects.create_user(
            username="tester@example.com",
            email="tester@example.com",
            password=self.password,
            first_name="Tester",
        )

    def login(self) -> None:
        self.assertTrue(self.client.login(username=self.user.username, password=self.password))

    def test_dashboard_requires_authentication(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 302)
        self.assertIn("/login/", response["Location"])

    def test_signup_requires_valid_access_code(self):
        response = self.client.post(
            "/signup/",
            {
                "full_name": "Another User",
                "email": "another@example.com",
                "password": "AnotherPass123!",
                "confirm_password": "AnotherPass123!",
                "access_code": "wrong-code",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Invalid access code")

    def test_login_view_preserves_email_on_failed_submit(self):
        response = self.client.post(
            "/login/",
            {
                "email": "wrong@example.com",
                "password": "BadPass123!",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'value="wrong@example.com"', html=False)
        self.assertNotContains(response, 'value="BadPass123!"', html=False)

    def test_signup_view_preserves_non_sensitive_values_on_failed_submit(self):
        response = self.client.post(
            "/signup/",
            {
                "full_name": "Another User",
                "email": "another@example.com",
                "password": "AnotherPass123!",
                "confirm_password": "AnotherPass123!",
                "access_code": "wrong-code",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'value="Another User"', html=False)
        self.assertContains(response, 'value="another@example.com"', html=False)
        self.assertContains(response, 'value="wrong-code"', html=False)
        self.assertNotContains(response, 'value="AnotherPass123!"', html=False)

    def test_auth_session_reports_unauthenticated_state(self):
        response = self.client.get("/api/auth/session")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertFalse(payload["authenticated"])
        self.assertIn("contact", payload)

    def test_json_signup_requires_valid_access_code(self):
        response = self.client.post(
            "/api/auth/signup",
            {
                "full_name": "Another User",
                "email": "json-user@example.com",
                "password": "AnotherPass123!",
                "confirm_password": "AnotherPass123!",
                "access_code": "wrong-code",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid access code", response.json()["error"])

    def test_json_signup_creates_session_with_multiple_auth_backends(self):
        response = self.client.post(
            "/api/auth/signup",
            {
                "full_name": "Fresh User",
                "email": "fresh-user@example.com",
                "password": "AnotherPass123!",
                "confirm_password": "AnotherPass123!",
                "access_code": settings.SIGNUP_ACCESS_CODE,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()["success"])

        session_response = self.client.get("/api/auth/session")
        self.assertEqual(session_response.status_code, 200)
        self.assertTrue(session_response.json()["authenticated"])

    def test_json_login_creates_authenticated_session(self):
        response = self.client.post(
            "/api/auth/login",
            {
                "email": self.user.email,
                "password": self.password,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])

        session_response = self.client.get("/api/auth/session")
        self.assertEqual(session_response.status_code, 200)
        self.assertTrue(session_response.json()["authenticated"])

    def test_status_endpoint_contract(self):
        self.login()
        response = self.client.get("/api/status")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("active_tasks", payload)
        self.assertIn("total_scans", payload)
        self.assertIn("tools", payload)
        tools_payload = payload["tools"]
        if isinstance(tools_payload, dict):
            tool_ids = list(tools_payload.keys())
        else:
            tool_ids = [
                item.get("id", item)
                for item in tools_payload
            ]
        self.assertIn("owaspzap", tool_ids)
        self.assertIn("whatweb", tool_ids)

    def test_scan_lifecycle_and_history(self):
        self.login()
        start_response = self.client.post(
            "/api/scan",
            {
                "target": "testphp.vulnweb.com",
                "tools": ["nmap", "owaspzap", "sqlmap", "whatweb"],
                "scan_type": "fast",
            },
            format="json",
        )
        self.assertEqual(start_response.status_code, 202)
        task_id = start_response.json()["task_id"]

        # Run worker synchronously in tests to avoid threading issues with in-memory DB.
        _run_scan_task(task_id)

        for _ in range(5):
            detail_response = self.client.get(f"/api/scan/{task_id}")
            self.assertEqual(detail_response.status_code, 200)
            status_value = detail_response.json()["status"]
            if status_value in {"completed", "failed"}:
                break
            time.sleep(0.1)

        detail_payload = detail_response.json()
        self.assertIn(detail_payload["status"], {"completed", "failed"})
        self.assertIn("results", detail_payload)
        self.assertIn("summary", detail_payload)
        self.assertIn("ai_report", detail_payload)

        history_response = self.client.get("/api/history?limit=10")
        self.assertEqual(history_response.status_code, 200)
        history_payload = history_response.json()
        self.assertGreaterEqual(len(history_payload.get("history", [])), 1)
        self.assertIn("summary", history_payload["history"][0])

    def test_scan_rejects_invalid_target(self):
        self.login()
        response = self.client.post(
            "/api/scan",
            {"target": "example.com", "tools": ["nmap"], "scan_type": "fast"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
