import base64
import logging
import time

import anthropic

from app import config
from app.models import ExtractedDish, ExtractedMenu

logger = logging.getLogger(__name__)

INSTRUCTION = """These photos show one restaurant menu (printed, or handwritten on a chalkboard).
List every dish or drink that is offered, with its price.

- Keep each dish name as written on the menu, including accents. Fix obvious handwriting slips only.
- Prices: convert notations like "12,5", "12€50", "12.50 €" or "12 e 50" to a decimal number of euros (12.5).
- If no price is legible for a dish, use null.
- Ignore section titles (Starters, Desserts...), the restaurant name, dates, opening hours and decorations.
- If several photos show the same dish, list it once.
- If you can't find any dish, return an empty list."""

_client = anthropic.Anthropic(
    api_key=config.ANTHROPIC_API_KEY or None,
    timeout=config.EXTRACTION_TIMEOUT_SECONDS,
    max_retries=0,
)


def _media_type(data: bytes) -> str:
    if data.startswith(b"\x89PNG"):
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return "image/jpeg"


def extract_dishes(images: list[bytes]) -> list[ExtractedDish]:
    """Read dishes and prices from menu photos. Any failure returns [] so the manager can add dishes by hand."""
    content = [
        {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": _media_type(data),
                "data": base64.standard_b64encode(data).decode(),
            },
        }
        for data in images
    ]
    content.append({"type": "text", "text": INSTRUCTION})

    started = time.monotonic()
    try:
        response = _client.messages.parse(
            model=config.EXTRACTION_MODEL,
            max_tokens=8000,
            output_config={"effort": "low"},
            output_format=ExtractedMenu,
            messages=[{"role": "user", "content": content}],
        )
    except anthropic.APITimeoutError:
        logger.warning("extraction timed out after %.1fs", time.monotonic() - started)
        return []
    except anthropic.APIStatusError as e:
        logger.warning("extraction API error %s: %s", e.status_code, e.message)
        return []
    except anthropic.APIConnectionError as e:
        logger.warning("extraction connection error: %s", e)
        return []
    except ValueError as e:
        # A truncated or malformed answer fails schema validation.
        logger.warning("extraction output could not be parsed: %s", e)
        return []

    logger.info(
        "extraction: %.1fs, %d images, %d bytes, %d input / %d output tokens, stop=%s",
        time.monotonic() - started,
        len(images),
        sum(len(i) for i in images),
        response.usage.input_tokens,
        response.usage.output_tokens,
        response.stop_reason,
    )
    if response.stop_reason == "refusal" or response.parsed_output is None:
        return []
    return [d for d in response.parsed_output.dishes if d.name.strip()]
