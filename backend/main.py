import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "db.json"

# --- Database ---
def load_db():
    if not os.path.exists(DB_FILE):
        return {"users": {}}
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except:
        return {"users": {}}

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

# --- Models ---
class InitData(BaseModel):
    initData: str # We will skip complex validation for MVP, just use user_id from it or mock

class SaveRunRequest(BaseModel):
    userId: str # Telegram ID (string)
    score: int
    scrap: int
    waves: int

class UpgradeRequest(BaseModel):
    userId: str
    upgradeId: str # 'drill', 'armor', 'speed'

# --- Endpoints ---

app.mount("/assets", StaticFiles(directory="../frontend/dist/assets"), name="assets")

@app.get("/")
async def read_index():
    return FileResponse("../frontend/dist/index.html")

@app.get("/api/health")
def read_root():
    return {"status": "online", "service": "SpaceRTS Backend"}

@app.get("/api/profile/{user_id}")
def get_profile(user_id: str):
    db = load_db()
    user = db["users"].get(user_id)
    if not user:
        # Create default user
        user = {
            "scrap": 0,
            "highScore": 0,
            "upgrades": {
                "drill": 0,
                "armor": 0,
                "speed": 0
            }
        }
        db["users"][user_id] = user
        save_db(db)
    return user

@app.post("/api/save-run")
def save_run(req: SaveRunRequest):
    db = load_db()
    user = db["users"].get(req.userId)
    if not user:
        # Should call Profile first, but handle safety
        user = {"scrap": 0, "highScore": 0, "upgrades": {"drill": 0, "armor": 0, "speed": 0}}
    
    # Update Stats
    user["scrap"] += req.scrap
    if req.score > user.get("highScore", 0):
        user["highScore"] = req.score
        
    db["users"][req.userId] = user
    save_db(db)
    return {"status": "saved", "newScrap": user["scrap"]}

@app.post("/api/upgrade")
def buy_upgrade(req: UpgradeRequest):
    db = load_db()
    user = db["users"].get(req.userId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    costs = {
        "drill": 100,
        "armor": 200,
        "speed": 300
    }
    
    cost = costs.get(req.upgradeId)
    if not cost:
        raise HTTPException(status_code=400, detail="Invalid upgrade ID")
        
    # Scale cost level? For MVP constant or simple linear
    current_level = user["upgrades"].get(req.upgradeId, 0)
    final_cost = cost * (current_level + 1)
    
    if user["scrap"] >= final_cost:
        user["scrap"] -= final_cost
        user["upgrades"][req.upgradeId] = current_level + 1
        save_db(db)
        return {"status": "success", "level": current_level + 1, "remainingScrap": user["scrap"]}
    else:
         raise HTTPException(status_code=402, detail="Not enough scrap")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
