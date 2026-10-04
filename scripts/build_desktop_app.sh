#!/usr/bin/env bash
# ==============================================================================
# 🖥️ RPDevs Games Suite - Standalone Linux Desktop App Bundler
# ==============================================================================
# Packages games from /mnt/sharedroot/projects/games/ into standalone native
# desktop applications (portable .tar.gz archives and .deb packages) powered
# by native WebKitGTK and Python 3.
#
# Zero Electron bloat. Zero Node runtime. Hardware accelerated and offline-ready.
#
# Usage:
#   build_desktop_app.sh [game_name | portal | all]
#
# Examples:
#   build_desktop_app.sh dotsandboxes
#   build_desktop_app.sh lightsout
#   build_desktop_app.sh portal
#   build_desktop_app.sh all
# ==============================================================================

set -euo pipefail

BOLD="\033[1m"
GREEN="\033[32m"
BLUE="\033[34m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

log_info()    { echo -e "${BLUE}${BOLD}[INFO]${RESET} $*"; }
log_success() { echo -e "${GREEN}${BOLD}[SUCCESS]${RESET} $*"; }
log_warn()    { echo -e "${YELLOW}${BOLD}[WARN]${RESET} $*"; }
log_error()   { echo -e "${RED}${BOLD}[ERROR]${RESET} $*" >&2; }

GAMES_ROOT="/mnt/sharedroot/projects/games"
DIST_DIR="${GAMES_ROOT}/dist/desktop"
mkdir -p "${DIST_DIR}"

command -v python3 >/dev/null 2>&1 || { log_error "python3 is required."; exit 1; }
command -v dpkg-deb >/dev/null 2>&1 || { log_error "dpkg-deb is required."; exit 1; }
command -v tar >/dev/null 2>&1 || { log_error "tar is required."; exit 1; }
command -v gzip >/dev/null 2>&1 || { log_error "gzip is required."; exit 1; }

# Metadata
get_app_name() {
    case "$1" in
        lightsout)    echo "Lights Out" ;;
        snake)        echo "Retro Snake" ;;
        simon)        echo "Simon Classic" ;;
        minesweeper)  echo "Minesweeper 95" ;;
        2048)         echo "2048 Puzzle" ;;
        dotsandboxes) echo "Dots and Boxes" ;;
        sokoban)      echo "Sokoban 1982" ;;
        connectfour)  echo "Connect Four" ;;
        breakout)     echo "Breakout 1976" ;;
        pong)         echo "Pong 1972" ;;
        fallingblocks) echo "Falling Blocks" ;;
        mazechaser)   echo "Maze Chaser" ;;
        asteroids)    echo "Asteroids 1979" ;;
        wordle)       echo "Wordle" ;;
        spaceinvaders) echo "Space Invaders 1978" ;;
        frogger)      echo "Frogger 1981" ;;
        othello)      echo "Othello (Reversi)" ;;
        missilecommand) echo "Missile Command" ;;
        lightcycles)  echo "Tron Light Cycles" ;;
        portal)       echo "RPDevs Retro Arcade" ;;
        *)            echo "$1" ;;
    esac
}

get_pkg_slug() {
    case "$1" in
        lightsout)    echo "lightsout" ;;
        snake)        echo "snake" ;;
        simon)        echo "simon" ;;
        minesweeper)  echo "minesweeper" ;;
        2048)         echo "2048" ;;
        dotsandboxes) echo "dotsandboxes" ;;
        sokoban)      echo "sokoban" ;;
        connectfour)  echo "connectfour" ;;
        breakout)     echo "breakout" ;;
        pong)         echo "pong" ;;
        fallingblocks) echo "fallingblocks" ;;
        mazechaser)   echo "mazechaser" ;;
        asteroids)    echo "asteroids" ;;
        wordle)       echo "wordle" ;;
        spaceinvaders) echo "spaceinvaders" ;;
        frogger)      echo "frogger" ;;
        othello)      echo "othello" ;;
        missilecommand) echo "missilecommand" ;;
        lightcycles)  echo "lightcycles" ;;
        portal)       echo "arcade" ;;
        *)            echo "$1" ;;
    esac
}

