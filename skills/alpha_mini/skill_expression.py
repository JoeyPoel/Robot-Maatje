#!/usr/bin/env python3
"""
UBTECH Alpha Mini (Robot Maatje) - Eye Expressions & LCD Matrix Skill
Controls the dual round eye displays, mouth LEDs, and emotion animations.
"""

import sys
import os
import json
import argparse
import subprocess
import shutil

ADB_PATH = shutil.which("adb") or r"C:\Users\joeyw\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe"

# Standard emotional expressions mapped to robot assets
EMOTION_MAP = {
    "happy": "001_face.gif",
    "curious": "006_face.gif",
    "surprised": "010_face.gif",
    "sleepy": "dark_001.gif",
    "angry": "022_face.gif",
    "wink": "001blink.gif",
    "boot": "bootSuccess.gif",
    "tap_head": "001_tapHead.gif",
    "photograph": "002_photograph.gif"
}

def run_adb(cmd_list, timeout=10):
    try:
        res = subprocess.run([ADB_PATH] + cmd_list, capture_output=True, text=True, timeout=timeout)
        return res.returncode, res.stdout.strip(), res.stderr.strip()
    except Exception as e:
        return -1, "", str(e)

def play_expression(expression_name: str):
    """
    Play an emotion animation on the dual round eye displays.
    """
    asset = EMOTION_MAP.get(expression_name.lower(), expression_name)
    cmd = [
        "shell", "am", "broadcast",
        "-a", "com.ubtrobot.express.PLAY",
        "--es", "express_name", asset
    ]
    code, out, err = run_adb(cmd)
    
    # Also notify SRS expression worker
    run_adb([
        "shell", "am", "broadcast",
        "-a", "com.srs.robot.ACTION_EXPRESSION",
        "--es", "expression", asset
    ])

    return {
        "success": code == 0,
        "expression": expression_name,
        "asset": asset,
        "output": out,
        "error": err if code != 0 else None
    }

def set_mouth_lamp(state: bool, color_rgb: str = "#00FFFF"):
    """
    Set mouth lamp state and color.
    """
    cmd = [
        "shell", "am", "broadcast",
        "-a", "com.ubtrobot.led.SET_MOUTH",
        "--ez", "enable", "true" if state else "false",
        "--es", "color", color_rgb
    ]
    code, out, err = run_adb(cmd)
    return {"success": code == 0, "enabled": state, "color": color_rgb, "error": err if code != 0 else None}

def capture_eye_screen(output_local_path: str = "./eye_capture.png"):
    """
    Capture a current snapshot of the dual eye LCD screens.
    """
    remote_path = "/sdcard/eye_temp.png"
    code, _, err = run_adb(["shell", "screencap", "-p", remote_path])
    if code != 0:
        return {"success": False, "error": f"Screencap failed: {err}"}
    
    code_pull, _, err_pull = run_adb(["pull", remote_path, output_local_path])
    run_adb(["shell", "rm", remote_path])
    return {
        "success": code_pull == 0,
        "local_path": output_local_path,
        "error": err_pull if code_pull != 0 else None
    }

def main():
    parser = argparse.ArgumentParser(description="Alpha Mini Eye Expressions Skill")
    parser.add_argument("--expression", type=str, help="Emotion name (happy, curious, surprised, sleepy, angry, wink, boot)")
    parser.add_argument("--mouth-lamp", choices=["on", "off"], help="Turn mouth lamp on/off")
    parser.add_argument("--capture", type=str, help="Capture eye LCD frame to local file")
    parser.add_argument("--list-emotions", action="store_true", help="List supported emotion tags")
    parser.add_argument("--test", action="store_true", help="Run expression test")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    args = parser.parse_args()

    results = {}

    if args.list_emotions:
        print(json.dumps(EMOTION_MAP, indent=2))
        return

    if args.mouth_lamp:
        results["mouth_lamp"] = set_mouth_lamp(args.mouth_lamp == "on")

    if args.expression:
        results["expression"] = play_expression(args.expression)

    if args.capture:
        results["capture"] = capture_eye_screen(args.capture)

    if args.test:
        print("[TEST] Triggering 'happy' eye expression...")
        expr_res = play_expression("happy")
        print(f"  Expression status: {'OK' if expr_res['success'] else 'FAILED'}")

        print("[TEST] Capturing eye LCD screen...")
        cap_res = capture_eye_screen("./test_eye_screen.png")
        print(f"  Eye capture status: {'OK' if cap_res['success'] else 'FAILED'} (Saved to {cap_res.get('local_path')})")
        results["test"] = {"expression": expr_res, "capture": cap_res}

    if args.json or (not args.test and not args.expression and not args.mouth_lamp and not args.capture):
        print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()

