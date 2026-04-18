from __future__ import annotations

from typing import Any

from django.conf import settings

from .services import build_scan_summary


def generate_report(target: str, results: dict[str, Any]) -> str:
    ai_text = _generate_openai_report(target, results)
    if ai_text:
        return ai_text
    return _generate_fallback_report(target, results)


def _generate_openai_report(target: str, results: dict[str, Any]) -> str | None:
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    model = getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")
    if not api_key:
        return None

    try:
        from openai import OpenAI
    except Exception:
        return None

    try:
        client = OpenAI(api_key=api_key)
        summary = build_scan_summary(results)
        prompt = (
            "You are a cybersecurity assistant. Review the following scan results and return "
            "plain text in English only with exactly these headings: Executive Summary, "
            "Top Issues, Recommendations, Next Actions. Keep it concise and practical.\n\n"
            f"Target: {target}\n"
            f"Computed Summary: {summary}\n"
            f"Results: {results}\n"
        )
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "Return concise, practical security guidance in English only.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )
        return (response.choices[0].message.content or "").strip()
    except Exception:
        return None


def _generate_fallback_report(target: str, results: dict[str, Any]) -> str:
    summary = build_scan_summary(results)

    lines = [
        "Executive Summary:",
        (
            f"- Target: {target}. Overall risk is {summary['risk_level'].title()} "
            f"with a risk score of {summary['risk_score']}/100 and a confidence score "
            f"of {summary['confidence_score']}/100."
        ),
        (
            f"- Tool coverage reached {summary['tool_coverage']}% with "
            f"{summary['findings_total']} total finding(s) across the selected checks."
        ),
        "Top Issues:",
        *[f"- {issue}" for issue in summary["top_issues"]],
        "Recommendations:",
        "- Restrict exposed ports using host and network firewall controls.",
        "- Patch web findings in priority order and verify the fixes with a follow-up scan.",
        "- Enforce input validation and parameterized queries throughout the application stack.",
        "Next Actions:",
        *[f"- {action}" for action in summary["next_actions"]],
        "Note: This report was generated in fallback mode (no OpenAI key configured).",
    ]
    return "\n".join(lines)
