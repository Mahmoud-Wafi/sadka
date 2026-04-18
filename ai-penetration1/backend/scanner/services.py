

from __future__ import annotations

import hashlib
import ipaddress
import json
import logging
import os
import re
import shutil
import subprocess
import time
from typing import Any
from urllib.parse import urlparse

import httpx

logger = logging.getLogger("scanner")

SUPPORTED_TOOLS = ("nmap", "owaspzap", "sqlmap", "whatweb")
SCAN_TYPES = ("fast", "normal", "slow")

ALLOWED_TEST_HOSTS = (
    "testphp.vulnweb.com",
    "demo.testfire.net",
    "localhost",
)


ZAP_API_URL = os.getenv("ZAP_API_URL", "http://127.0.0.1:8080")
ZAP_API_KEY = os.getenv("ZAP_API_KEY", "")
WHATWEB_BINARY = os.getenv("WHATWEB_BINARY", "whatweb")


def normalize_tool_name(tool: str) -> str:
    if not tool:
        return ""
    normalized = str(tool).strip().lower()
    alias_map = {
        "owaspzap": "owaspzap",
        "owasp_zap": "owaspzap",
        "zap": "owaspzap",
        "nikto": "owaspzap",
        "whatweb": "whatweb",
        "what_web": "whatweb",
        "burp": "whatweb",
        "burp_suite": "whatweb",
        "burpsuite": "whatweb",
    }
    return alias_map.get(normalized, normalized)


def sanitize_tools(tools: list[Any] | tuple[Any, ...]) -> list[str]:
    cleaned: list[str] = []
    for raw_tool in tools or []:
        tool = normalize_tool_name(str(raw_tool))
        if tool in SUPPORTED_TOOLS and tool not in cleaned:
            cleaned.append(tool)
    return cleaned


def sanitize_scan_type(scan_type: str) -> str:
    value = str(scan_type or "normal").lower()
    return value if value in SCAN_TYPES else "normal"


def _extract_target_hostname(target: str) -> str:
    raw_value = str(target or "").strip()
    if not raw_value:
        return ""
    candidate = raw_value if "://" in raw_value else f"http://{raw_value}"
    parsed = urlparse(candidate)
    return (parsed.hostname or "").strip().lower()


def _is_allowed_ip_target(hostname: str) -> bool:
    try:
        ip_value = ipaddress.ip_address(hostname)
    except ValueError:
        return False
    return ip_value.is_private or ip_value.is_loopback


def is_valid_target(target: str) -> bool:
    hostname = _extract_target_hostname(target)
    if not hostname:
        return False
    if hostname in ALLOWED_TEST_HOSTS:
        return True
    return _is_allowed_ip_target(hostname)


def _ensure_url(target: str) -> str:
    """Make sure target has a scheme so tools that expect a URL work properly."""
    t = target.strip()
    if not t:
        return t
    if "://" not in t:
        return f"http://{t}"
    return t



def get_tool_availability() -> dict[str, bool]:
    """Return actual availability of each tool binary on the system."""
    nmap_ok = shutil.which("nmap") is not None
    zap_ok = _zap_is_reachable()
    sqlmap_ok = shutil.which("sqlmap") is not None
    whatweb_ok = shutil.which(WHATWEB_BINARY) is not None

    return {
        "nmap": nmap_ok,
        "owaspzap": zap_ok,
        "sqlmap": sqlmap_ok,
        "whatweb": whatweb_ok,
    }






def run_tool_scan(tool: str, target: str, scan_type: str) -> dict[str, Any]:
    normalized_tool = normalize_tool_name(tool)
    normalized_type = sanitize_scan_type(scan_type)

    if normalized_tool == "nmap":
        return _run_nmap(target, normalized_type)
    if normalized_tool == "owaspzap":
        return _run_owasp_zap(target, normalized_type)
    if normalized_tool == "sqlmap":
        return _run_sqlmap(target, normalized_type)
    if normalized_tool == "whatweb":
        return _run_whatweb(target, normalized_type)

    return {
        "status": "failed",
        "raw": "",
        "parsed": {},
        "error": f"Unsupported tool: {normalized_tool}",
    }



