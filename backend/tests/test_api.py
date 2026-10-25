PHOTO = ("menu.jpg", b"\xff\xd8\xff fake jpeg", "image/jpeg")


def create(client, name="Chez Marcel", photos=1):
    return client.post(
        "/api/restaurants",
        data={"name": name},
        files=[("images", PHOTO) for _ in range(photos)],
    )


def test_create_restaurant_returns_extracted_dishes(client, collection):
    res = create(client)
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "Chez Marcel"
    assert body["slug"] == "chez-marcel"
    assert len(body["code"]) == 6
    assert body["extraction_empty"] is False
    assert [(d["name"], d["price_cents"], d["active"]) for d in body["dishes"]] == [
        ("Quiche lorraine", 950, True),
        ("Tarte tatin", None, True),
    ]
    stored = collection.find_one({"code": body["code"]})
    assert stored["slug"] == "chez-marcel"
    assert "images" not in stored


def test_same_name_gets_a_different_slug(client):
    first = create(client).json()
    second = create(client).json()
    assert first["slug"] == "chez-marcel"
    assert second["slug"] == "chez-marcel-2"
    assert first["code"] != second["code"]


def test_empty_extraction_still_creates_the_restaurant(client, collection, extracted):
    extracted.clear()
    res = create(client)
    assert res.status_code == 201
    assert res.json()["dishes"] == []
    assert res.json()["extraction_empty"] is True
    assert collection.count_documents({}) == 1


def test_blank_name_is_rejected(client, collection):
    assert create(client, name="   ").status_code == 422
    assert collection.count_documents({}) == 0


def test_photos_are_required(client):
    assert client.post("/api/restaurants", data={"name": "Chez Marcel"}).status_code == 422


def test_more_than_five_photos_is_rejected(client):
    assert create(client, photos=6).status_code == 422
