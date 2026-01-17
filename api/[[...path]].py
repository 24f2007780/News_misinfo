from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from mangum import Mangum
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import your FastAPI routes
from server.main import app as server_app
app.mount("/api", server_app)

handler = Mangum(app)