get_window_dims() {
    case "$1" in
        lightsout)    echo "520 740" ;;
        snake)        echo "500 700" ;;
        simon)        echo "520 720" ;;
        minesweeper)  echo "780 820" ;;
        2048)         echo "540 760" ;;
        dotsandboxes) echo "760 840" ;;
        sokoban)      echo "600 780" ;;
        connectfour)  echo "640 760" ;;
        breakout)     echo "500 720" ;;
        pong)         echo "680 540" ;;
        fallingblocks) echo "520 780" ;;
        mazechaser)   echo "520 680" ;;
        asteroids)    echo "680 720" ;;
        wordle)       echo "520 780" ;;
        spaceinvaders) echo "520 740" ;;
        frogger)      echo "500 720" ;;
        othello)      echo "600 760" ;;
        missilecommand) echo "840 680" ;;
        lightcycles)  echo "840 680" ;;
        portal)       echo "1100 800" ;;
        *)            echo "800 600" ;;
    esac
}

get_accent_color() {
    case "$1" in
        lightsout)    echo "#ff0055" ;;
        snake)        echo "#8bac0f" ;;
        simon)        echo "#00f0ff" ;;
        minesweeper)  echo "#c0c0c0" ;;
        2048)         echo "#edc22e" ;;
        dotsandboxes) echo "#3b82f6" ;;
        sokoban)      echo "#e3a018" ;;
        connectfour)  echo "#004b93" ;;
        breakout)     echo "#00f0ff" ;;
        pong)         echo "#00f0ff" ;;
        fallingblocks) echo "#00f0f0" ;;
        mazechaser)   echo "#ffd700" ;;
        asteroids)    echo "#00f0ff" ;;
        wordle)       echo "#538d4e" ;;
        spaceinvaders) echo "#00ff66" ;;
        frogger)      echo "#00ff66" ;;
        othello)      echo "#0e6b38" ;;
        missilecommand) echo "#ff0055" ;;
        lightcycles)  echo "#00f0ff" ;;
        portal)       echo "#a855f7" ;;
        *)            echo "#10b981" ;;
    esac
}

