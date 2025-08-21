#!/bin/bash

echo "🚀 Setting up RiskAssess Pro ML Pipeline..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Please install Python 3.7+ and try again."
    exit 1
fi

echo "✅ Python 3 found"

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required. Please install pip and try again."
    exit 1
fi

echo "✅ pip3 found"

# Create ml directory if it doesn't exist
mkdir -p ml/data ml/models

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r ml/requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

# Run setup verification
echo "🔍 Verifying installation..."
python3 ml/setup.py

echo ""
echo "🎉 ML Pipeline setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the development server: pnpm dev"
echo "2. Open http://localhost:8080"
echo "3. Navigate to the 'ML Models' tab"
echo "4. Click 'Generate Dataset' and then 'Train Models'"
echo ""
echo "Happy risk assessment! 🛡️"
