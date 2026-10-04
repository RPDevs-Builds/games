#!/usr/bin/env bash
# ==============================================================================
# 📱 RPDevs Games Suite - Native Android APK Generator
# ==============================================================================
# Directly compiles, packages, aligns, and signs standalone Android .apk packages
# for games in /mnt/sharedroot/projects/games/ using native Android SDK build tools.
#
# Zero Gradle overhead. Zero npm bloat. Self-contained and blazing fast.
#
# Usage:
#   build_android_apk.sh [game_name | portal | all]
#
# Examples:
#   build_android_apk.sh lightsout
#   build_android_apk.sh dotsandboxes
#   build_android_apk.sh portal
#   build_android_apk.sh all
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# Terminal Formatting
# ------------------------------------------------------------------------------
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

# ------------------------------------------------------------------------------
# Directory & Toolchain Resolution
# ------------------------------------------------------------------------------
GAMES_ROOT="/mnt/sharedroot/projects/games"
DIST_DIR="${GAMES_ROOT}/dist/apk"
mkdir -p "${DIST_DIR}"

# Locate Android SDK
SDK_CANDIDATES=(
    "${ANDROID_HOME:-}"
    "${ANDROID_SDK_ROOT:-}"
    "/home/user/Android/Sdk"
    "/usr/lib/android-sdk"
)

ANDROID_SDK=""
for candidate in "${SDK_CANDIDATES[@]}"; do
    if [[ -n "${candidate}" && -d "${candidate}/platforms" ]]; then
        ANDROID_SDK="${candidate}"
        break
    fi
done

if [[ -z "${ANDROID_SDK}" ]]; then
    log_error "Could not locate Android SDK. Please set ANDROID_HOME or ANDROID_SDK_ROOT."
    exit 1
fi

# Locate latest platform android.jar
ANDROID_JAR=$(find "${ANDROID_SDK}/platforms" -name "android.jar" 2>/dev/null | sort -V | tail -n 1)
if [[ -z "${ANDROID_JAR}" ]]; then
    log_error "No android.jar platform found in ${ANDROID_SDK}/platforms."
    exit 1
fi

# Locate build-tools
BUILD_TOOLS_DIR=$(find "${ANDROID_SDK}/build-tools" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort -V | tail -n 1)
if [[ -z "${BUILD_TOOLS_DIR}" ]]; then
    log_error "No build-tools found in ${ANDROID_SDK}/build-tools."
    exit 1
fi

AAPT2="${BUILD_TOOLS_DIR}/aapt2"
D8="${BUILD_TOOLS_DIR}/d8"
ZIPALIGN="${BUILD_TOOLS_DIR}/zipalign"
APKSIGNER="${BUILD_TOOLS_DIR}/apksigner"

for tool in "${AAPT2}" "${D8}" "${ZIPALIGN}" "${APKSIGNER}"; do
    if [[ ! -x "${tool}" ]]; then
        log_error "Required Android SDK build tool missing or not executable: ${tool}"
        exit 1
    fi
done

# Check Java tools
command -v javac >/dev/null 2>&1 || { log_error "javac is required but not installed."; exit 1; }
command -v keytool >/dev/null 2>&1 || { log_error "keytool is required but not installed."; exit 1; }
command -v zip >/dev/null 2>&1 || { log_error "zip is required but not installed."; exit 1; }
command -v python3 >/dev/null 2>&1 || { log_error "python3 is required but not installed."; exit 1; }

# Debug keystore
DEBUG_KEYSTORE="${HOME}/.android/debug.keystore"
if [[ ! -f "${DEBUG_KEYSTORE}" ]]; then
    log_info "Creating Android debug keystore at ${DEBUG_KEYSTORE}..."
    mkdir -p "$(dirname "${DEBUG_KEYSTORE}")"
    keytool -genkeypair -v -keystore "${DEBUG_KEYSTORE}" -alias androiddebugkey \
        -keypass android -storepass android -keyalg RSA -keysize 2048 -validity 10000 \
        -dname "CN=Android Debug,O=Android,C=US" >/dev/null 2>&1
fi

# ------------------------------------------------------------------------------
# App Metadata Registry
# ------------------------------------------------------------------------------
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
        portal)       echo "RPDevs Arcade" ;;
        *)            echo "$1" ;;
    esac
}

get_pkg_name() {
    case "$1" in
        lightsout)    echo "lightsout" ;;
        snake)        echo "snake" ;;
        simon)        echo "simon" ;;
        minesweeper)  echo "minesweeper" ;;
        2048)         echo "game2048" ;;
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

