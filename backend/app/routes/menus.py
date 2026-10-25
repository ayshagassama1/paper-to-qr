from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pymongo.collection import Collection

from app.db import get_restaurants
from app.models import PublicDish, PublicMenu

router = APIRouter()


@router.get("/menus/{slug}", response_model=PublicMenu)
def get_public_menu(slug: str, restaurants: Annotated[Collection, Depends(get_restaurants)]) -> PublicMenu:
    doc = restaurants.find_one({"slug": slug.lower()})
    if doc is None:
        raise HTTPException(404, "Restaurant not found")
    # Customers only see the name and the active dishes; never the code.
    return PublicMenu(
        name=doc["name"],
        dishes=[PublicDish(name=d["name"], price_cents=d["price_cents"]) for d in doc["dishes"] if d["active"]],
    )
