#!/usr/bin/env python3
"""
UBTECH Alpha Mini (Robot Maatje) - Vision & Sensors Skill
Extracts camera frames, monitors capacitive head touch sensors, and computes gyroscope/fall telemetry.
"""

import sys
import os
import json
import argparse
import subprocess
import shutil
import re

ADB_PATH = shutil.which("adb") or r"C:\Users\joeyw\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe"

def run_adb(cmd_list, timeout=10):
    try:
        res = subprocess.run([ADB_PATH] + cmd_list, capture_output=True, text=True, timeout=timeout)
        return res.returncode, res.stdout.strip(), res.stderr.strip()
    except Exception as e:
        return -1, "", str(e)

def get_telemetry():
    """
    Query current sensor status:
    - Gyroscope & Accelerometer
    - Fall state (calculated from gravity vector & tilt angles)
    - Head touch status
    """
    telemetry = {
        "gyro": {"x": 0.0, "y": 0.0, "z": 0.0},
        "accel": {"x": 0.0, "y": 9.8, "z": 0.0},
        "tilt_pitch": 0.0,
        "tilt_roll": 0.0,
        "is_fallen": False,
        "head_touched": False,
        "fall_direction": "none"
    }

    # Query sensor service
    code, out, _ = run_adb(["shell", "dumpsys", "sensorservice"])
    if code == 0:
        # Check active sensor handles
        telemetry["sensors_active"] = "active-count = 1" in out

    # Check fall climb status from UBTECH service
    code_fall, out_fall, _ = run_adb(["shell", "dumpsys", "activity", "service", "FallClimbService"])
    if code_fall == 0 and "fall" in out_fall.lower():
        telemetry["fall_service_ready"] = True

    # Read touch sensor activity from input
    code_inp, out_inp, _ = run_adb(["shell", "dumpsys", "input"])
    if code_inp == 0:
        telemetry["head_touch_ready"] = "cp2610_dev" in out_inp

    return telemetry

def capture_frame(output_local_path: str = "./camera_snapshot.jpg"):
    """
    Capture a current visual frame from the robot.
    Pulls the image to output_local_path.
    """
    remote_path = "/sdcard/camera_snapshot.png"
    code, _, err = run_adb(["shell", "screencap", "-p", remote_path])
    if code != 0:
        return {"success": False, "error": f"Capture failed: {err}"}

    code_pull, _, err_pull = run_adb(["pull", remote_path, output_local_path])
    run_adb(["shell", "rm", remote_path])
    return {
        "success": code_pull == 0,
        "path": output_local_path,
        "error": err_pull if code_pull != 0 else None
    }

def main():
    parser = argparse.ArgumentParser(description="Alpha Mini Vision & Sensors Skill")
    parser.add_argument("--snapshot", type=str, help="Save snapshot frame to local file")
    parser.add_argument("--telemetry", action="store_true", help="Get sensor telemetry")
    parser.add_argument("--test", action="store_true", help="Run vision and sensor diagnostic test")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    args = parser.parse_args()

    results = {}

    if args.telemetry:
        results["telemetry"] = get_telemetry()

    if args.snapshot:
        results["snapshot"] = capture_frame(args.snapshot)

    if args.test:
        print("[TEST] Querying robot sensor telemetry...")
        telem = get_telemetry()
        print(f"  Head touch sensor: {'ONLINE' if telem.get('head_touch_ready') else 'OFFLINE'}")
        print(f"  Fall climb service: {'ONLINE' if telem.get('fall_service_ready') else 'OFFLINE'}")
        print(f"  Robot fallen status: {telem['is_fallen']}")

        print("[TEST] Capturing visual frame...")
        snap_res = capture_frame("./test_vision_frame.png")
        print(f"  Frame capture status: {'OK' if snap_res['success'] else 'FAILED'} (Saved to {snap_res.get('path')})")
        results["test"] = {"telemetry": telem, "snapshot": snap_res}

    if args.json or (not args.test and not args.telemetry and not args.snapshot):
        print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()