# ------------------------------------------------------------------------------
# Icon Generator (Python PIL)
# ------------------------------------------------------------------------------
generate_icon() {
    local target="$1"
    local output_file="$2"
    local app_title
    app_title=$(get_app_name "$target")
    local color
    color=$(get_accent_color "$target")

    python3 -c "
import sys
from PIL import Image, ImageDraw, ImageFont

target = '${target}'
title = '${app_title}'
color = '${color}'
out_path = '${output_file}'

size = 192
img = Image.new('RGBA', (size, size), (18, 18, 24, 255))
draw = ImageDraw.Draw(img)

# Border with accent
draw.rounded_rectangle([6, 6, size-6, size-6], radius=32, fill=(24, 24, 32), outline=color, width=6)

# Inner accent circle/plate
draw.ellipse([40, 30, size-40, size-50], fill=(35, 35, 48), outline=color, width=3)

# Draw symbolic glyph based on target
if target == 'lightsout':
    draw.rectangle([70, 50, 122, 102], fill='#ff0055')
elif target == 'snake':
    for seg in [(60,65), (80,65), (100,65), (100,85), (120,85)]:
        draw.rectangle([seg[0], seg[1], seg[0]+14, seg[1]+14], fill='#8bac0f')
elif target == 'simon':
    draw.pieslice([50, 40, size-50, size-60], 0, 90, fill='#00f0ff')
    draw.pieslice([50, 40, size-50, size-60], 90, 180, fill='#ff0055')
    draw.pieslice([50, 40, size-50, size-60], 180, 270, fill='#ffe600')
    draw.pieslice([50, 40, size-50, size-60], 270, 360, fill='#00ff66')
elif target == 'minesweeper':
    draw.ellipse([76, 56, 116, 96], fill='#333333')
    draw.line([96, 46, 96, 106], fill='#ff3333', width=4)
    draw.line([66, 76, 126, 76], fill='#ff3333', width=4)
elif target == '2048':
    draw.rectangle([60, 50, 132, 102], fill='#edc22e')
elif target == 'dotsandboxes':
    for x in [68, 96, 124]:
        for y in [58, 86]:
            draw.ellipse([x-4, y-4, x+4, y+4], fill='#60a5fa')
    draw.line([68, 58, 96, 58], fill='#3b82f6', width=4)
    draw.line([68, 58, 68, 86], fill='#3b82f6', width=4)
elif target == 'sokoban':
    draw.rectangle([66, 56, 126, 116], fill='#b86e26', outline='#ffd166', width=3)
    draw.line([66, 56, 126, 116], fill='#754111', width=3)
    draw.line([66, 116, 126, 56], fill='#754111', width=3)
elif target == 'connectfour':
    draw.rounded_rectangle([58, 48, 134, 124], radius=10, fill='#004b93', outline='#002e5b', width=3)
    for cx, cy, ccolor in [(76, 70, '#e63946'), (116, 70, '#ffb703'), (76, 102, '#ffb703'), (116, 102, '#e63946')]:
        draw.ellipse([cx-12, cy-12, cx+12, cy+12], fill=ccolor)
elif target == 'breakout':
    for y, bcolor in [(52, '#ff0055'), (64, '#ff8800'), (76, '#00ff66'), (88, '#ffe600')]:
        for bx in [52, 78, 104, 130]:
            draw.rectangle([bx, y, bx+20, y+8], fill=bcolor)
    draw.rectangle([74, 114, 122, 120], fill='#00f0ff')
    draw.rectangle([94, 102, 100, 108], fill='#ffffff')
elif target == 'pong':
    draw.rectangle([54, 60, 60, 110], fill='#00f0ff')
    draw.rectangle([132, 50, 138, 100], fill='#ff0055')
    for ny in range(30, 140, 14):
        draw.line([96, ny, 96, ny+6], fill='#4b5563', width=2)
    draw.rectangle([93, 80, 99, 86], fill='#ffffff')
elif target == 'asteroids':
    draw.polygon([(96, 45), (120, 115), (96, 102), (72, 115)], fill='#ffffff')
    draw.polygon([(45, 45), (60, 38), (72, 53), (64, 72), (48, 68), (40, 56)], outline='#00f0ff', width=3)
elif target == 'wordle':
    tiles = [
        (45, 45, 75, 75, '#538d4e'),
        (81, 45, 111, 75, '#b59f3b'),
        (117, 45, 147, 75, '#3a3a3c'),
        (45, 81, 75, 111, '#3a3a3c'),
        (81, 81, 111, 111, '#538d4e'),
        (117, 81, 147, 111, '#b59f3b'),
        (45, 117, 75, 147, '#538d4e'),
        (81, 117, 111, 147, '#538d4e'),
        (117, 117, 147, 147, '#538d4e')
    ]
    for x1, y1, x2, y2, c in tiles:
        draw.rectangle([x1, y1, x2, y2], fill=c)
elif target == 'spaceinvaders':
    # Draw alien squid / crab
    draw.rectangle([80, 45, 112, 57], fill='#00ff66')
    draw.rectangle([68, 57, 124, 81], fill='#00ff66')
    draw.rectangle([56, 81, 136, 97], fill='#00ff66')
    draw.rectangle([76, 69, 84, 81], fill='#181820')
    draw.rectangle([108, 69, 116, 81], fill='#181820')
    draw.rectangle([64, 97, 76, 113], fill='#00ff66')
    draw.rectangle([116, 97, 128, 113], fill='#00ff66')
elif target == 'frogger':
    draw.rectangle([78, 60, 114, 105], fill='#00ff66')
    draw.rectangle([67, 45, 86, 64], fill='#00ff66')
    draw.rectangle([106, 45, 125, 64], fill='#00ff66')
    draw.rectangle([73, 51, 80, 58], fill='#ffffff')
    draw.rectangle([112, 51, 119, 58], fill='#ffffff')
    draw.rectangle([75, 53, 78, 56], fill='#000000')
    draw.rectangle([114, 53, 117, 56], fill='#000000')
    draw.rectangle([60, 82, 78, 116], fill='#00cc44')
    draw.rectangle([114, 82, 132, 116], fill='#00cc44')
else:
    draw.rectangle([65, 55, 127, 95], fill='#a855f7')

img.save(out_path, 'PNG')
"
}

