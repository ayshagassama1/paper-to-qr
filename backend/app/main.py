import logging

from fastapi import FastAPI
from mangum import Mangum

from app.routes import manage, menus, restaurants

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Paper to QR")
app.include_router(restaurants.router, prefix="/api")
app.include_router(manage.router, prefix="/api")
app.include_router(menus.router, prefix="/api")

handler = Mangum(app, lifespan="off")
