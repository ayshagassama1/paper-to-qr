import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pymongo.collection import Collection

from app import config, extraction
from app.codes import new_code, unique_slug
from app.db import get_restaurants
from app.models import Dish, RestaurantPrivate

router = APIRouter()


def to_private(doc: dict, extraction_empty: bool = False) -> RestaurantPrivate:
    return RestaurantPrivate(
        name=doc["name"],
        slug=doc["slug"],
        code=doc["code"],
        dishes=[Dish(**d) for d in doc["dishes"]],
        extraction_empty=extraction_empty,
    )


@router.post("/restaurants", status_code=201, response_model=RestaurantPrivate)
def create_restaurant(
    name: Annotated[str, Form()],
    images: Annotated[list[UploadFile], File()],
    restaurants: Annotated[Collection, Depends(get_restaurants)],
) -> RestaurantPrivate:
    name = name.strip()
    if not name:
        raise HTTPException(422, "Restaurant name is required")
    if not 1 <= len(images) <= config.MAX_IMAGES:
        raise HTTPException(422, f"Upload between 1 and {config.MAX_IMAGES} photos")

    # Photos stay in memory for the extraction only; they are never stored.
    extracted = extraction.extract_dishes([image.file.read() for image in images])

    now = datetime.now(UTC)
    doc = {
        "name": name,
        "slug": unique_slug(name, lambda s: restaurants.count_documents({"slug": s}, limit=1) > 0),
        "code": new_code(lambda c: restaurants.count_documents({"code": c}, limit=1) > 0),
        "dishes": [
            {
                "id": str(uuid.uuid4()),
                "name": d.name.strip(),
                "price_cents": None if d.price is None else round(d.price * 100),
                "active": True,
            }
            for d in extracted
        ],
        "created_at": now,
        "updated_at": now,
    }
    restaurants.insert_one(doc)
    return to_private(doc, extraction_empty=not doc["dishes"])