generate_desktop_icon() {
    local target="$1"
    local output_file="$2"
    local app_title
    app_title=$(get_app_name "$target")
    local color
    color=$(get_accent_color "$target")

    python3 -c "
from PIL import Image, ImageDraw

target = '${target}'
title = '${app_title}'
color = '${color}'
out_path = '${output_file}'

size = 256
img = Image.new('RGBA', (size, size), (16, 16, 22, 255))
draw = ImageDraw.Draw(img)

# Border
draw.rounded_rectangle([8, 8, size-8, size-8], radius=44, fill=(22, 22, 30), outline=color, width=8)

# Center badge
draw.ellipse([50, 40, size-50, size-60], fill=(32, 32, 44), outline=color, width=4)

if target == 'lightsout':
    draw.rectangle([90, 70, 166, 146], fill='#ff0055')
elif target == 'snake':
    for seg in [(80,90), (105,90), (130,90), (130,115), (155,115)]:
        draw.rectangle([seg[0], seg[1], seg[0]+18, seg[1]+18], fill='#8bac0f')
elif target == 'simon':
    draw.pieslice([65, 55, size-65, size-75], 0, 90, fill='#00f0ff')
    draw.pieslice([65, 55, size-65, size-75], 90, 180, fill='#ff0055')
    draw.pieslice([65, 55, size-65, size-75], 180, 270, fill='#ffe600')
    draw.pieslice([65, 55, size-65, size-75], 270, 360, fill='#00ff66')
elif target == 'minesweeper':
    draw.ellipse([98, 78, 158, 138], fill='#333333')
    draw.line([128, 64, 128, 152], fill='#ff3333', width=6)
    draw.line([84, 108, 172, 108], fill='#ff3333', width=6)
elif target == '2048':
    draw.rectangle([80, 70, 176, 146], fill='#edc22e')
elif target == 'dotsandboxes':
    for x in [88, 128, 168]:
        for y in [78, 118, 158]:
            draw.ellipse([x-6, y-6, x+6, y+6], fill='#60a5fa')
    draw.line([88, 78, 128, 78], fill='#3b82f6', width=6)
    draw.line([88, 78, 88, 118], fill='#3b82f6', width=6)
elif target == 'sokoban':
    draw.rectangle([88, 76, 168, 156], fill='#b86e26', outline='#ffd166', width=4)
    draw.line([88, 76, 168, 156], fill='#754111', width=4)
    draw.line([88, 156, 168, 76], fill='#754111', width=4)
elif target == 'connectfour':
    draw.rounded_rectangle([78, 66, 178, 166], radius=14, fill='#004b93', outline='#002e5b', width=4)
    for cx, cy, ccolor in [(102, 96, '#e63946'), (154, 96, '#ffb703'), (102, 136, '#ffb703'), (154, 136, '#e63946')]:
        draw.ellipse([cx-16, cy-16, cx+16, cy+16], fill=ccolor)
elif target == 'breakout':
    for y, bcolor in [(70, '#ff0055'), (86, '#ff8800'), (102, '#00ff66'), (118, '#ffe600')]:
        for bx in [68, 102, 136, 170]:
            draw.rectangle([bx, y, bx+28, y+10], fill=bcolor)
    draw.rectangle([96, 150, 160, 158], fill='#00f0ff')
    draw.rectangle([124, 136, 132, 144], fill='#ffffff')
elif target == 'pong':
    # P1 Paddle
    draw.rectangle([68, 80, 76, 144], fill='#00f0ff')
    # P2 Paddle
    draw.rectangle([180, 70, 188, 134], fill='#ff0055')
    # Center net
    for ny in range(40, 180, 16):
        draw.line([128, ny, 128, ny+8], fill='#4b5563', width=2)
    # Ball
    draw.rectangle([124, 104, 132, 112], fill='#ffffff')
elif target == 'asteroids':
    draw.polygon([(128, 60), (160, 150), (128, 135), (96, 150)], fill='#ffffff')
    draw.polygon([(60, 60), (80, 50), (95, 70), (85, 95), (65, 90), (55, 75)], outline='#00f0ff', width=3)
elif target == 'wordle':
    tiles = [
        (55, 55, 105, 105, '#538d4e'),
        (115, 55, 165, 105, '#b59f3b'),
        (175, 55, 225, 105, '#3a3a3c'),
        (55, 115, 105, 165, '#3a3a3c'),
        (115, 115, 165, 165, '#538d4e'),
        (175, 115, 225, 165, '#b59f3b'),
        (55, 175, 105, 225, '#538d4e'),
        (115, 175, 165, 225, '#538d4e'),
        (175, 175, 225, 225, '#538d4e')
    ]
    for x1, y1, x2, y2, c in tiles:
        draw.rectangle([x1, y1, x2, y2], fill=c)
elif target == 'spaceinvaders':
    # Draw alien squid / crab
    draw.rectangle([110, 60, 146, 75], fill='#00ff66')
    draw.rectangle([95, 75, 161, 105], fill='#00ff66')
    draw.rectangle([80, 105, 176, 125], fill='#00ff66')
    draw.rectangle([105, 90, 115, 105], fill='#16161e')
    draw.rectangle([141, 90, 151, 105], fill='#16161e')
    draw.rectangle([90, 125, 105, 145], fill='#00ff66')
    draw.rectangle([151, 125, 166, 145], fill='#00ff66')
elif target == 'frogger':
    draw.rectangle([105, 80, 151, 140], fill='#00ff66')
    draw.rectangle([90, 60, 115, 85], fill='#00ff66')
    draw.rectangle([141, 60, 166, 85], fill='#00ff66')
    draw.rectangle([98, 68, 107, 77], fill='#ffffff')
    draw.rectangle([149, 68, 158, 77], fill='#ffffff')
    draw.rectangle([101, 71, 105, 75], fill='#000000')
    draw.rectangle([152, 71, 156, 75], fill='#000000')
    draw.rectangle([80, 110, 105, 155], fill='#00cc44')
    draw.rectangle([151, 110, 176, 155], fill='#00cc44')
else:
    draw.rectangle([85, 75, 171, 141], fill='#a855f7')

img.save(out_path, 'PNG')
"
}

