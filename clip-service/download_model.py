"""Pre-download the FashionCLIP model at Docker build time."""
from transformers import CLIPModel, CLIPProcessor

MODEL_NAME = "patrickjohncyh/fashion-clip"

print(f"Downloading {MODEL_NAME}...")
CLIPModel.from_pretrained(MODEL_NAME)
CLIPProcessor.from_pretrained(MODEL_NAME)
print("Model downloaded successfully.")
