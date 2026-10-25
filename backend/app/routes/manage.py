from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException
from pymongo.collection import Collection

from app.codes import normalize_code
from app.db import get_restaurants
from app.models import RestaurantPrivate
from app.routes.restaurants import to_private

router = APIRouter(prefix="/manage")


def restaurant_by_code(
    restaurants: Annotated[Collection, Depends(get_restaurants)],
    x_menu_code: Annotated[str, Header()] = "",
) -> dict:
    # The code travels in a header so it never lands in CloudFront or API Gateway access logs.
    doc = restaurants.find_one({"code": normalize_code(x_menu_code)}) if x_menu_code.strip() else None
    if doc is None:
        raise HTTPException(404, "Restaurant not found")
    return doc


@router.get("", response_model=RestaurantPrivate)
def get_menu(doc: Annotated[dict, Depends(restaurant_by_code)]) -> RestaurantPrivate:
    return to_private(doc)
