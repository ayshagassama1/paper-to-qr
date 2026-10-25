import mongomock
import pytest
from fastapi.testclient import TestClient

from app import extraction
from app.db import get_restaurants
from app.main import app
from app.models import ExtractedDish


@pytest.fixture
def collection():
    coll = mongomock.MongoClient()["paper_to_qr"]["restaurants"]
    coll.create_index("code", unique=True)
    coll.create_index("slug", unique=True)
    return coll


@pytest.fixture
def extracted(monkeypatch):
    """Dishes the stubbed extraction returns; tests can replace the list contents."""
    dishes = [
        ExtractedDish(name="Quiche lorraine", price=9.5),
        ExtractedDish(name="Tarte tatin", price=None),
    ]
    monkeypatch.setattr(extraction, "extract_dishes", lambda images: list(dishes))
    return dishes


@pytest.fixture
def client(collection, extracted):
    app.dependency_overrides[get_restaurants] = lambda: collection
    yield TestClient(app)
    app.dependency_overrides.clear()
