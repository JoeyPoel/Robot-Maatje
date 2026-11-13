#!/usr/bin/env python3
"""
UBTECH Alpha Mini (Robot Maatje) - Connection & Healthcheck Skill
Manages ADB connection, battery telemetry, Wi-Fi metrics, and active service health.
"""

import sys
import json
import argparse
import subprocess
import shutil
import re

ADB_PATH = shutil.which("adb") or r"C:\Users\joeyw\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe"

def run_adb_cmd(cmd_list, timeout=10):
    """Execute an ADB command safely with timeout."""
    full_cmd = [ADB_PATH] + cmd_list
    try:
        res = subprocess.run(full_cmd, capture_output=True, text=True, timeout=timeout)
        return res.returncode, res.stdout.strip(), res.stderr.strip()
    except Exception as e:
        return -1, "", str(e)

def get_battery_info():
    """Extract battery level, voltage, status and temperature."""
    code, out, _ = run_adb_cmd(["shell", "dumpsys", "battery"])
    info = {"level": 0, "voltage": 0, "temperature": 0.0, "status": "unknown", "usb_powered": False}
    if code != 0:
        return info

    for line in out.splitlines():
        line = line.strip()
        if line.startswith("level:"):
            info["level"] = int(line.split(":")[1].strip())
        elif line.startswith("voltage:"):
            info["voltage"] = int(line.split(":")[1].strip())
        elif line.startswith("temperature:"):
            info["temperature"] = float(line.split(":")[1].strip()) / 10.0
        elif line.startswith("USB powered:"):
            info["usb_powered"] = line.split(":")[1].strip().lower() == "true"
        elif line.startswith("status:"):
            st = int(line.split(":")[1].strip())
            info["status"] = {2: "charging", 3: "discharging", 5: "full"}.get(st, "unknown")
    return info

def get_wifi_info():
    """Extract Wi-Fi IP and interface status."""
    code, out, _ = run_adb_cmd(["shell", "ifconfig", "wlan0"])
    ip = "disconnected"
    mac = "unknown"
    if code == 0:
        ip_match = re.search(r"inet addr:(\d+\.\d+\.\d+\.\d+)", out)
        if ip_match:
            ip = ip_match.group(1)
        mac_match = re.search(r"HWaddr ([0-9a-fA-F:]{17})", out)
        if mac_match:
            mac = mac_match.group(1)
    return {"ip": ip, "mac": mac, "connected": ip != "disconnected"}

def check_health():
    """Perform a full system and service healthcheck."""
    code, out, _ = run_adb_cmd(["devices"])
    device_connected = False
    device_id = "none"
    for line in out.splitlines()[1:]:
        parts = line.split()
        if len(parts) >= 2 and parts[1] == "device":
            device_connected = True
            device_id = parts[0]
            break

    battery = get_battery_info()
    wifi = get_wifi_info()

    # Check key robot services
    code_svc, out_svc, _ = run_adb_cmd(["shell", "ps"])
    services_status = {
        "action_service": "com.ubtrobot.mini.controlservice" in out_svc,
        "voice_service": "com.ubtrobot.mini.voiceservice" in out_svc,
        "express_service": "com.ubtrobot.mini.expressservice" in out_svc,
        "camera_service": "com.ubt.alphamini.facedetector" in out_svc,
        "pccodemao_bridge": "com.ubt.pccodemao" in out_svc,
        "srs_maatje": "com.srs.robot_alpha_mini" in out_svc
    }

    return {
        "connected": device_connected,
        "device_id": device_id,
        "battery": battery,
        "wifi": wifi,
        "services": services_status,
        "healthy": device_connected and battery["level"] > 10
    }

def main():
    parser = argparse.ArgumentParser(description="Alpha Mini Connection & Healthcheck Skill")
    parser.add_argument("--test", action="store_true", help="Run self-diagnostic test")
    parser.add_argument("--json", action="store_true", help="Output JSON status")
    args = parser.parse_args()

    health = check_health()
    if args.json or not args.test:
        print(json.dumps(health, indent=2))
        return

    print("=== Alpha Mini Connection Diagnostic ===")
    print(f"Device Connected : {'[OK]' if health['connected'] else '[FAILED]'} (ID: {health['device_id']})")
    print(f"Battery Level    : {health['battery']['level']}% ({health['battery']['status']}, {health['battery']['temperature']}°C)")
    print(f"Wi-Fi IP         : {health['wifi']['ip']} (MAC: {health['wifi']['mac']})")
    print("Services:")
    for svc, running in health["services"].items():
        print(f"  - {svc:16}: {'[RUNNING]' if running else '[STOPPED]'}")
    print(f"Overall Health   : {'HEALTHY' if health['healthy'] else 'DEGRADED'}")

if __name__ == "__main__":
    main()

