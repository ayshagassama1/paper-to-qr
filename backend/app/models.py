from pydantic import BaseModel, Field, field_validator


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


class DishCreate(BaseModel):
    name: str
    price_cents: int | None = Field(default=None, ge=0)

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("A dish needs a name")
        return v.strip()


class DishUpdate(BaseModel):
    name: str | None = None
    price_cents: int | None = Field(default=None, ge=0)
    active: bool | None = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("A dish needs a name")
        return v.strip() if v is not None else v
