#!/usr/bin/env bash
# ==============================================================================
# Script: package_games.sh
# Purpose: Validates, bundles, and creates standalone web zip packages for itch.io,
#          PWA hosting, or static web distribution across the games suite.
# Usage: ./scripts/package_games.sh [game_name|all]
# ==============================================================================

set -euo pipefail

GAMES_ROOT="/mnt/sharedroot/projects/games"
DIST_DIR="${GAMES_ROOT}/dist"

mkdir -p "${DIST_DIR}"

package_game() {
    local game_dir="$1"
    local game_name
    game_name=$(basename "${game_dir}")

    # Skip dist or non-directories
    if [ ! -d "${game_dir}" ] || [ "${game_name}" = "dist" ] || [ "${game_name}" = ".github" ]; then
        return 0
    fi

    # Verify game contains index.html
    if [ ! -f "${game_dir}/index.html" ]; then
        echo "⏭️  Skipping ${game_name} (no index.html found)"
        return 0
    fi

    echo "📦 Packaging game: ${game_name}..."

    local zip_file="${DIST_DIR}/${game_name}_web_release.zip"
    rm -f "${zip_file}"

    # Package necessary web distribution files from game folder
    (
        cd "${game_dir}"
        # Include index.html, styles, manifests, service workers, icons, and source js
        zip -q -r "${zip_file}" index.html *.css *.json *.js *.png src/ 2>/dev/null || \
        zip -q -r "${zip_file}" index.html style.css manifest.json sw.js icon.png icon-512.png src/ 2>/dev/null || \
        zip -q -r "${zip_file}" * -x "cli/*" -x "test/*" -x "__pycache__/*"
    )

    local size
    size=$(du -h "${zip_file}" | cut -f1)
    echo "  ✅ Created ${zip_file} (${size})"
}

TARGET="${1:-all}"

echo "================================================="
echo "🎮 RPDevs Games Suite Distribution Packager"
echo "================================================="

if [ "${TARGET}" = "all" ]; then
    for dir in "${GAMES_ROOT}"/*; do
        if [ -d "${dir}" ] && [ "$(basename "${dir}")" != "dist" ] && [ "$(basename "${dir}")" != ".github" ]; then
            package_game "${dir}"
        fi
    done

    # Also package the master portal
    echo "📦 Packaging Master Arcade Portal..."
    PORTAL_ZIP="${DIST_DIR}/arcade_portal_release.zip"
    rm -f "${PORTAL_ZIP}"
    (
        cd "${GAMES_ROOT}"
        zip -q -r "${PORTAL_ZIP}" index.html portal.css portal.js manifest.json sw.js icon.png icon-512.png arcade_vault.js gamepad.js crt.css crt.js 2>/dev/null || true
    )
    if [ -f "${PORTAL_ZIP}" ]; then
        echo "  ✅ Created Master Portal Package: ${PORTAL_ZIP} ($(du -h "${PORTAL_ZIP}" | cut -f1))"
    fi
else
    if [ -d "${GAMES_ROOT}/${TARGET}" ]; then
        package_game "${GAMES_ROOT}/${TARGET}"
    else
        echo "❌ Error: Game directory '${TARGET}' not found under ${GAMES_ROOT}"
        exit 1
    fi
fi

echo "================================================="
echo "🎉 Packaging complete! Files ready in ${DIST_DIR}"
echo "================================================="
