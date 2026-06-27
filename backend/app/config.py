import os
from dotenv import load_dotenv
from pathlib import Path

# Paths are resolved relative to the workspace root
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env files
load_dotenv(dotenv_path=BASE_DIR / ".env")
load_dotenv(dotenv_path=BASE_DIR / "backend" / ".env")

DATA_PATH = BASE_DIR / "backend" / "data" / "processed_data.parquet"
MODEL_DIR = BASE_DIR / "backend" / "models"

METRICS_PATH = MODEL_DIR / "metrics.json"
FEATURE_IMPORTANCE_PATH = MODEL_DIR / "feature_importance.json"

# In-memory datasets config
# Enable loading complete data on startup
LOAD_DATA_ON_STARTUP = True

# AI Config
# OpenRouter AI Config
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemma-4-31b-it:free")
