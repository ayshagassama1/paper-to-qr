import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from pymongo import ReturnDocument
from pymongo.collection import Collection

from app.codes import normalize_code
from app.db import get_restaurants
from app.models import Dish, DishCreate, DishUpdate, RestaurantPrivate
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


@router.post("/dishes", status_code=201, response_model=Dish)
def add_dish(
    body: DishCreate,
    doc: Annotated[dict, Depends(restaurant_by_code)],
    restaurants: Annotated[Collection, Depends(get_restaurants)],
) -> Dish:
    dish = Dish(id=str(uuid.uuid4()), name=body.name, price_cents=body.price_cents, active=True)
    restaurants.update_one(
        {"_id": doc["_id"]},
        {"$push": {"dishes": dish.model_dump()}, "$set": {"updated_at": datetime.now(UTC)}},
    )
    return dish


@router.patch("/dishes/{dish_id}", response_model=Dish)
def update_dish(
    dish_id: str,
    body: DishUpdate,
    doc: Annotated[dict, Depends(restaurant_by_code)],
    restaurants: Annotated[Collection, Depends(get_restaurants)],
) -> Dish:
    index = next((i for i, d in enumerate(doc["dishes"]) if d["id"] == dish_id), None)
    if index is None:
        raise HTTPException(404, "Dish not found")
    # exclude_unset keeps "price_cents": null (price removed) apart from a field that wasn't sent.
    changes = body.model_dump(exclude_unset=True)
    if changes.get("name", "") is None or changes.get("active", False) is None:
        raise HTTPException(422, "Name and active can't be null")
    # Address the dish by index, guarded by its id so a concurrent delete can't shift the target.
    updated = restaurants.find_one_and_update(
        {"_id": doc["_id"], f"dishes.{index}.id": dish_id},
        {"$set": {**{f"dishes.{index}.{k}": v for k, v in changes.items()}, "updated_at": datetime.now(UTC)}},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        raise HTTPException(409, "The menu changed, reload it and try again")
    return Dish(**updated["dishes"][index])


@router.delete("/dishes/{dish_id}", status_code=204)
def delete_dish(
    dish_id: str,
    doc: Annotated[dict, Depends(restaurant_by_code)],
    restaurants: Annotated[Collection, Depends(get_restaurants)],
) -> Response:
    result = restaurants.update_one(
        {"_id": doc["_id"], "dishes.id": dish_id},
        {"$pull": {"dishes": {"id": dish_id}}, "$set": {"updated_at": datetime.now(UTC)}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Dish not found")
    return Response(status_code=204)
