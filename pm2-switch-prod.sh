#!/bin/bash
# Switch to Production mode
# Stops Dev (if running), builds, and starts Production on port 3100

set -e

echo "🔄 Switching to Production mode..."

# Stop dev if running
if pm2 describe wb-repricer-frontend-dev >/dev/null 2>&1; then
    echo "⏹️  Stopping wb-repricer-frontend-dev (Development)..."
    pm2 stop wb-repricer-frontend-dev 2>/dev/null || true
fi

# Build production with selective cleanup on corruption
echo "🔨 Building production bundle..."

# Detect potential .next corruption before build
build_needs_clean=false
if [ -d ".next" ]; then
    # Check for common corruption indicators
    if [ ! -f ".next/BUILD_ID" ] && [ ! -f ".next/build-manifest.json" ]; then
        # Missing core build files indicates incomplete/corrupted build
        build_needs_clean=true
    elif [ -f ".next/README.md" ]; then
        # Check if .next contains error markers from previous failed builds
        if grep -q "corrupt\|error\|incomplete" ".next/README.md" 2>/dev/null; then
            build_needs_clean=true
        fi
    fi
fi

if [ "$build_needs_clean" = true ]; then
    echo "⚠️  Detected potential .next corruption, cleaning before build..."
    rm -rf .next
fi

# Capture build output to detect specific error types
build_output=$(npm run build 2>&1)
build_exit_code=$?

if [ $build_exit_code -ne 0 ]; then
    echo "❌ Build failed"
    echo ""
    echo "Build output:"
    echo "$build_output"
    echo ""

    # Only clean .next if build error suggests corruption
    # Corruption indicators: missing files, broken symlinks, partial builds
    if echo "$build_output" | grep -qiE "corrupt|incomplete|missing.*file|EISDIR|ENOENT|symlink"; then
        echo "🧹 Build failure suggests .next corruption, cleaning..."
        rm -rf .next
        echo "💡 Try running again: ./pm2-switch-prod.sh"
    elif echo "$build_output" | grep -qiE "Module.*not found|Cannot.*resolve|Type.*error"; then
        # Code/dependency errors - cleaning won't help
        echo "💡 This appears to be a code or dependency error."
        echo "💡 Fix the issue and try again, or run: npm run clean && ./pm2-switch-prod.sh"
    else
        # Generic error - offer manual clean option
        echo "💡 If the problem persists, try: npm run clean && ./pm2-switch-prod.sh"
    fi
    exit 1
fi

# Start production
echo "▶️  Starting wb-repricer-frontend (Production)..."
pm2 start ecosystem.config.js --only wb-repricer-frontend --env production

echo ""
echo "📊 Current PM2 status:"
pm2 list | grep -E "wb-repricer-frontend|name"

echo ""
echo "✅ Production mode active on http://localhost:3100"
