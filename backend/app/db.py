from functools import lru_cache

from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection

from app import config


@lru_cache
def _client() -> MongoClient:
    # Module-level client, reused across warm Lambda invocations.
    return MongoClient(config.MONGODB_URI, serverSelectionTimeoutMS=5000)


@lru_cache
def get_restaurants() -> Collection:
    collection = _client()[config.MONGODB_DB]["restaurants"]
    collection.create_index([("code", ASCENDING)], unique=True)
    collection.create_index([("slug", ASCENDING)], unique=True)
    return collection
