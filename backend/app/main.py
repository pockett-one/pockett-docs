from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI(title="Pockett Docs API", version="0.1.0")

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Backend is running"}

@app.get("/api/hello")
async def hello_world():
    return {"message": "Hello from FastAPI!"}

# Serve static files from frontend build
frontend_build_path = os.path.join(os.path.dirname(__file__), "../../frontend/out")
if os.path.exists(frontend_build_path):
    app.mount("/static", StaticFiles(directory=frontend_build_path), name="static")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Serve index.html for all non-API routes (SPA routing)
        if not full_path.startswith("api/"):
            index_path = os.path.join(frontend_build_path, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
        return {"error": "Not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)