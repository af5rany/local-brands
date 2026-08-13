import io
import sys
import os
from unittest.mock import MagicMock

# Stub heavy ML deps so main.py can be imported without torch/transformers installed
_torch_mock = MagicMock()
sys.modules.setdefault("torch", _torch_mock)
sys.modules.setdefault("transformers", MagicMock())
sys.modules.setdefault("numpy", MagicMock())

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from PIL import Image

FAKE_EMBEDDING = [0.1] * 512


def _jpeg_bytes() -> bytes:
    img = Image.new("RGB", (64, 64), color=(128, 64, 32))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture(scope="module")
def client():
    import main

    mock_model = MagicMock()
    mock_model.eval.return_value = None
    mock_processor = MagicMock()

    with patch.object(main, "CLIPModel") as mocked_model_cls, \
         patch.object(main, "CLIPProcessor") as mocked_proc_cls, \
         patch.object(main, "embed_image", return_value=FAKE_EMBEDDING):

        mocked_model_cls.from_pretrained.return_value = mock_model
        mocked_proc_cls.from_pretrained.return_value = mock_processor

        with TestClient(main.app) as c:
            yield c


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "model" in data


def test_embed_image_valid(client):
    import main

    with patch.object(main, "embed_image", return_value=FAKE_EMBEDDING):
        resp = client.post(
            "/embed/image",
            files={"file": ("test.jpg", _jpeg_bytes(), "image/jpeg")},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "embedding" in data
    assert data["dim"] == 512
    assert len(data["embedding"]) == 512


def test_embed_image_invalid_bytes_returns_400(client):
    resp = client.post(
        "/embed/image",
        files={"file": ("bad.bin", b"not-an-image", "image/jpeg")},
    )
    assert resp.status_code == 400


def test_embed_image_url_success(client):
    import main

    mock_http_resp = MagicMock()
    mock_http_resp.raise_for_status.return_value = None
    mock_http_resp.content = _jpeg_bytes()

    with patch.object(main, "http_requests") as mock_http, \
         patch.object(main, "embed_image", return_value=FAKE_EMBEDDING):
        mock_http.get.return_value = mock_http_resp
        resp = client.post("/embed/image-url", json={"url": "http://example.com/img.jpg"})

    assert resp.status_code == 200
    data = resp.json()
    assert data["dim"] == 512


def test_embed_image_url_bad_url_returns_400(client):
    import main

    with patch.object(main, "http_requests") as mock_http:
        mock_http.get.side_effect = Exception("Connection refused")
        resp = client.post("/embed/image-url", json={"url": "http://bad-host/img.jpg"})

    assert resp.status_code == 400
