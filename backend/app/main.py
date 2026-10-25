import logging

from fastapi import FastAPI
from mangum import Mangum

from app.routes import restaurants

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Paper to QR")
app.include_router(restaurants.router, prefix="/api")

handler = Mangum(app, lifespan="off")
