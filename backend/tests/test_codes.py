from app.codes import CODE_ALPHABET, new_code, normalize_code, slugify, unique_slug


def test_new_code_uses_unambiguous_alphabet():
    code = new_code(lambda c: False)
    assert len(code) == 6
    assert all(ch in CODE_ALPHABET for ch in code)
    assert not set("01OIL") & set(CODE_ALPHABET)


def test_new_code_retries_on_collision():
    seen = []

    def is_taken(code):
        seen.append(code)
        return len(seen) < 3

    new_code(is_taken)
    assert len(seen) == 3


def test_normalize_code():
    assert normalize_code(" k7q-29p ") == "K7Q29P"
    assert normalize_code("K7Q29P") == "K7Q29P"


def test_slugify():
    assert slugify("Chez Marcel") == "chez-marcel"
    assert slugify("Le Café d'Été !") == "le-cafe-d-ete"
    assert slugify("!!!") == "restaurant"


def test_unique_slug_appends_suffix_and_skips_reserved():
    taken = {"chez-marcel", "chez-marcel-2"}
    assert unique_slug("Chez Marcel", taken.__contains__) == "chez-marcel-3"
    assert unique_slug("API", lambda s: False) == "api-2"
