import os
from pathlib import Path

from dotenv import load_dotenv

# Local development reads backend/.env; on Lambda the variables come from the SAM template.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

MONGODB_URI = os.environ.get("MONGODB_URI", "")
MONGODB_DB = os.environ.get("MONGODB_DB", "paper_to_qr")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

EXTRACTION_MODEL = "claude-haiku-5-5"
# Stays under the 29 s Lambda timeout so a slow extraction still creates the restaurant.
EXTRACTION_TIMEOUT_SECONDS = 25
MAX_IMAGES = 5
