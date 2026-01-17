"""Configuration settings for the fact-checking pipeline."""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Configuration class for the fact-checking pipeline."""
    
    # Google Cloud Platform settings
    GCP_SEARCH_API_KEY: Optional[str] = os.getenv("GCP_SEARCH_API_KEY")
    GCP_CUSTOM_SEARCH_ENGINE_ID: Optional[str] = os.getenv("GCP_CUSTOM_SEARCH_ENGINE_ID")
    GCP_PROJECT_ID: Optional[str] = os.getenv("GCP_PROJECT_ID")
    GCP_LOCATION: str = os.getenv("GCP_LOCATION", "us-central1")
    
    # Evidence retrieval settings
    DEFAULT_SEARCH_RESULTS: int = int(os.getenv("DEFAULT_SEARCH_RESULTS", "10"))
    DEFAULT_TOP_K: int = int(os.getenv("DEFAULT_TOP_K", "5"))
    
    # Logging settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "logs/fact_checker.log")
    
    @classmethod
    def validate_gcp_config(cls) -> bool:
        """Validate that required GCP configuration is present."""
        required_vars = [
            cls.GCP_SEARCH_API_KEY,
            cls.GCP_CUSTOM_SEARCH_ENGINE_ID
        ]
        return all(var is not None for var in required_vars)
    
    @classmethod
    def get_gcp_config(cls) -> dict:
        """Get GCP configuration as a dictionary."""
        return {
            "api_key": cls.GCP_SEARCH_API_KEY,
            "cx": cls.GCP_CUSTOM_SEARCH_ENGINE_ID,
            "project_id": cls.GCP_PROJECT_ID,
            "location": cls.GCP_LOCATION
        }
    
    @classmethod
    def print_config_status(cls):
        """Print the current configuration status."""
        print("=== Fact-Checker Configuration Status ===")
        print(f"GCP Search API Key: {'✓ Set' if cls.GCP_SEARCH_API_KEY else '✗ Missing'}")
        print(f"GCP Custom Search Engine ID: {'✓ Set' if cls.GCP_CUSTOM_SEARCH_ENGINE_ID else '✗ Missing'}")
        print(f"GCP Project ID: {'✓ Set' if cls.GCP_PROJECT_ID else '✗ Missing'}")
        print(f"GCP Location: {cls.GCP_LOCATION}")
        print(f"Default Search Results: {cls.DEFAULT_SEARCH_RESULTS}")
        print(f"Default Top-K: {cls.DEFAULT_TOP_K}")
        print(f"Log Level: {cls.LOG_LEVEL}")
        print("========================================")


# Environment variable template
ENV_TEMPLATE = """
# Google Cloud Platform Configuration
# Get these from: https://console.cloud.google.com/
GCP_SEARCH_API_KEY=
GCP_CUSTOM_SEARCH_ENGINE_ID=
GCP_PROJECT_ID=
GCP_LOCATION=

# Evidence Retrieval Settings
DEFAULT_SEARCH_RESULTS=10
DEFAULT_TOP_K=5

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/fact_checker.log
"""


def create_env_template():
    """Create a .env.template file if it doesn't exist."""
    template_path = ".env.template"
    if not os.path.exists(template_path):
        with open(template_path, "w") as f:
            f.write(ENV_TEMPLATE.strip())
        print(f"Created {template_path} - please fill in your actual values")


if __name__ == "__main__":
    # Create environment template
    create_env_template()
    
    # Print current configuration status
    Config.print_config_status()
    
    # Validate configuration
    if Config.validate_gcp_config():
        print("\n✓ Configuration is valid!")
    else:
        print("\n✗ Configuration is incomplete. Please set the required environment variables.")
        print("See .env.template for required variables.")
