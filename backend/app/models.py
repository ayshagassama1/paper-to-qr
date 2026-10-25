from pydantic import BaseModel, Field


class ExtractedDish(BaseModel):
    name: str = Field(description="Dish name exactly as written on the menu")
    price: float | None = Field(description="Price in euros as a decimal number, or null if no price is legible")


class ExtractedMenu(BaseModel):
    dishes: list[ExtractedDish]


class Dish(BaseModel):
    id: str
    name: str
    price_cents: int | None
    active: bool


class PublicDish(BaseModel):
    name: str
    price_cents: int | None


class PublicMenu(BaseModel):
    name: str
    dishes: list[PublicDish]


class RestaurantPrivate(BaseModel):
    name: str
    slug: str
    code: str
    dishes: list[Dish]
    extraction_empty: bool = False
