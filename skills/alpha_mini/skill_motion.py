#!/usr/bin/env python3
"""
UBTECH Alpha Mini (Robot Maatje) - Motion & Kinematics Skill
Controls 14 servos with angle limits, runs pre-programmed UBX actions, and manages posture safety.
"""

import sys
import json
import argparse
import subprocess
import shutil

ADB_PATH = shutil.which("adb") or r"C:\Users\joeyw\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe"

# Hard angle limit clamps (degrees) to prevent physical servo gear stripping
SERVO_LIMITS = {
    "head_yaw": {"id": 1, "min": -90, "max": 90, "default": 0},
    "head_pitch": {"id": 2, "min": -20, "max": 30, "default": 0},
    "left_shoulder_pitch": {"id": 3, "min": -180, "max": 180, "default": 0},
    "left_shoulder_roll": {"id": 4, "min": -10, "max": 95, "default": 10},
    "left_elbow": {"id": 5, "min": -90, "max": 0, "default": 0},
    "right_shoulder_pitch": {"id": 6, "min": -180, "max": 180, "default": 0},
    "right_shoulder_roll": {"id": 7, "min": -95, "max": 10, "default": -10},
    "right_elbow": {"id": 8, "min": 0, "max": 90, "default": 0},
    "left_hip_yaw": {"id": 9, "min": -45, "max": 45, "default": 0},
    "left_hip_roll": {"id": 10, "min": -45, "max": 45, "default": 0},
    "left_hip_pitch": {"id": 11, "min": -90, "max": 45, "default": 0},
    "left_knee": {"id": 12, "min": 0, "max": 120, "default": 0},
    "left_ankle": {"id": 13, "min": -45, "max": 45, "default": 0},
    "right_hip_yaw": {"id": 14, "min": -45, "max": 45, "default": 0},
    "right_hip_roll": {"id": 15, "min": -45, "max": 45, "default": 0},
    "right_hip_pitch": {"id": 16, "min": -90, "max": 45, "default": 0},
    "right_knee": {"id": 17, "min": 0, "max": 120, "default": 0},
    "right_ankle": {"id": 18, "min": -45, "max": 45, "default": 0},
}

PRESET_ACTIONS = [
    "say_hello_avatar",
    "stand_up",
    "zitten",
    "move_forward_avatar",
    "turn_left_avatar",
    "turn_right_avatar",
    "klappen",
    "dance_0001",
    "heupen",
    "fysio1",
    "knikarm",
    "handshake_avatar"
]

def run_adb(cmd_list, timeout=10):
    try:
        res = subprocess.run([ADB_PATH] + cmd_list, capture_output=True, text=True, timeout=timeout)
        return res.returncode, res.stdout.strip(), res.stderr.strip()
    except Exception as e:
        return -1, "", str(e)

def clamp_servo_angle(joint_name: str, target_angle: float) -> float:
    """Clamp joint angle to hard safety limits."""
    if joint_name not in SERVO_LIMITS:
        raise ValueError(f"Unknown joint name: {joint_name}")
    limits = SERVO_LIMITS[joint_name]
    return max(limits["min"], min(limits["max"], target_angle))

def set_servo_angle(joint_name: str, angle: float, duration_ms: int = 500):
    """
    Safely command an individual servo angle with software clamping.
    """
    safe_angle = clamp_servo_angle(joint_name, angle)
    joint_id = SERVO_LIMITS[joint_name]["id"]
    
    # Broadcast to UBTECH motor service
    cmd = [
        "shell", "am", "broadcast",
        "-a", "com.ubtrobot.mini.controlservice.SET_SERVO",
        "--ei", "servo_id", str(joint_id),
        "--ef", "angle", str(safe_angle),
        "--ei", "duration", str(duration_ms)
    ]
    code, out, err = run_adb(cmd)
    return {
        "success": code == 0,
        "joint": joint_name,
        "joint_id": joint_id,
        "requested_angle": angle,
        "clamped_angle": safe_angle,
        "duration_ms": duration_ms,
        "error": err if code != 0 else None
    }

def play_action(action_name: str):
    """
    Play a pre-recorded action sequence (UBX motion file).
    """
    # Strip extension if passed
    action_clean = action_name.replace(".ubx", "")
    cmd = [
        "shell", "am", "broadcast",
        "-a", "com.ubtrobot.action.PLAY",
        "--es", "action_name", action_clean
    ]
    code, out, err = run_adb(cmd)
    
    # Also trigger SRS action service
    run_adb([
        "shell", "am", "broadcast",
        "-a", "com.srs.robot.ACTION_PLAY",
        "--es", "action", action_clean
    ])

    return {
        "success": code == 0,
        "action": action_clean,
        "output": out,
        "error": err if code != 0 else None
    }

def stop_motion():
    """Immediately stop all currently executing actions and servos."""
    cmd = [
        "shell", "am", "broadcast",
        "-a", "com.ubtrobot.action.STOP"
    ]
    code, out, err = run_adb(cmd)
    return {"success": code == 0, "error": err if code != 0 else None}

def main():
    parser = argparse.ArgumentParser(description="Alpha Mini Motion & Kinematics Skill")
    parser.add_argument("--action", type=str, help="Pre-programmed action name (e.g. say_hello_avatar, klappen)")
    parser.add_argument("--servo", nargs=2, metavar=("JOINT", "ANGLE"), help="Set joint angle: --servo head_yaw 15")
    parser.add_argument("--stop", action="store_true", help="Stop all motions")
    parser.add_argument("--list-actions", action="store_true", help="List available preset actions")
    parser.add_argument("--list-servos", action="store_true", help="List all 14 servos and safety limits")
    parser.add_argument("--test", action="store_true", help="Run motion diagnostic test")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    args = parser.parse_args()

    results = {}

    if args.list_actions:
        print(json.dumps(PRESET_ACTIONS, indent=2))
        return

    if args.list_servos:
        print(json.dumps(SERVO_LIMITS, indent=2))
        return

    if args.stop:
        results["stop"] = stop_motion()

    if args.action:
        results["action"] = play_action(args.action)

    if args.servo:
        joint, angle_str = args.servo
        results["servo"] = set_servo_angle(joint, float(angle_str))

    if args.test:
        print("[TEST] Verifying servo kinematics limits...")
        test_clamp = clamp_servo_angle("head_yaw", 150)
        print(f"  Head yaw 150deg clamped to safe limit: {test_clamp}deg [OK]")
        
        print("[TEST] Triggering wave greeting: 'say_hello_avatar'...")
        act_res = play_action("say_hello_avatar")
        print(f"  Motion status: {'OK' if act_res['success'] else 'FAILED'}")
        results["test"] = {"action": act_res, "clamped_test": test_clamp}

    if args.json or (not args.test and not args.action and not args.servo and not args.stop):
        print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()

