import re
import secrets
import unicodedata
from collections.abc import Callable

# No 0/O or 1/I/L, so a code read off a screen or a note can't be mistyped.
CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 6

# Paths the site already uses; a restaurant slug must never shadow them.
RESERVED_SLUGS = {"api", "assets"}


def normalize_code(raw: str) -> str:
    """Accept `k7q-29p`, `K7Q29P` or ` K7Q 29P ` and return the stored form `K7Q29P`."""
    return re.sub(r"[\s-]", "", raw).upper()


def new_code(is_taken: Callable[[str], bool]) -> str:
    while True:
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))
        if not is_taken(code):
            return code


def slugify(name: str) -> str:
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_name.lower()).strip("-")
    return slug or "restaurant"


def unique_slug(name: str, is_taken: Callable[[str], bool]) -> str:
    base = slugify(name)
    slug, n = base, 1
    while slug in RESERVED_SLUGS or is_taken(slug):
        n += 1
        slug = f"{base}-{n}"
    return slug
