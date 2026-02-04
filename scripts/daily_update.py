#!/usr/bin/env python3
"""
Codzienna aktualizacja Noosphere Observatory.
Uruchamiać przez Windows Task Scheduler lub cron.

Kolejność:
1. Scrape nowych postów z Moltbook
2. Scrape komentarzy
3. Generuj raport dzienny
4. Aktualizuj dashboard data
5. Opcjonalnie: upload na FTP
"""

import sys
import subprocess
import logging
from datetime import datetime
from pathlib import Path

# Setup
PROJECT_DIR = Path(__file__).parent.parent
SCRIPTS_DIR = PROJECT_DIR / "scripts"
LOG_DIR = PROJECT_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Logging
log_file = LOG_DIR / f"daily_update_{datetime.now().strftime('%Y-%m-%d')}.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def run_script(script_name, description, timeout=600):
    """Uruchom skrypt Python i zwróć sukces/porażkę."""
    script_path = SCRIPTS_DIR / script_name
    if not script_path.exists():
        logger.warning(f"Skrypt nie istnieje: {script_path}")
        return False

    logger.info(f"[START] {description}")
    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(PROJECT_DIR)
        )
        if result.returncode == 0:
            logger.info(f"[OK] {description}")
            return True
        else:
            logger.error(f"[FAIL] {description}: {result.stderr[:500]}")
            return False
    except subprocess.TimeoutExpired:
        logger.error(f"[TIMEOUT] {description} (>{timeout}s)")
        return False
    except Exception as e:
        logger.error(f"[ERROR] {description}: {e}")
        return False


def load_env_file():
    """Load variables from config/.env file."""
    env_path = PROJECT_DIR / "config" / ".env"
    env_vars = {}
    if env_path.exists():
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    env_vars[key] = value
    return env_vars


def upload_to_ftp():
    """Upload zaktualizowanych plików na FTP."""
    import ftplib
    import os

    # Load from .env file first, then check environment variables
    env_vars = load_env_file()

    FTP_HOST = os.environ.get("FTP_HOST") or env_vars.get("FTP_HOST", "ftp.noosphereproject.com")
    FTP_USER = os.environ.get("FTP_USER") or env_vars.get("FTP_USER")
    FTP_PASS = os.environ.get("FTP_PASS") or env_vars.get("FTP_PASS")

    if not FTP_USER or not FTP_PASS:
        logger.error("[FAIL] FTP credentials not set. Add FTP_USER and FTP_PASS to config/.env")
        return False

    dist_dir = PROJECT_DIR / "website" / "dist"
    data_dir = PROJECT_DIR / "website" / "public" / "data"

    try:
        ftp = ftplib.FTP(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)

        # Upload latest.json
        latest_json = data_dir / "latest.json"
        if latest_json.exists():
            with open(latest_json, 'rb') as f:
                ftp.storbinary('STOR data/latest.json', f)
            logger.info("Uploaded: data/latest.json")

        # Upload today's report folder
        today = datetime.now().strftime('%Y-%m-%d')
        report_dir = PROJECT_DIR / "website" / "public" / "reports" / today

        if report_dir.exists():
            # Ensure directory exists on FTP (ignore if already exists)
            for subdir in ["", "/raw", "/commentary"]:
                try:
                    ftp.mkd(f"reports/{today}{subdir}")
                except ftplib.error_perm:
                    pass  # Directory already exists

            # Upload files
            for file_path in report_dir.rglob('*'):
                if file_path.is_file():
                    rel_path = file_path.relative_to(report_dir)
                    remote_path = f"reports/{today}/{rel_path}".replace('\\', '/')
                    with open(file_path, 'rb') as f:
                        ftp.storbinary(f'STOR {remote_path}', f)
                    logger.info(f"Uploaded: {remote_path}")

        ftp.quit()
        logger.info("[OK] FTP upload complete")
        return True

    except Exception as e:
        logger.error(f"[FAIL] FTP upload: {e}")
        return False


def main():
    logger.info("=" * 60)
    logger.info("  NOOSPHERE DAILY UPDATE")
    logger.info(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60)

    results = {}

    # 1. Scrape nowych postów
    results['scrape_posts'] = run_script(
        'run_scanner.py',
        'Scraping Moltbook posts',
        timeout=300
    )

    # 2. Scrape komentarzy (tylko jeśli posty OK)
    if results['scrape_posts']:
        results['scrape_comments'] = run_script(
            'scrape_comments.py',
            'Scraping comments',
            timeout=600
        )
    else:
        results['scrape_comments'] = False
        logger.warning("Skipping comments (posts failed)")

    # 2.5. Analyze interactions (calculate network centrality) - CRITICAL FOR POWER STRUCTURE
    results['analyze_interactions'] = run_script(
        'analyze_interactions.py',
        'Analyzing interactions & centrality',
        timeout=300
    )

    # 3. Generuj raport dzienny
    results['daily_report'] = run_script(
        'generate_daily_report.py',
        'Generating daily report',
        timeout=120
    )

    # 4. Aktualizuj dashboard
    results['dashboard_data'] = run_script(
        'generate_dashboard_data.py',
        'Updating dashboard data',
        timeout=60
    )

    # 5. Upload na FTP (opcjonalnie)
    if '--upload' in sys.argv or '-u' in sys.argv:
        results['ftp_upload'] = upload_to_ftp()
    else:
        logger.info("FTP upload skipped (use --upload to enable)")
        results['ftp_upload'] = None

    # Podsumowanie
    logger.info("")
    logger.info("=" * 60)
    logger.info("  SUMMARY")
    logger.info("=" * 60)
    for task, success in results.items():
        status = "OK" if success else ("SKIP" if success is None else "FAIL")
        logger.info(f"  {task}: {status}")

    # Exit code
    failures = sum(1 for v in results.values() if v is False)
    if failures > 0:
        logger.warning(f"\n{failures} task(s) failed")
        sys.exit(1)
    else:
        logger.info("\nAll tasks completed successfully")
        sys.exit(0)


if __name__ == "__main__":
    main()
