#!/usr/bin/env python3
"""Simple test script to verify the Google evidence retriever setup."""

import sys
import os

def test_imports():
    """Test if all required modules can be imported."""
    print("Testing imports...")
    
    try:
        # Test basic imports
        import requests
        print("OK: requests imported successfully")
    except ImportError as e:
        print(f"FAIL: requests import failed: {e}")
        return False
    
    try:
        import numpy
        print("OK: numpy imported successfully")
    except ImportError as e:
        print(f"FAIL: numpy import failed: {e}")
        return False
    
    try:
        from dotenv import load_dotenv
        print("OK: python-dotenv imported successfully")
    except ImportError as e:
        print(f"FAIL: python-dotenv import failed: {e}")
        return False
    
    # Test GCP imports (optional)
    try:
        from google.cloud import aiplatform
        print("OK: google-cloud-aiplatform imported successfully")
    except ImportError as e:
        print(f"WARN: google-cloud-aiplatform not available: {e}")
        print("      Optional - the retriever will use fallback methods")
    
    return True


def test_config():
    """Test configuration loading."""
    print("\nTesting configuration...")
    
    try:
        from fact_checker.config import Config
        print("OK: Config module imported successfully")
        
        # Check environment variables
        Config.print_config_status()
        
        return True
    except ImportError as e:
        print(f"FAIL: Config import failed: {e}")
        return False


def test_evidence_retriever():
    """Test evidence retriever module."""
    print("\nTesting evidence retriever...")
    
    try:
        from fact_checker.nodes.google_evidence_retriever import GoogleEvidenceRetriever
        print("OK: GoogleEvidenceRetriever imported successfully")
        
        # Test class creation (without API calls)
        try:
            # This will fail due to missing API key, but we can test the import
            retriever = GoogleEvidenceRetriever(api_key="test", cx="test")
            print("OK: GoogleEvidenceRetriever instantiated successfully")
        except ValueError as e:
            if "API key is required" in str(e):
                print("OK: GoogleEvidenceRetriever validation working correctly")
            else:
                print(f"WARN: Unexpected error during instantiation: {e}")
        
        return True
    except ImportError as e:
        print(f"FAIL: Evidence retriever import failed: {e}")
        return False


def test_requirements():
    """Test if requirements.txt exists and has content."""
    print("\nTesting requirements...")
    
    req_file = "requirements.txt"
    if os.path.exists(req_file):
        with open(req_file, 'r') as f:
            content = f.read().strip()
            if content:
                print(f"OK: {req_file} exists and has content")
                print(f"   Lines: {len(content.split(chr(10)))}")
                return True
            else:
                print(f"FAIL: {req_file} is empty")
                return False
    else:
        print(f"FAIL: {req_file} not found")
        return False


def main():
    """Run all tests."""
    print("Google Evidence Retriever Setup Test")
    print("=" * 50)
    
    tests = [
        ("Import Tests", test_imports),
        ("Configuration Tests", test_config),
        ("Evidence Retriever Tests", test_evidence_retriever),
        ("Requirements Tests", test_requirements),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"FAIL: {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\nAll tests passed! Your setup is ready.")
        print("\nNext steps:")
        print("1. Set up your .env file with GCP credentials")
        print("2. Run: python config.py")
        print("3. Test with: python examples/integration_example.py")
    else:
        print(f"\n{total - passed} test(s) failed. Please check the errors above.")
        print("\nCommon solutions:")
        print("1. Install missing dependencies: pip install -r requirements.txt")
        print("2. Check your Python path and module structure")
        print("3. Verify all files are in the correct locations")


if __name__ == "__main__":
    main()
