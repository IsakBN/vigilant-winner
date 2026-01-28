#!/bin/bash
set -e

# Deploy script for BundleNudge
# Usage: ./deploy/deploy.sh [app|admin]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -z "$1" ]; then
    echo "Usage: ./deploy/deploy.sh [app|admin]"
    echo ""
    echo "  app   - Deploy customer dashboard to app.bundlenudge.com"
    echo "  admin - Deploy admin dashboard to admin.bundlenudge.com"
    exit 1
fi

TARGET="$1"

case "$TARGET" in
    app)
        CONFIG_FILE="$SCRIPT_DIR/app.vercel.json"
        PROJECT_NAME="bundlenudge-app"
        DESCRIPTION="Customer Dashboard"
        ;;
    admin)
        CONFIG_FILE="$SCRIPT_DIR/admin.vercel.json"
        PROJECT_NAME="bundlenudge-admin"
        DESCRIPTION="Admin Dashboard"
        ;;
    *)
        echo "Error: Unknown target '$TARGET'"
        echo "Use 'app' or 'admin'"
        exit 1
        ;;
esac

echo "========================================"
echo "Deploying: $DESCRIPTION"
echo "Project:   $PROJECT_NAME"
echo "========================================"
echo ""

# Step 1: Copy config
echo "[1/4] Setting up config..."
cp "$CONFIG_FILE" "$ROOT_DIR/vercel.json"

# Step 2: Clean old link
echo "[2/4] Cleaning old Vercel link..."
rm -rf "$ROOT_DIR/.vercel"

# Step 3: Link to project
echo "[3/4] Linking to $PROJECT_NAME..."
cd "$ROOT_DIR"
vercel link --yes --project "$PROJECT_NAME"

# Step 4: Deploy
echo "[4/4] Deploying to production..."
vercel --prod --yes

echo ""
echo "========================================"
echo "Deployment complete!"
echo "========================================"
