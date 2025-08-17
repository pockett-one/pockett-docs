import subprocess
import os
import sys
from pathlib import Path

def run_command(command: str, cwd: str = None) -> int:
    """Run a shell command and return the exit code."""
    print(f"Running: {command}")
    if cwd:
        print(f"Working directory: {cwd}")
    
    result = subprocess.run(command, shell=True, cwd=cwd)
    return result.returncode

def install_all():
    """Install all dependencies for both backend and frontend."""
    print("🔧 Installing Poetry dependencies...")
    if run_command("poetry install") != 0:
        sys.exit(1)
    
    print("\n📦 Installing frontend dependencies...")
    if run_command("npm install", cwd="frontend") != 0:
        sys.exit(1)
    
    print("✅ All dependencies installed successfully!")

def build_all():
    """Build both frontend and backend."""
    print("🏗️ Building frontend...")
    if run_command("npm run build", cwd="frontend") != 0:
        sys.exit(1)
    
    # Copy frontend build to backend static directory
    frontend_out = Path("frontend/out")
    if frontend_out.exists():
        print("📁 Frontend build completed successfully!")
    else:
        print("❌ Frontend build failed - out directory not found")
        sys.exit(1)
    
    print("✅ Build completed successfully!")

def dev_backend():
    """Start the FastAPI development server."""
    print("🚀 Starting FastAPI development server...")
    run_command("poetry run uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000")

def dev_frontend():
    """Start the Next.js development server."""
    print("🚀 Starting Next.js development server...")
    run_command("npm run dev", cwd="frontend")

def serve():
    """Start the production server (FastAPI serving static frontend)."""
    print("🌐 Starting production server...")
    
    # Check if frontend build exists
    frontend_out = Path("frontend/out")
    if not frontend_out.exists():
        print("❌ Frontend build not found. Running build first...")
        build_all()
    
    print("🚀 Starting FastAPI server with static frontend...")
    run_command("poetry run uvicorn backend.app.main:app --host 0.0.0.0 --port 8000")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "install-all":
            install_all()
        elif command == "build-all":
            build_all()
        elif command == "dev-backend":
            dev_backend()
        elif command == "dev-frontend":
            dev_frontend()
        elif command == "serve":
            serve()
        else:
            print(f"Unknown command: {command}")
            sys.exit(1)