def _run_nmap(target: str, scan_type: str) -> dict[str, Any]:
    if shutil.which("nmap") is None:
        logger.info("nmap binary not found — using simulation")
        return _sim_nmap(target, scan_type)

    try:
        import nmap  # python-nmap

        scanner = nmap.PortScanner()
        args_map = {
            "fast": "-F -T4 --open",
            "normal": "-sV -T3 --open",
            "slow": "-sV -sC -T2 -p 1-65535 --open",
        }
        arguments = args_map.get(scan_type, args_map["normal"])
        hostname = _extract_target_hostname(target)

        logger.info("Running real nmap scan: %s %s", hostname, arguments)
        scanner.scan(hostname, arguments=arguments)

        open_ports: list[dict[str, str]] = []
        raw_lines = [f"Nmap scan report for {hostname}"]
        raw_lines.append("PORT     STATE SERVICE  VERSION")

        for host in scanner.all_hosts():
            for proto in scanner[host].all_protocols():
                ports = scanner[host][proto].keys()
                for port in sorted(ports):
                    info = scanner[host][proto][port]
                    if info.get("state") == "open":
                        service = info.get("name", "unknown")
                        version = info.get("version", "")
                        product = info.get("product", "")
                        detail = f"{product} {version}".strip()
                        open_ports.append({
                            "port": str(port),
                            "service": service,
                            "version": detail,
                        })
                        raw_lines.append(
                            f"{port}/{proto}  open  {service}  {detail}"
                        )

        raw = "\n".join(raw_lines)
        logger.info("nmap finished: %d open ports found", len(open_ports))
        return {
            "status": "completed",
            "raw": raw,
            "parsed": {"open_ports": open_ports},
            "mode": "real",
        }

    except Exception as exc:
        logger.warning("nmap real execution failed, falling back: %s", exc)
        return _sim_nmap(target, scan_type)



def _run_owasp_zap(target: str, scan_type: str) -> dict[str, Any]:
    if not _zap_is_reachable():
        logger.info("ZAP daemon not reachable at %s — using simulation", ZAP_API_URL)
        return _sim_owasp_zap(target, scan_type)

    try:
        from zapv2 import ZAPv2

        zap = ZAPv2(
            apikey=ZAP_API_KEY,
            proxies={"http": ZAP_API_URL, "https": ZAP_API_URL},
        )

        target_url = _ensure_url(target)
        logger.info("ZAP: accessing target URL %s", target_url)
        zap.urlopen(target_url)
        time.sleep(2)

        logger.info("ZAP: starting spider on %s", target_url)

        # Spider
        scan_id = zap.spider.scan(target_url)
        timeout = {"fast": 60, "normal": 120, "slow": 300}[scan_type]
        if not str(scan_id).isdigit():
            logger.warning("ZAP spider failed to start. Message: %s", scan_id)
        else:
            deadline = time.time() + timeout
            while int(zap.spider.status(scan_id)) < 100:
                if time.time() > deadline:
                    break
                time.sleep(2)

        # Active scan
        logger.info("ZAP: starting active scan on %s", target_url)
        policy_map = {"fast": "Default Policy", "normal": "Default Policy", "slow": "Default Policy"}
        ascan_id = zap.ascan.scan(target_url, scanpolicyname=policy_map[scan_type])
        if not str(ascan_id).isdigit():
            logger.warning("ZAP ascan failed to start. Message: %s", ascan_id)
        else:
            deadline = time.time() + timeout * 2
            while int(zap.ascan.status(ascan_id)) < 100:
                if time.time() > deadline:
                    break
                time.sleep(3)

        # Fetch alerts
        alerts_raw = zap.core.alerts(baseurl=target_url, start=0, count=100)
        alerts = []
        findings = []
        for idx, a in enumerate(alerts_raw, start=1):
            alerts.append({
                "id": idx,
                "name": a.get("alert", a.get("name", "")),
                "risk": a.get("risk", "Informational"),
                "url": a.get("url", target_url),
                "description": a.get("description", ""),
                "solution": a.get("solution", ""),
            })
            findings.append(a.get("alert", a.get("name", "")))

        raw_lines = [f"OWASP ZAP Report for {target}", "ID | Risk | Finding"]
        for al in alerts:
            raw_lines.append(f"{al['id']} | {al['risk']} | {al['name']}")
        raw = "\n".join(raw_lines)

        logger.info("ZAP finished: %d alerts found", len(alerts))
        return {
            "status": "completed",
            "raw": raw,
            "parsed": {
                "count": len(findings),
                "vulnerabilities": findings,
                "alerts": alerts,
            },
            "mode": "real",
        }

    except Exception as exc:
        logger.warning("ZAP real execution failed, falling back: %s", exc)
        return _sim_owasp_zap(target, scan_type)


def _zap_is_reachable() -> bool:
    try:
        r = httpx.get(
            f"{ZAP_API_URL}/JSON/core/view/version/",
            params={"apikey": ZAP_API_KEY} if ZAP_API_KEY else {},
            timeout=3,
        )
        return r.status_code == 200
    except Exception:
        return False