# ------------------------------------------------------------------------------
# Single Game APK Builder
# ------------------------------------------------------------------------------
build_single_apk() {
    local target="$1"
    local app_name
    app_name=$(get_app_name "${target}")
    local pkg_suffix
    pkg_suffix=$(get_pkg_name "${target}")
    local pkg_id="com.rpdevs.games.${pkg_suffix}"
    local output_apk="${DIST_DIR}/${target}.apk"

    log_info "Building Android APK for: ${BOLD}${app_name}${RESET} (${pkg_id})..."

    local build_dir
    build_dir=$(mktemp -d "/tmp/apk_build_${target}_XXXXXX")
    trap 'rm -rf "${build_dir}"' RETURN

    # 1. Structure directories
    mkdir -p "${build_dir}/res/values" \
             "${build_dir}/res/mipmap-mdpi" \
             "${build_dir}/res/mipmap-hdpi" \
             "${build_dir}/res/mipmap-xhdpi" \
             "${build_dir}/res/mipmap-xxhdpi" \
             "${build_dir}/src/com/rpdevs/games/${pkg_suffix}" \
             "${build_dir}/assets/www" \
             "${build_dir}/obj"

    # 2. String resources
    cat <<EOF > "${build_dir}/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${app_name}</string>
</resources>
EOF

    # 3. Generate icon
    generate_icon "${target}" "${build_dir}/res/mipmap-mdpi/ic_launcher.png"
    cp "${build_dir}/res/mipmap-mdpi/ic_launcher.png" "${build_dir}/res/mipmap-hdpi/ic_launcher.png"
    cp "${build_dir}/res/mipmap-mdpi/ic_launcher.png" "${build_dir}/res/mipmap-xhdpi/ic_launcher.png"
    cp "${build_dir}/res/mipmap-mdpi/ic_launcher.png" "${build_dir}/res/mipmap-xxhdpi/ic_launcher.png"

    # 4. Copy Web Assets
    if [[ "${target}" == "portal" ]]; then
        # Copy root portal files and all game subfolders
        cp "${GAMES_ROOT}/index.html" "${build_dir}/assets/www/"
        cp "${GAMES_ROOT}/portal.css" "${build_dir}/assets/www/"
        cp "${GAMES_ROOT}/portal.js" "${build_dir}/assets/www/"
        cp "${GAMES_ROOT}/manifest.json" "${build_dir}/assets/www/"
        [[ -f "${GAMES_ROOT}/sw.js" ]] && cp "${GAMES_ROOT}/sw.js" "${build_dir}/assets/www/"
        cp "${GAMES_ROOT}/arcade_vault.js" "${build_dir}/assets/www/" 2>/dev/null || true
        cp "${GAMES_ROOT}/gamepad.js" "${build_dir}/assets/www/" 2>/dev/null || true
        cp "${GAMES_ROOT}/crt.css" "${build_dir}/assets/www/" 2>/dev/null || true
        cp "${GAMES_ROOT}/crt.js" "${build_dir}/assets/www/" 2>/dev/null || true

        for g in "${ALL_GAMES[@]}"; do
            if [[ -d "${GAMES_ROOT}/${g}" ]]; then
                mkdir -p "${build_dir}/assets/www/${g}"
                cp "${GAMES_ROOT}/${g}/index.html" "${build_dir}/assets/www/${g}/"
                cp -L "${GAMES_ROOT}/${g}/"*.css "${build_dir}/assets/www/${g}/" 2>/dev/null || true
                cp -L "${GAMES_ROOT}/${g}/"*.js "${build_dir}/assets/www/${g}/" 2>/dev/null || true
                cp -L "${GAMES_ROOT}/${g}/"*.json "${build_dir}/assets/www/${g}/" 2>/dev/null || true
                cp -r -L "${GAMES_ROOT}/${g}/src" "${build_dir}/assets/www/${g}/" 2>/dev/null || true
                [[ -f "${GAMES_ROOT}/${g}/RULES.md" ]] && cp "${GAMES_ROOT}/${g}/RULES.md" "${build_dir}/assets/www/${g}/"
            fi
        done
    else
        local src_dir="${GAMES_ROOT}/${target}"
        if [[ ! -d "${src_dir}" ]]; then
            log_error "Game directory not found: ${src_dir}"
            return 1
        fi
        cp "${src_dir}/index.html" "${build_dir}/assets/www/"
        cp -L "${src_dir}/"*.css "${build_dir}/assets/www/" 2>/dev/null || true
        cp -L "${src_dir}/"*.js "${build_dir}/assets/www/" 2>/dev/null || true
        cp -L "${src_dir}/"*.json "${build_dir}/assets/www/" 2>/dev/null || true
        cp -r -L "${src_dir}/src" "${build_dir}/assets/www/" 2>/dev/null || true
        [[ -f "${src_dir}/RULES.md" ]] && cp "${src_dir}/RULES.md" "${build_dir}/assets/www/"
    fi

    # 5. AndroidManifest.xml
    cat <<EOF > "${build_dir}/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${pkg_id}"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <queries>
        <package android:name="com.rpdevs.games.arcade" />
    </queries>

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:hardwareAccelerated="true"
        android:allowBackup="false">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden|smallestScreenSize|screenLayout"
            android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

    # 6. MainActivity.java
    cat <<EOF > "${build_dir}/src/com/rpdevs/games/${pkg_suffix}/MainActivity.java"
package ${pkg_id};

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.KeyEvent;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                             WindowManager.LayoutParams.FLAG_FULLSCREEN);

        // Immersive sticky fullscreen mode
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        WebView.setWebContentsDebuggingEnabled(true);

        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public boolean launchArcade() {
                try {
                    Intent intent = getPackageManager().getLaunchIntentForPackage("com.rpdevs.games.arcade");
                    if (intent == null) {
                        intent = new Intent();
                        intent.setComponent(new android.content.ComponentName("com.rpdevs.games.arcade", "com.rpdevs.games.arcade.MainActivity"));
                    }
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    android.util.Log.e("ArcadeBridge", "Launch error: " + e.getMessage());
                }
                return false;
            }

            @JavascriptInterface
            public boolean isStandalone() {
                return !"com.rpdevs.games.arcade".equals(getPackageName());
            }

            @JavascriptInterface
            public void vibrate(long milliseconds) {
                try {
                    android.os.Vibrator v = (android.os.Vibrator) getSystemService(android.content.Context.VIBRATOR_SERVICE);
                    if (v != null && v.hasVibrator()) {
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                            v.vibrate(android.os.VibrationEffect.createOneShot(milliseconds, android.os.VibrationEffect.DEFAULT_AMPLITUDE));
                        } else {
                            v.vibrate(milliseconds);
                        }
                    }
                } catch (Exception e) {
                    android.util.Log.e("ArcadeBridge", "Vibrate error: " + e.getMessage());
                }
            }
        }, "AndroidArcade");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage cm) {
                android.util.Log.e("WebViewConsole", "[" + cm.messageLevel() + "] " + cm.message() + " (" + cm.sourceId() + ":" + cm.lineNumber() + ")");
                return true;
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            private boolean handleUrl(WebView view, String url) {
                if (url == null) return false;
                if (url.startsWith("intent:") || url.startsWith("android-app:")) {
                    try {
                        Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                        if (intent != null) {
                            if (getPackageManager().resolveActivity(intent, 0) != null) {
                                startActivity(intent);
                                return true;
                            }
                        }
                    } catch (Exception e) {
                        android.util.Log.e("WebViewClient", "Intent parse error: " + e.getMessage());
                    }
                    return true;
                }
                if (url.startsWith("file:///android_asset/")) {
                    if (url.endsWith("/")) {
                        view.loadUrl(url + "index.html");
                        return true;
                    }
                    if (url.equals("file:///android_asset/index.html") || !url.contains("/www/")) {
                        view.loadUrl("file:///android_asset/www/index.html");
                        return true;
                    }
                }
                return false;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(view, url);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    return handleUrl(view, request.getUrl().toString());
                }
                return false;
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                android.util.Log.e("WebViewClient", "Error " + errorCode + ": " + description + " for " + failingUrl);
                if (failingUrl != null && !failingUrl.equals("file:///android_asset/www/index.html")) {
                    view.loadUrl("file:///android_asset/www/index.html");
                }
            }
        });

        webView.loadUrl("file:///android_asset/www/index.html");
        setContentView(webView);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.onPause();
        }
    }
}
EOF

    # 7. Step 1: AAPT2 Compile
    "${AAPT2}" compile --dir "${build_dir}/res" -o "${build_dir}/compiled_res.zip" >/dev/null

    # 8. Step 2: AAPT2 Link
    "${AAPT2}" link -I "${ANDROID_JAR}" \
        --manifest "${build_dir}/AndroidManifest.xml" \
        -o "${build_dir}/unaligned.apk" \
        --java "${build_dir}/src" \
        "${build_dir}/compiled_res.zip" \
        -A "${build_dir}/assets" >/dev/null

    # 9. Step 3: Javac Compilation
    javac -cp "${ANDROID_JAR}" -d "${build_dir}/obj" \
        "${build_dir}/src/com/rpdevs/games/${pkg_suffix}/"*.java

    # 10. Step 4: D8 Dex Conversion
    local class_files
    mapfile -t class_files < <(find "${build_dir}/obj" -name "*.class")
    "${D8}" --output "${build_dir}" --lib "${ANDROID_JAR}" "${class_files[@]}" >/dev/null

    # 11. Step 5: Add DEX to APK
    (cd "${build_dir}" && zip -j -u -q unaligned.apk classes.dex)

    # 12. Step 6: Zipalign 4-byte
    "${ZIPALIGN}" -f -p 4 "${build_dir}/unaligned.apk" "${build_dir}/aligned.apk"

    # 13. Step 7: Apksigner
    "${APKSIGNER}" sign \
        --ks "${DEBUG_KEYSTORE}" \
        --ks-pass "pass:android" \
        --key-pass "pass:android" \
        --out "${output_apk}" \
        "${build_dir}/aligned.apk" >/dev/null

    # 14. Verify Signature
    "${APKSIGNER}" verify "${output_apk}" >/dev/null

    local size
    size=$(du -h "${output_apk}" | cut -f1)
    local sha
    sha=$(sha256sum "${output_apk}" | cut -d' ' -f1)

    log_success "Created: ${BOLD}${output_apk}${RESET} (${size}, SHA256: ${sha:0:12}...)"
}

