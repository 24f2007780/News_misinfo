# import uvicorn
# from fastapi import FastAPI, HTTPException, Depends
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from typing import List, Dict, Any
# import logging
# import os
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()

# # Configure logging
# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
#     handlers=[
#         logging.StreamHandler(),
#         logging.FileHandler('logs/app.log')
#     ]
# )

# logger = logging.getLogger(__name__)

# # Initialize FastAPI app
# app = FastAPI(
#     title="Athena Misinformation Verifier API",
#     description="API for verifying misinformation claims using AI",
#     version="1.0.0"
# )

# # CORS Middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # In production, replace with specific origins
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Mount static files for frontend
# app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

# # Health check endpoint
# @app.get("/health")
# async def health_check():
#     """Health check endpoint for monitoring"""
#     return {"status": "healthy", "version": "1.0.0"}

# # Root endpoint
# @app.get("/")
# async def root():
#     return {
#         "message": "Welcome to Athena Misinformation Verifier API",
#         "docs": "/docs",
#         "redoc": "/redoc"
#     }

# # Import and include routers
# from fact_checker.agent import router as fact_checker_router
# app.include_router(fact_checker_router, prefix="/api/fact-check", tags=["Fact Checking"])

# if __name__ == "__main__":
#     # Create logs directory if it doesn't exist
#     os.makedirs("logs", exist_ok=True)
    
#     # Run the FastAPI application
#     uvicorn.run(
#         "main:app",
#         host=os.getenv("HOST", "0.0.0.0"),
#         port=int(os.getenv("PORT", 8000)),
#         reload=os.getenv("DEBUG", "true").lower() == "true"
#     )