build_single_desktop() {
    local target="$1"
    local app_name
    app_name=$(get_app_name "${target}")
    local slug
    slug=$(get_pkg_slug "${target}")
    local dims
    dims=$(get_window_dims "${target}")
    local width
    width=$(echo "${dims}" | cut -d' ' -f1)
    local height
    height=$(echo "${dims}" | cut -d' ' -f2)

    local tar_pkg="${DIST_DIR}/rpdevs-${slug}-linux-x86_64.tar.gz"
    local deb_pkg="${DIST_DIR}/rpdevs-${slug}_1.0.0_amd64.deb"

    log_info "Bundling Desktop App for: ${BOLD}${app_name}${RESET} (rpdevs-${slug})..."

    local build_dir
    build_dir=$(mktemp -d "/tmp/desktop_build_${slug}_XXXXXX")
    trap 'rm -rf "${build_dir}"' RETURN

    local app_dir="${build_dir}/opt/rpdevs-games/${slug}"
    mkdir -p "${app_dir}/assets"

    # Copy Web Assets
    if [[ "${target}" == "portal" ]]; then
        cp "${GAMES_ROOT}/index.html" "${app_dir}/assets/"
        cp "${GAMES_ROOT}/portal.css" "${app_dir}/assets/"
        cp "${GAMES_ROOT}/portal.js" "${app_dir}/assets/"
        cp "${GAMES_ROOT}/manifest.json" "${app_dir}/assets/"
        [[ -f "${GAMES_ROOT}/sw.js" ]] && cp "${GAMES_ROOT}/sw.js" "${app_dir}/assets/"
        cp "${GAMES_ROOT}/arcade_vault.js" "${app_dir}/assets/" 2>/dev/null || true
        cp "${GAMES_ROOT}/gamepad.js" "${app_dir}/assets/" 2>/dev/null || true
        cp "${GAMES_ROOT}/crt.css" "${app_dir}/assets/" 2>/dev/null || true
        cp "${GAMES_ROOT}/crt.js" "${app_dir}/assets/" 2>/dev/null || true

        for g in "${ALL_GAMES[@]}"; do
            if [[ -d "${GAMES_ROOT}/${g}" ]]; then
                mkdir -p "${app_dir}/assets/${g}"
                cp "${GAMES_ROOT}/${g}/index.html" "${app_dir}/assets/${g}/"
                cp -L "${GAMES_ROOT}/${g}/"*.css "${app_dir}/assets/${g}/" 2>/dev/null || true
                cp -L "${GAMES_ROOT}/${g}/"*.js "${app_dir}/assets/${g}/" 2>/dev/null || true
                cp -L "${GAMES_ROOT}/${g}/"*.json "${app_dir}/assets/${g}/" 2>/dev/null || true
                cp -r -L "${GAMES_ROOT}/${g}/src" "${app_dir}/assets/${g}/" 2>/dev/null || true
                [[ -f "${GAMES_ROOT}/${g}/RULES.md" ]] && cp "${GAMES_ROOT}/${g}/RULES.md" "${app_dir}/assets/${g}/"
            fi
        done
    else
        local src_dir="${GAMES_ROOT}/${target}"
        cp "${src_dir}/index.html" "${app_dir}/assets/"
        cp -L "${src_dir}/"*.css "${app_dir}/assets/" 2>/dev/null || true
        cp -L "${src_dir}/"*.js "${app_dir}/assets/" 2>/dev/null || true
        cp -L "${src_dir}/"*.json "${app_dir}/assets/" 2>/dev/null || true
        cp -r -L "${src_dir}/src" "${app_dir}/assets/" 2>/dev/null || true
        [[ -f "${src_dir}/RULES.md" ]] && cp "${src_dir}/RULES.md" "${app_dir}/assets/"
    fi

    # Generate Icon
    generate_desktop_icon "${target}" "${app_dir}/icon.png"

    # Create app.py
    cat <<EOF > "${app_dir}/app.py"
#!/usr/bin/env python3
"""
RPDevs Desktop Edition - ${app_name}
Native WebKitGTK Desktop Container
"""
import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer

try:
    import gi
    gi.require_version('Gtk', '3.0')
    gi.require_version('WebKit2', '4.1')
    from gi.repository import Gtk, WebKit2, GLib
except Exception as e:
    sys.stderr.write(f"Failed to load GTK/WebKit2: {e}\n")
    sys.stderr.write("Please ensure python3-gi, gir1.2-gtk-3.0, and gir1.2-webkit2-4.1 are installed.\n")
    sys.exit(1)

ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')
TITLE = "${app_name}"
WIDTH = ${width}
HEIGHT = ${height}

class DualStackServer(TCPServer):
    allow_reuse_address = True

class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ASSETS_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

def start_server():
    httpd = DualStackServer(('127.0.0.1', 0), QuietHandler)
    port = httpd.server_address[1]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return port

def main():
    port = start_server()
    url = f"http://127.0.0.1:{port}/index.html"

    win = Gtk.Window(title=TITLE)
    win.set_default_size(WIDTH, HEIGHT)
    win.set_position(Gtk.WindowPosition.CENTER)

    icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'icon.png')
    if os.path.exists(icon_path):
        try:
            win.set_icon_from_file(icon_path)
        except Exception:
            pass

    webview = WebKit2.WebView()
    settings = webview.get_settings()
    settings.set_enable_developer_extras(False)
    settings.set_enable_webgl(True)
    settings.set_javascript_can_access_clipboard(True)
    settings.set_enable_media_stream(True)

    win.add(webview)
    webview.load_uri(url)

    win.connect('destroy', Gtk.main_quit)
    win.show_all()
    Gtk.main()

if __name__ == '__main__':
    main()
EOF
    chmod +x "${app_dir}/app.py"

    # Create launch.sh
    cat <<'EOF' > "${app_dir}/launch.sh"
#!/bin/sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec python3 "${DIR}/app.py" "$@"
EOF
    chmod +x "${app_dir}/launch.sh"

    # Create FreeDesktop .desktop entry
    cat <<EOF > "${app_dir}/rpdevs-${slug}.desktop"