# ------------------------------------------------------------------------------
# Entrypoint & Target Resolution
# ------------------------------------------------------------------------------
TARGET="${1:-all}"

echo -e "${CYAN}${BOLD}================================================================${RESET}"
echo -e "${CYAN}${BOLD}📱 RPDevs Multi-Platform Games - Android APK Generator${RESET}"
echo -e "${CYAN}${BOLD}================================================================${RESET}"
log_info "Android SDK Platform : $(basename "${ANDROID_JAR}")"
log_info "Build Tools Version  : $(basename "${BUILD_TOOLS_DIR}")"
log_info "Distribution Output  : ${DIST_DIR}"
echo ""

ALL_GAMES=("lightsout" "snake" "simon" "minesweeper" "2048" "dotsandboxes" "sokoban" "connectfour" "breakout" "pong" "fallingblocks" "mazechaser" "asteroids" "wordle" "spaceinvaders" "frogger" "othello" "missilecommand" "lightcycles")

if [[ "${TARGET}" == "all" ]]; then
    for game in "${ALL_GAMES[@]}"; do
        build_single_apk "${game}"
    done
    build_single_apk "portal"
elif [[ "${TARGET}" == "portal" ]]; then
    build_single_apk "portal"
else
    # Validate target
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
    build_single_apk "${TARGET}"
fi

echo ""
log_success "All requested Android APK builds completed successfully!"
echo -e "${CYAN}Available APKs in ${DIST_DIR}:${RESET}"
ls -lh "${DIST_DIR}"/*.apk 2>/dev/null || true