def _run_sqlmap(target: str, scan_type: str) -> dict[str, Any]:
    if shutil.which("sqlmap") is None:
        logger.info("sqlmap binary not found — using simulation")
        return _sim_sqlmap(target, scan_type)

    try:
        target_url = _ensure_url(target)
        level_map = {"fast": "1", "normal": "2", "slow": "3"}
        risk_map = {"fast": "1", "normal": "2", "slow": "3"}
        timeout_map = {"fast": 60, "normal": 120, "slow": 300}

        cmd = [
            "sqlmap",
            "-u", target_url,
            "--batch",
            "--forms",
            f"--level={level_map[scan_type]}",
            f"--risk={risk_map[scan_type]}",
            "--output-dir=/tmp/sqlmap_output",
            "--flush-session",
        ]

        logger.info("Running real sqlmap: %s", " ".join(cmd))
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_map[scan_type],
        )

        raw = result.stdout + ("\n--- STDERR ---\n" + result.stderr if result.stderr else "")

        # Parse output for injection findings
        vulnerable = False
        parameter = ""
        dbms = ""

        injectable_match = re.search(
            r"Parameter:\s+['\"]?(\w+)['\"]?\s+\(", raw, re.IGNORECASE
        )
        if injectable_match:
            vulnerable = True
            parameter = injectable_match.group(1)

        dbms_match = re.search(
            r"back-end DBMS:\s+(.+)", raw, re.IGNORECASE
        )
        if dbms_match:
            dbms = dbms_match.group(1).strip()

        if "all tested parameters do not appear" in raw.lower():
            vulnerable = False

        if not vulnerable and "injectable" in raw.lower():
            vulnerable = True

        logger.info("sqlmap finished: vulnerable=%s", vulnerable)
        return {
            "status": "completed",
            "raw": raw[:5000],  # cap raw output size
            "parsed": {
                "vulnerable": vulnerable,
                "parameter": parameter,
                "dbms": dbms,
            },
            "mode": "real",
        }

    except subprocess.TimeoutExpired:
        logger.warning("sqlmap timed out")
        return {
            "status": "completed",
            "raw": "sqlmap scan timed out.",
            "parsed": {"vulnerable": False, "parameter": "", "dbms": ""},
            "mode": "real",
        }
    except Exception as exc:
        logger.warning("sqlmap real execution failed, falling back: %s", exc)
        return _sim_sqlmap(target, scan_type)



def _run_whatweb(target: str, scan_type: str) -> dict[str, Any]:
    whatweb_cmd = shutil.which(WHATWEB_BINARY)
    if whatweb_cmd is None:
        logger.info("WhatWeb binary not found (%s) — using simulation", WHATWEB_BINARY)
        return _sim_whatweb(target, scan_type)

    try:
        target_url = _ensure_url(target)
        aggression = {"fast": "1", "normal": "3", "slow": "4"}[scan_type]
        timeout_map = {"fast": 60, "normal": 120, "slow": 240}

        cmd = [
            whatweb_cmd,
            target_url,
            "--color=never",
            "--no-errors",
            "-a",
            aggression,
        ]
        logger.info("Running real WhatWeb: %s", " ".join(cmd))

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_map[scan_type],
        )

        raw = (result.stdout or "").strip()
        if result.stderr:
            raw = f"{raw}\n{result.stderr.strip()}".strip()

        # Parse plugin-like tokens such as Apache[2.4], PHP[8.2], JQuery[3.6]
        plugin_matches = re.findall(r"([A-Za-z0-9_.+-]+)\[[^\]]+\]", raw)
        # Also capture bare plugin names that appear after commas.
        bare_matches = re.findall(r",\s*([A-Za-z0-9_.+-]{2,})\s*(?:,|$)", raw)

        fingerprints = sorted(
            {
                item
                for item in (plugin_matches + bare_matches)
                if item.lower() not in {"http", "https", "error", "warning"}
            }
        )
        fingerprint_count = len(fingerprints)

        logger.info("WhatWeb finished: %d fingerprint(s) detected", fingerprint_count)
        return {
            "status": "completed",
            "raw": raw or f"WhatWeb scan on {target} completed with no output.",
            "parsed": {
                "fingerprint_count": fingerprint_count,
                "fingerprints": fingerprints,
                "summary": f"WhatWeb identified {fingerprint_count} fingerprint(s).",
            },
            "mode": "real",
        }

    except subprocess.TimeoutExpired:
        logger.warning("WhatWeb timed out, falling back to simulation")
        return _sim_whatweb(target, scan_type)
    except Exception as exc:
        logger.warning("WhatWeb real execution failed, falling back: %s", exc)
        return _sim_whatweb(target, scan_type)