[Desktop Entry]
Name=${app_name}
Comment=RPDevs Games Suite - ${app_name}
Exec=/opt/rpdevs-games/${slug}/launch.sh
Icon=rpdevs-${slug}
Terminal=false
Type=Application
Categories=Game;LogicGame;ArcadeGame;
Keywords=game;arcade;retro;logic;
EOF

    # 1. Package Portable Tarball
    (
        cd "${build_dir}/opt/rpdevs-games"
        tar -czf "${tar_pkg}" "${slug}"
    )
    local tar_size
    tar_size=$(du -h "${tar_pkg}" | cut -f1)
    local tar_sha
    tar_sha=$(sha256sum "${tar_pkg}" | cut -d' ' -f1)
    log_success "Portable Tarball : ${BOLD}${tar_pkg}${RESET} (${tar_size}, SHA: ${tar_sha:0:12}...)"

    # 2. Package Debian (.deb)
    local deb_dir="${build_dir}/deb_root"
    mkdir -p "${deb_dir}/DEBIAN" \
             "${deb_dir}/opt/rpdevs-games" \
             "${deb_dir}/usr/local/bin" \
             "${deb_dir}/usr/share/applications" \
             "${deb_dir}/usr/share/icons/hicolor/256x256/apps"

    cp -r "${app_dir}" "${deb_dir}/opt/rpdevs-games/"

    # Symlink binary in /usr/local/bin
    ln -s "/opt/rpdevs-games/${slug}/launch.sh" "${deb_dir}/usr/local/bin/rpdevs-${slug}"

    # Install .desktop
    cp "${app_dir}/rpdevs-${slug}.desktop" "${deb_dir}/usr/share/applications/"

    # Install icon
    cp "${app_dir}/icon.png" "${deb_dir}/usr/share/icons/hicolor/256x256/apps/rpdevs-${slug}.png"

    # Control file
    cat <<EOF > "${deb_dir}/DEBIAN/control"
Package: rpdevs-${slug}
Version: 1.0.0
Section: games
Priority: optional
Architecture: all
Maintainer: RPDevs <builds@rpdevs.org>
Depends: python3, python3-gi, gir1.2-gtk-3.0, gir1.2-webkit2-4.1
Description: ${app_name} (RPDevs Games Suite)
 Standalone zero-dependency native desktop release of ${app_name}.
 Installed directly to /opt/rpdevs-games/${slug}.
EOF

    dpkg-deb --build "${deb_dir}" "${deb_pkg}" >/dev/null

    local deb_size
    deb_size=$(du -h "${deb_pkg}" | cut -f1)
    local deb_sha
    deb_sha=$(sha256sum "${deb_pkg}" | cut -d' ' -f1)
    log_success "Debian Package   : ${BOLD}${deb_pkg}${RESET} (${deb_size}, SHA: ${deb_sha:0:12}...)"
}

TARGET="${1:-all}"

echo -e "${CYAN}${BOLD}================================================================${RESET}"
echo -e "${CYAN}${BOLD}🖥️ RPDevs Multi-Platform Games - Desktop App Bundler${RESET}"
echo -e "${CYAN}${BOLD}================================================================${RESET}"
log_info "Packaging Engine     : WebKitGTK 4.1 + Python 3 + GTK3"
log_info "Distribution Output  : ${DIST_DIR}"
echo ""

ALL_GAMES=("lightsout" "snake" "simon" "minesweeper" "2048" "dotsandboxes" "sokoban" "connectfour" "breakout" "pong" "fallingblocks" "mazechaser" "asteroids" "wordle" "spaceinvaders" "frogger" "othello" "missilecommand" "lightcycles")

if [[ "${TARGET}" == "all" ]]; then
    for game in "${ALL_GAMES[@]}"; do
        build_single_desktop "${game}"
    done
    build_single_desktop "portal"
elif [[ "${TARGET}" == "portal" ]]; then
    build_single_desktop "portal"
else
    found=false
    for game in "${ALL_GAMES[@]}"; do
        if [[ "${TARGET}" == "${game}" ]]; then
            found=true
            break
        fi
    done
    if [[ "${found}" == false ]]; then
        log_error "Unknown game target: '${TARGET}'."
        echo "Available targets: ${ALL_GAMES[*]} portal all"
        exit 1
    fi
    build_single_desktop "${TARGET}"
fi

echo ""
log_success "All requested Desktop packages built successfully!"
echo -e "${CYAN}Available packages in ${DIST_DIR}:${RESET}"
ls -lh "${DIST_DIR}"/ 2>/dev/null || true
