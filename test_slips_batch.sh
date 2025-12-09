#!/bin/bash

# Thai Slip Batch Testing Script
# Tests multiple slip images against the 3-layer detection system

API_URL="https://api.thaiscam.zcr.ai/v1/public/detect/image"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Thai Slip Detection - Batch Testing"
echo "======================================="
echo ""

# Check if directory argument provided
if [ -z "$1" ]; then
    echo "Usage: $0 <directory_with_slip_images>"
    echo "Example: $0 ~/Downloads/slips"
    exit 1
fi

SLIP_DIR="$1"

if [ ! -d "$SLIP_DIR" ]; then
    echo "❌ Directory not found: $SLIP_DIR"
    exit 1
fi

# Find all image files
IMAGES=$(find "$SLIP_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | head -20)

if [ -z "$IMAGES" ]; then
    echo "❌ No image files found in $SLIP_DIR"
    exit 1
fi

COUNT=0
SAFE_COUNT=0
SCAM_COUNT=0

echo "📂 Testing slips from: $SLIP_DIR"
echo ""

# Test each image
while IFS= read -r image; do
    COUNT=$((COUNT + 1))
    FILENAME=$(basename "$image")
    
    echo "[$COUNT] Testing: $FILENAME"
    
    # Send request
    RESPONSE=$(curl -s -X POST -F "file=@$image" "$API_URL")
    
    # Parse JSON
    IS_SCAM=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('is_scam', 'error'))")
    RISK=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('risk_score', 0))")
    CATEGORY=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('category', 'unknown'))")
    
    # Display result
    if [ "$IS_SCAM" = "False" ] || [ "$IS_SCAM" = "false" ]; then
        echo -e "    ${GREEN}✅ SAFE${NC} | Risk: $RISK | Category: $CATEGORY"
        SAFE_COUNT=$((SAFE_COUNT + 1))
    elif [ "$IS_SCAM" = "True" ] || [ "$IS_SCAM" = "true" ]; then
        echo -e "    ${RED}❌ SCAM${NC} | Risk: $RISK | Category: $CATEGORY"
        SCAM_COUNT=$((SCAM_COUNT + 1))
    else
        echo -e "    ${YELLOW}⚠️ ERROR${NC} | Response: $RESPONSE"
    fi
    
    echo ""
    
    # Small delay to avoid rate limiting
    sleep 0.5
    
done <<< "$IMAGES"

# Summary
echo "======================================="
echo "📊 Summary:"
echo "   Total Tested: $COUNT"
echo -e "   ${GREEN}Safe: $SAFE_COUNT${NC}"
echo -e "   ${RED}Scam: $SCAM_COUNT${NC}"
echo ""
echo "✅ Testing complete!"