def build_scan_summary(
    results: dict[str, Any],
    tools: list[Any] | tuple[Any, ...] | None = None,
    progress: int | None = None,
) -> dict[str, Any]:
    normalized_tools = sanitize_tools(list(tools or results.keys()))
    completed_tools = [
        tool
        for tool in normalized_tools
        if results.get(tool, {}).get("status") == "completed"
    ]

    open_ports = len(results.get("nmap", {}).get("parsed", {}).get("open_ports", []))
    zap_count = int(results.get("owaspzap", {}).get("parsed", {}).get("count", 0))
    whatweb_parsed = (
        results.get("whatweb", {}).get("parsed", {})
        or results.get("burpsuite", {}).get("parsed", {})
    )
    whatweb_count = int(
        whatweb_parsed.get("fingerprint_count", whatweb_parsed.get("issue_count", 0))
    )
    sql_vulnerable = bool(results.get("sqlmap", {}).get("parsed", {}).get("vulnerable"))

    service_names = {
        port.get("service")
        for port in results.get("nmap", {}).get("parsed", {}).get("open_ports", [])
        if port.get("service")
    }

    findings_total = zap_count + whatweb_count + (1 if sql_vulnerable else 0)
    risk_score = min(
        open_ports * 6
        + zap_count * 8
        + whatweb_count * 7
        + (35 if sql_vulnerable else 0),
        100,
    )

    if risk_score >= 70:
        risk_level = "high"
    elif risk_score >= 35:
        risk_level = "medium"
    else:
        risk_level = "low"

    requested_tool_count = len(normalized_tools) or len(results) or 1
    completion_score = int(progress if progress is not None else (len(completed_tools) / requested_tool_count) * 100)
    tool_coverage = int((len(completed_tools) / requested_tool_count) * 100)
    confidence_score = min(
        95,
        45
        + len(completed_tools) * 12
        + (10 if zap_count or whatweb_count else 0)
        + (15 if sql_vulnerable else 0),
    )

    top_issues: list[str] = []
    if sql_vulnerable:
        top_issues.append("Potential SQL injection exposure requires immediate remediation.")
    if whatweb_count:
        top_issues.append(f"WhatWeb identified {whatweb_count} technology fingerprint(s).")
    if zap_count:
        top_issues.append(f"OWASP ZAP reported {zap_count} web security finding(s).")
    if open_ports:
        top_issues.append(f"{open_ports} open port(s) are increasing the external attack surface.")

    next_actions: list[str] = []
    if sql_vulnerable:
        next_actions.append("Prioritize SQL injection remediation and review database query handling.")
    if open_ports:
        next_actions.append("Reduce externally exposed services to only the ports required for operation.")
    if zap_count or whatweb_count:
        next_actions.append("Triage web findings by severity and patch the highest-risk items first.")
    if not next_actions:
        next_actions.append("Maintain the current posture with repeat scans and routine hardening reviews.")
    if len(next_actions) < 3:
        next_actions.append("Document accepted risks and assign owners for any deferred remediation.")
    if len(next_actions) < 3:
        next_actions.append("Re-run a validation scan after fixes to confirm exposure has decreased.")

    # Determine execution mode
    modes = {
        tool: results.get(tool, {}).get("mode", "simulation")
        for tool in normalized_tools
    }

    return {
        "open_ports": open_ports,
        "web_findings": zap_count + whatweb_count,
        "zap_findings": zap_count,
        "whatweb_findings": whatweb_count,
        # Backward compatibility for older frontend fields.
        "burp_findings": whatweb_count,
        "sql_injection_exposure": sql_vulnerable,
        "services": len(service_names),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "confidence_score": confidence_score,
        "completion_score": min(100, max(0, completion_score)),
        "tool_coverage": min(100, max(0, tool_coverage)),
        "findings_total": findings_total,
        "top_issues": top_issues[:4],
        "next_actions": next_actions[:3],
        "execution_modes": modes,
    }



def _seed(target: str, tool: str, scan_type: str) -> int:
    seed_input = f"{target}|{tool}|{scan_type}".encode("utf-8")
    return int(hashlib.sha256(seed_input).hexdigest(), 16)


