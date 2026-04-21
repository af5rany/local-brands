import io
from contextlib import asynccontextmanager

import numpy as np
import requests as http_requests
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image
from pydantic import BaseModel
from transformers import CLIPModel, CLIPProcessor

MODEL_NAME = "patrickjohncyh/fashion-clip"

model: CLIPModel = None
processor: CLIPProcessor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, processor
    model = CLIPModel.from_pretrained(MODEL_NAME)
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model.eval()
    yield


app = FastAPI(title="FashionCLIP Embedding Service", lifespan=lifespan)


def embed_image(img: Image.Image) -> list[float]:
    inputs = processor(images=img, return_tensors="pt")
    with torch.no_grad():
        features = model.get_image_features(**inputs)
    # L2 normalize so cosine distance == inner product distance
    features = features / features.norm(dim=-1, keepdim=True)
    return features[0].cpu().numpy().tolist()


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}


@app.post("/embed/image")
async def embed_image_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    embedding = embed_image(img)
    return {"embedding": embedding, "dim": len(embedding)}


class ImageUrlRequest(BaseModel):
    url: str


@app.post("/embed/image-url")
async def embed_image_url(body: ImageUrlRequest):
    try:
        resp = http_requests.get(body.url, timeout=15)
        resp.raise_for_status()
        img = Image.open(io.BytesIO(resp.content)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not download image from URL")

    embedding = embed_image(img)
    return {"embedding": embedding, "dim": len(embedding)}
