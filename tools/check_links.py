"""Check that cited source URLs still answer. Run by hand: python -m tools.check_links [file.json ...]"""

import ssl
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse

import certifi

from tools.content import CONTENT_DIR, fiche_paths, load_json

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"
DELAY_SECONDS = 2  # per host: party sites ban fast scrapers
# macOS's /etc/ssl/cert.pem lags behind new roots (lcp.fr's Sectigo R46 failed there).
SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())


def status(url: str) -> int | str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=30, context=SSL_CONTEXT) as response:
            return response.status
    except urllib.error.HTTPError as error:
        return error.code
    except (urllib.error.URLError, TimeoutError) as error:
        return str(error)


def check_host(urls: list[str]) -> int:
    """Check one host's URLs one by one, DELAY_SECONDS apart; return how many failed."""
    broken = 0
    for i, url in enumerate(urls):
        if i:
            time.sleep(DELAY_SECONDS)
        code = status(url)
        if code != 200:
            broken += 1
            print(f"{code}\t{url}", flush=True)
    return broken


def main() -> int:
    docs = [Path(arg) for arg in sys.argv[1:]] or [CONTENT_DIR / "perimetre.json", CONTENT_DIR / "sondages.json", *fiche_paths()]
    urls = sorted({s["url"] for path in docs for s in load_json(path)["sources"].values()})
    by_host: dict[str, list[str]] = {}
    for url in urls:
        by_host.setdefault(urlparse(url).netloc, []).append(url)
    # Hosts are checked in parallel (the politeness delay is per host), so a full run takes minutes, not a quarter of an hour.
    with ThreadPoolExecutor(max_workers=16) as pool:
        broken = sum(pool.map(check_host, by_host.values()))
    print(f"{len(urls) - broken}/{len(urls)} liens OK")
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