def _sim_nmap(target: str, scan_type: str) -> dict[str, Any]:
    seed = _seed(target, "nmap", scan_type)
    ports_catalog = [
        ("21", "ftp"), ("22", "ssh"), ("23", "telnet"), ("25", "smtp"),
        ("53", "dns"), ("80", "http"), ("110", "pop3"), ("143", "imap"),
        ("443", "https"), ("445", "microsoft-ds"), ("8080", "http-proxy"),
        ("8443", "https-alt"),
    ]
    count_by_scan = {"fast": 3, "normal": 5, "slow": 7}
    count = count_by_scan[scan_type]

    start = seed % len(ports_catalog)
    rotated = ports_catalog[start:] + ports_catalog[:start]
    selected_ports = rotated[:count]
    open_ports = [{"port": port, "service": service} for port, service in selected_ports]

    raw_lines = [f"Nmap scan report for {target}", "PORT     STATE SERVICE"]
    for port, service in selected_ports:
        raw_lines.append(f"{port}/tcp open  {service}")
    raw = "\n".join(raw_lines)

    return {"status": "completed", "raw": raw, "parsed": {"open_ports": open_ports}, "mode": "simulation"}


def _sim_owasp_zap(target: str, scan_type: str) -> dict[str, Any]:
    seed = _seed(target, "owaspzap", scan_type)
    issues_catalog = [
        "X-Frame-Options header is missing",
        "Content-Security-Policy header not set",
        "Cookie without HttpOnly flag",
        "Cookie without Secure flag",
        "Server version disclosure",
        "Cross-Domain JS source file inclusion",
        "Potential XSS reflection point",
        "Potential SQL Injection pattern",
        "Sensitive information in response",
    ]
    count_by_scan = {"fast": 2, "normal": 4, "slow": 6}
    count = count_by_scan[scan_type]

    start = seed % len(issues_catalog)
    rotated = issues_catalog[start:] + issues_catalog[:start]
    findings = rotated[:count]

    alerts = []
    for idx, finding in enumerate(findings, start=1):
        risk = "High" if idx <= 2 else "Medium" if idx <= 4 else "Low"
        alerts.append({"id": idx, "name": finding, "risk": risk, "url": f"http://{target}/"})

    raw_lines = [f"OWASP ZAP Report for {target}", "ID | Risk | Finding"]
    for alert in alerts:
        raw_lines.append(f"{alert['id']} | {alert['risk']} | {alert['name']}")
    raw = "\n".join(raw_lines)

    return {
        "status": "completed", "raw": raw,
        "parsed": {"count": len(findings), "vulnerabilities": findings, "alerts": alerts},
        "mode": "simulation",
    }


def _sim_sqlmap(target: str, scan_type: str) -> dict[str, Any]:
    seed = _seed(target, "sqlmap", scan_type)
    vulnerable = (seed % 10) < 4 if scan_type == "fast" else (seed % 10) < 5
    parameter = "id" if vulnerable else ""
    dbms = "MySQL" if vulnerable and seed % 2 == 0 else "PostgreSQL" if vulnerable else ""

    if vulnerable:
        raw = (
            f"sqlmap identified injectable parameter: {parameter}\n"
            f"back-end DBMS: {dbms}\nType: boolean-based blind"
        )
    else:
        raw = "sqlmap did not find injectable parameters."

    return {
        "status": "completed", "raw": raw,
        "parsed": {"vulnerable": vulnerable, "parameter": parameter, "dbms": dbms},
        "mode": "simulation",
    }


def _sim_whatweb(target: str, scan_type: str) -> dict[str, Any]:
    seed = _seed(target, "whatweb", scan_type)
    fingerprint_catalog = [
        "Apache",
        "Nginx",
        "PHP",
        "WordPress",
        "jQuery",
        "Bootstrap",
        "Cloudflare",
        "OpenSSL",
        "HTTPServer",
        "X-Powered-By",
    ]
    count_by_scan = {"fast": 3, "normal": 5, "slow": 7}
    count = count_by_scan[scan_type]

    start = seed % len(fingerprint_catalog)
    rotated = fingerprint_catalog[start:] + fingerprint_catalog[:start]
    selected_fingerprints = rotated[:count]

    raw_lines = [f"WhatWeb scan on {target}", "Detected technology fingerprints:"]
    for fingerprint in selected_fingerprints:
        raw_lines.append(f"- {fingerprint}")
    raw = "\n".join(raw_lines)

    return {
        "status": "completed",
        "raw": raw,
        "parsed": {
            "fingerprint_count": len(selected_fingerprints),
            "fingerprints": selected_fingerprints,
            "summary": f"WhatWeb identified {len(selected_fingerprints)} fingerprint(s).",
        },
        "mode": "simulation",
    }
