#!/usr/bin/env python3
"""
UBTECH Alpha Mini (Robot Maatje) - Speech & Audio Skill
Manages Text-to-Speech (Dutch & English), system volume, and audio playback.
"""

import sys
import os
import json
import argparse
import subprocess
import shutil

ADB_PATH = shutil.which("adb") or r"C:\Users\joeyw\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe"

def run_adb(cmd_list, timeout=10):
    try:
        res = subprocess.run([ADB_PATH] + cmd_list, capture_output=True, text=True, timeout=timeout)
        return res.returncode, res.stdout.strip(), res.stderr.strip()
    except Exception as e:
        return -1, "", str(e)

def set_volume(percentage: int):
    """
    Set robot audio volume (0 to 100%).
    Clamps between 0 and 100, maps to Android STREAM_MUSIC (0-15).
    """
    pct = max(0, min(100, percentage))
    # Android 7 Nougat STREAM_MUSIC index max is 15
    music_level = int(pct * 15 / 100)
    # Using Android AudioService IPC: TRANSACTION_setStreamVolume = 3
    # service call audio 3 i32 3 i32 <level> i32 1
    code, _, err = run_adb(["shell", "service", "call", "audio", "3", "i32", "3", "i32", str(music_level), "i32", "1"])
    return {"success": code == 0, "volume_percent": pct, "stream_level": music_level, "error": err if code != 0 else None}

def play_audio(file_path_on_robot: str):
    """
    Play an audio file stored on the robot's filesystem (e.g. /sdcard/customize/music/...).
    """
    code, out, err = run_adb([
        "shell", "am", "start",
        "-a", "android.intent.action.VIEW",
        "-d", f"file://{file_path_on_robot}",
        "-t", "audio/*"
    ])
    return {"success": code == 0, "path": file_path_on_robot, "output": out, "error": err if code != 0 else None}

def speak_text(text: str, language: str = "nl-NL"):
    """
    Synthesize and speak text via UbTtsService / Android Speech service on the robot.
    Supports Dutch ('nl-NL') and English ('en-US').
    """
    safe_text = text.replace('"', '\\"').replace("'", "\\'")
    # We trigger the SRS UbTtsService / Speech service via Android broadcast intent
    intent_cmd = [
        "shell", "am", "startservice",
        "-n", "com.srs.robot_alpha_mini/.UbTtsService",
        "-a", "com.srs.robot.ACTION_TTS",
        "--es", "text", f'"{safe_text}"',
        "--es", "lang", language
    ]
    code, out, err = run_adb(intent_cmd)
    
    # Also log to system TTS broadcast
    run_adb([
        "shell", "am", "broadcast",
        "-a", "com.ubtrobot.action.TTS_PLAY",
        "--es", "tts_text", f'"{safe_text}"'
    ])

    return {
        "success": code == 0,
        "text": text,
        "language": language,
        "output": out,
        "error": err if code != 0 else None
    }

def main():
    parser = argparse.ArgumentParser(description="Alpha Mini Speech & Audio Skill")
    parser.add_argument("--speak", type=str, help="Text to speak")
    parser.add_argument("--lang", type=str, default="nl-NL", choices=["nl-NL", "en-US"], help="Language code")
    parser.add_argument("--volume", type=int, help="Set volume (0-100)")
    parser.add_argument("--play", type=str, help="Audio file path on robot to play")
    parser.add_argument("--test", action="store_true", help="Run speech test")
    parser.add_argument("--json", action="store_true", help="Output JSON response")
    args = parser.parse_args()

    results = {}

    if args.volume is not None:
        results["volume"] = set_volume(args.volume)

    if args.play:
        results["playback"] = play_audio(args.play)

    if args.speak:
        results["speech"] = speak_text(args.speak, args.lang)

    if args.test:
        print("[TEST] Setting volume to 75%...")
        vol_res = set_volume(75)
        print(f"  Volume status: {'OK' if vol_res['success'] else 'FAILED'}")
        
        test_phrase = "Hallo, ik ben Robot Maatje. De verbinding is succesvol tot stand gebracht."
        print(f"[TEST] Speaking Dutch phrase: '{test_phrase}'...")
        spk_res = speak_text(test_phrase, "nl-NL")
        print(f"  Speech status: {'OK' if spk_res['success'] else 'FAILED'}")
        results["test"] = {"volume": vol_res, "speech": spk_res}

    if args.json or (not args.test and not args.speak and args.volume is None and not args.play):
        print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()

