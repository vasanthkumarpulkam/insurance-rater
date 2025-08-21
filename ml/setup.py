#!/usr/bin/env python3
"""
Setup script for the ML pipeline dependencies.
This script ensures all required Python packages are installed.
"""

import subprocess
import sys
import os

def check_python_version():
    """Check if Python version is 3.7 or higher"""
    if sys.version_info < (3, 7):
        print("Error: Python 3.7 or higher is required")
        sys.exit(1)
    print(f"✓ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def install_requirements():
    """Install required packages from requirements.txt"""
    try:
        print("Installing Python dependencies...")
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "ml/requirements.txt"
        ], check=True)
        print("✓ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        return False
    return True

def verify_installation():
    """Verify that key packages are installed"""
    packages = [
        'pandas', 'numpy', 'scikit-learn', 'xgboost', 
        'lightgbm', 'interpret', 'matplotlib', 'joblib'
    ]
    
    for package in packages:
        try:
            __import__(package)
            print(f"✓ {package} installed")
        except ImportError:
            print(f"✗ {package} not found")
            return False
    return True

def main():
    print("=== ML Pipeline Setup ===")
    
    # Check Python version
    check_python_version()
    
    # Install requirements
    if not install_requirements():
        sys.exit(1)
    
    # Verify installation
    if not verify_installation():
        print("Some packages failed to install. Please check the errors above.")
        sys.exit(1)
    
    print("\n✓ Setup completed successfully!")
    print("\nNext steps:")
    print("1. Start the development server: pnpm dev")
    print("2. Navigate to the ML Models tab")
    print("3. Generate dataset and train models")

if __name__ == "__main__":
    main()
