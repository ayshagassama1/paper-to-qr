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


def test_find_menu_by_code(client):
    created = create(client).json()
    res = client.get("/api/manage", headers={"X-Menu-Code": created["code"]})
    assert res.status_code == 200
    assert res.json()["name"] == "Chez Marcel"
    assert res.json()["dishes"] == created["dishes"]


def test_code_lookup_ignores_case_and_dash(client):
    code = create(client).json()["code"]
    typed = f"{code[:3]}-{code[3:]}".lower()
    assert client.get("/api/manage", headers={"X-Menu-Code": typed}).status_code == 200


def test_unknown_or_missing_code_is_not_found(client):
    create(client)
    res = client.get("/api/manage", headers={"X-Menu-Code": "AAA-AAA"})
    assert res.status_code == 404
    assert res.json() == {"detail": "Restaurant not found"}
    assert client.get("/api/manage").status_code == 404


def test_public_menu_shows_active_dishes_only(client, collection):
    created = create(client).json()
    collection.update_one({"code": created["code"]}, {"$set": {"dishes.1.active": False}})
    res = client.get("/api/menus/chez-marcel")
    assert res.status_code == 200
    assert res.json() == {"name": "Chez Marcel", "dishes": [{"name": "Quiche lorraine", "price_cents": 950}]}
    assert "code" not in res.text


def test_public_menu_with_no_active_dish(client, collection):
    create(client)
    collection.update_one({"slug": "chez-marcel"}, {"$set": {"dishes.0.active": False, "dishes.1.active": False}})
    assert client.get("/api/menus/chez-marcel").json() == {"name": "Chez Marcel", "dishes": []}


def test_unknown_slug_is_not_found(client):
    res = client.get("/api/menus/nowhere")
    assert res.status_code == 404
    assert res.json() == {"detail": "Restaurant not found"}


def manage(client, method, path, code, **kwargs):
    return client.request(method, f"/api/manage{path}", headers={"X-Menu-Code": code}, **kwargs)


def menu_by_code(client, code):
    return manage(client, "GET", "", code).json()["dishes"]


def test_add_dish(client):
    code = create(client).json()["code"]
    res = manage(client, "POST", "/dishes", code, json={"name": "  Crème brûlée ", "price_cents": 700})
    assert res.status_code == 201
    assert res.json()["name"] == "Crème brûlée"
    assert res.json()["active"] is True
    assert menu_by_code(client, code)[-1] == res.json()


def test_dish_without_a_name_is_rejected(client):
    created = create(client).json()
    code, dish_id = created["code"], created["dishes"][0]["id"]
    assert manage(client, "POST", "/dishes", code, json={"name": "   ", "price_cents": 700}).status_code == 422
    assert manage(client, "PATCH", f"/dishes/{dish_id}", code, json={"name": ""}).status_code == 422
    assert len(menu_by_code(client, code)) == 2


def test_edit_name_and_price(client):
    created = create(client).json()
    code, dish_id = created["code"], created["dishes"][1]["id"]
    res = manage(client, "PATCH", f"/dishes/{dish_id}", code, json={"name": "Tarte Tatin", "price_cents": 650})
    assert res.status_code == 200
    assert res.json() == {"id": dish_id, "name": "Tarte Tatin", "price_cents": 650, "active": True}
    assert menu_by_code(client, code)[1] == res.json()


def test_remove_a_price(client):
    created = create(client).json()
    code, dish_id = created["code"], created["dishes"][0]["id"]
    res = manage(client, "PATCH", f"/dishes/{dish_id}", code, json={"price_cents": None})
    assert res.json()["price_cents"] is None
    assert res.json()["name"] == "Quiche lorraine"


def test_toggle_hides_dish_from_customers(client):
    created = create(client).json()
    code, dish_id = created["code"], created["dishes"][0]["id"]
    assert manage(client, "PATCH", f"/dishes/{dish_id}", code, json={"active": False}).json()["active"] is False
    assert [d["name"] for d in client.get("/api/menus/chez-marcel").json()["dishes"]] == ["Tarte tatin"]
    assert menu_by_code(client, code)[0]["active"] is False
    manage(client, "PATCH", f"/dishes/{dish_id}", code, json={"active": True})
    assert len(client.get("/api/menus/chez-marcel").json()["dishes"]) == 2


def test_delete_dish(client):
    created = create(client).json()
    code, dish_id = created["code"], created["dishes"][0]["id"]
    assert manage(client, "DELETE", f"/dishes/{dish_id}", code).status_code == 204
    assert [d["name"] for d in menu_by_code(client, code)] == ["Tarte tatin"]
    assert manage(client, "DELETE", f"/dishes/{dish_id}", code).status_code == 404


def test_unknown_dish_or_wrong_code(client):
    created = create(client).json()
    code, dish_id = created["code"], created["dishes"][0]["id"]
    assert manage(client, "PATCH", "/dishes/nope", code, json={"active": False}).status_code == 404
    assert manage(client, "PATCH", f"/dishes/{dish_id}", "AAAAAA", json={"active": False}).status_code == 404
    assert manage(client, "POST", "/dishes", "AAAAAA", json={"name": "X"}).status_code == 404
    assert manage(client, "DELETE", f"/dishes/{dish_id}", "AAAAAA").status_code == 404


def test_dish_from_another_restaurant_cant_be_edited(client):
    first = create(client).json()
    second = create(client).json()
    other_dish = first["dishes"][0]["id"]
    assert manage(client, "PATCH", f"/dishes/{other_dish}", second["code"], json={"active": False}).status_code == 404
