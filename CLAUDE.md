# UBTECH Alpha Mini (Robot Maatje / Zorgrobot Robin)
## Master Hardware & Architecture Handover Guide

> **Document Version:** 1.0.0  
> **Target Engineer / AI Agent:** Claude / Autonomous Robotics Engineer  
> **Repository:** `Robot-Maatje`  
> **Operating System:** Android 7.0 (Nougat, API 24), Linux Kernel 3.18.35  
> **Chipset / Hardware Platform:** MediaTek MT6739 (Quad-Core Cortex-A53 @ 1.5GHz), Board: `X100`

---

## 1. Executive Summary & Hardware Identity

This physical humanoid robot was originally manufactured by **UBTECH** as the **Alpha Mini** (or *Iron Man / Edu* series) and distributed in the Netherlands under the commercial name **Robot Maatje** / **Zorgrobot Robin** by **Smart Robot Solutions (SRS)**.

### Verified Hardware Identity
* **Device Serial Numbers (ADB):**
  * Robot #1: `010058YUD18082410124` (Alpha Mini, Android 7.0 / MTK)
  * Robot #2: `010058YUD18081602131` (Alpha Mini, Android 7.1.1 / MTK)
* **Vendor Serial Code:** `alpha-EAA003UBT10012560`
* **Active Wi-Fi IP (wlan0):** `145.3.127.104` (MAC: `fc:53:9e:c5:46:54`)
* **Subnet:** `145.3.0.0/16` (Eduroam / Local Network)
* **Battery Status:** 87%–95% charging over USB-C (4069 mV, 28.0°C)
* **Actuators:** 14 high-precision serial bus servos (clamped safe angles: -90° to +90°)
* **Display:** Dual circular eye IPS LCDs (driven by Android primary framebuffer at 720 × 1280)
* **Sensors:** CP2610 capacitive head-touch sensor, 3-axis accelerometer, 3-axis gyroscope, fall-detection module
* **Vision:** 13MP forehead camera (MediaTek camera subsystem)

---

## 2. Crucial Findings & Software Layers (Read Before Coding!)

### A. The "SRS Maatje" Kiosk Overlay Problem
Out of the box, the Dutch vendor installed `com.srs.robot_alpha_mini`.
* On boot, this app runs in fullscreen on Android's main display and renders a white configuration page:
  * `Current state: Idle`
  * `Current version: 1.29.0`
  * `[CONFIGURATIE]` button
* It attempts to connect to an external cloud MQTT broker (`broker.robotmaatje.nl`).
* **Why this broke commands earlier:** When this app is focused, it blocks the native UBTECH eye animations and absorbs touch events.
* **How to unblock the robot:**
  ```powershell
  # Disable the SRS vendor kiosk (non-destructive; re-enable anytime with 'enable')
  adb shell pm disable-user com.srs.robot_alpha_mini
  
  # Start the native UBTECH launcher
  adb shell am start -n com.ubtrobot.launcher/.MainActivity
  ```

### B. Display vs. Camera Trap
* The robot's primary Android screen is **720 × 1280 pixels**. These pixels are physically displayed on the two round eye lenses on the robot's head!
* Running `adb shell screencap -p` captures the **robot's eye displays**, NOT the 13MP forehead camera.
* To capture from the 13MP forehead camera, use `com.mediatek.camera` or query the `media.camera` service.

### C. The Two Command Control Paths
1. **Low-Level Android OS / Shell Path:**
   - Works directly over `adb shell`.
   - `dumpsys battery` gives instantaneous hardware power telemetry.
   - Pushing an image to `/sdcard/` and viewing it with `com.android.gallery3d` renders custom eyes or visuals directly on the physical face displays.
2. **Official UBTECH WebSocket IPC Bridge (`com.ubt.pccodemao`):**
   - The robot has an official background daemon: `com.ubt.pccodemao`.
   - It listens locally on **port 8800** and **port 8801** using `TooTallNate Java-WebSocket`.
   - Forward ports over ADB:
     ```powershell
     adb forward tcp:8800 tcp:8800
     adb forward tcp:8801 tcp:8801
     ```
   - Wire Protocol: **Base64-encoded Google Protocol Buffers (proto3)**.

### H. UvA / HvA LiteLLM Proxy & AI Multimodal Pipeline
The robot is equipped with full conversational AI, tool calling, and multimodal vision via the institutional LiteLLM proxy:
* **Gateway Endpoint:** `https://llmproxy.uva.nl/v1` (or `https://llmproxy.hva.nl/v1`)
* **Standard Models:** `gpt-4o-mini`, `gpt-4o`, `claude-sonnet-4.5`, `whisper-large-v3`
* **Tool Calling Capabilities:**
  - `move_robot`: walks forward, backward, turns left or right.
  - `play_gesture`: executes physical routines (wave greeting, dance, clap hands, bow, pushups).
  - `show_emotion`: sets eye LCD animations (e.g. `heart` for loving heart eyes, `happy`, `wink`).
  - `speak_text`: synthesizes natural Dutch speech via the robot's hardware speaker.
  - `inspect_camera_view`: sends live 13MP forehead frames to vision LLM for instant scene & object recognition.
* **Auto Face Tracking:** The camera feed uses real-time face centroid calculation to rotate the robot's head and body towards the user, locking on with friendly heart eyes (`codemao19`).

---

## 3. Reverse-Engineered WebSocket Protocol (`com.ubt.pccodemao`)

Every message sent to `ws://127.0.0.1:8800` or `ws://127.0.0.1:8801` is a **Base64 string followed strictly by an `&` delimiter character**:

> [!CRITICAL]
> **The `&` Delimiter Requirement:**  
> The robot's Java WebSocket receiver splits messages using the `&` character (`ConnectManager$10.onMessage`). Omitting the `&` suffix causes an immediate `IllegalArgumentException: bad base-64` exception in logcat and drops the command!

```protobuf
syntax = "proto3";
package com.ubtrobot.pccodemao.proto;

message Message {
  MessageHeader header = 1;
  bytes bodyData = 2;
}

message MessageHeader {
  string id = 1;       // Unique request UUID (e.g. "req_101")
  int32 target = 2;    // Target 0 (omitted in proto3 default)
  int32 command = 3;   // CmdId integer (see table below)
}
```

### Verified `CmdId` Mapping Table (from `com.ubtrobot.lancommunication.protocol.CmdId` & `alphamini` SDK)

> [!CRITICAL]
> **Programming Mode Activation (Cmd 16):**  
> Before executing custom commands, the client MUST send **Cmd 16 (`GET_ROBOT_VERSION_REQUEST`)**. This triggers `StartCodemaoRunningSkillListener`, which suspends the robot's autonomous `master.policy` idle behaviors. Without this, `master.policy` preempts actions and expressions after ~40ms!

| `CmdId` Value | Name | Description | Body Proto Payload |
| :--- | :--- | :--- | :--- |
| **`16`** | `GET_ROBOT_VERSION_REQUEST` | **Enter Programming Mode** (Suspends background policy) | Empty `{}` |
| **`21`** | `DISCONNECTION_REQUEST` | Exit Programming Mode | Empty `{}` |
| **`1`** | `PLAY_ACTION_REQUEST` | Trigger physical motion / choreography | `PlayActionRequest { string actionName = 1; }` |
| **`2`** | `MOVE_ROBOT_REQUEST` | Walk / take directional steps | `MoveRobotRequest { int32 direction = 1; int32 step = 2; }` (1=Left, 2=Right, 3=Fwd, 4=Back) |
| **`3`** | `STOP_ACTION_REQUEST` | **Emergency stop all motor movement** | Empty `{}` |
| **`20`** | `REVERT_ORIGIN_REQUEST` | **Reset posture & balance center of mass** | Empty `{}` |
| **`4`** | `PLAY_TTS_REQUEST` | Speak text via speech synthesizer | `ControlTTSRequest { string text = 1; int32 type = 2; }` |
| **`10`** | `PLAY_EXPRESSION_REQUEST` | Trigger eye animation (`codemao1`..`codemao20`) | `PlayExpressionRequest { string expressName = 1; int32 dirType = 2; }` (dirType=0) |
| **`11`** | `SET_MOUTH_LAMP_REQUEST` | Set mouth LED color and mode | `SetMouthLampRequest { int32 mode = 1; int32 color = 2; int32 duration = 3; int32 breathDuration = 4; }` |
| **`22`** | `SWITCH_MOUTH_LAMP_REQUEST`| Turn mouth LED ON / OFF | `ControlMouthRequest { bool isOpen = 1; }` |
| **`9`** | `TAKE_PICTURE_REQUEST` | Snap photo from 13MP forehead camera | `TakePictureRequest { int32 type = 1; }` (returns picPath without hijacking eye LCD) |
| **`14`** | `SUBSCRIBE_HEAD_RACKET_REQUEST` | **Subscribe to Capacitive Head Touch** | `ObserveHeadRacketRequest { bool isSubscribe = 1; }` |
| **`15`** | `CONTROL_BEHAVIOR_REQUEST` | Start/stop dance routines (`dance_0001`..`11`)| `ControlBehaviorRequest { string name = 1; int32 eventType = 2; }` |
| **`23`** | `PLAY_AUDIO_REQUEST` | **Play audio file on physical loudspeaker** | `PlayAudioRequest { CloudStorage cloud = 1; float volume = 2; }` (type: 3=preset, 4=custom) |
| **`24`** | `STOP_AUDIO_REQUEST` | Stop playing audio | Empty `{}` |
| **`28`** | `CHANGE_ROBOT_VOLUME_REQUEST`| **Set Robot Master Volume (0.0 to 100.0f)** | `ChangeRobotVolumeRequest { float volume = 1; }` |
| **`40`** | `GET_ROBOT_LANGUAGE_MODE_REQUEST`| Query active language model | Empty `{}` |
| **`41`** | `SET_ROBOT_LANGUAGE_REQUEST` | Set active language model | `SetLanguageRequest { string language = 1; }` |

### Fully Verified Physical Actions (`/system/files/actions/` & `/sdcard/customize/actions/`)
* **Locomotion & Posture:**
  * `stand_up`: Stand straight and lock balance
  * `standbysquat_001` / `zitten`: Crouch down / sit
  * `move_forward_avatar` / `023_1_1`: Step forward walking cycle
  * `022_1_1`: Step backward
  * `turn_left_avatar` / `026_1_1`: Turn left 45°
  * `turn_right_avatar` / `025_1_1`: Turn right 45°
* **Head & Expressive Gestures:**
  * `011_1_1` / `w_head_001`: Head nod yes
  * `037_1_1`: Head shake no
  * `038_1_1`: Head tilt puzzled
  * `say_hello_avatar` / `40_1_1`: Right arm wave greeting
  * `handshake_avatar` / `41_1_1`: Offer handshake
  * `bow_avatar` / `42_1_1`: Polite bow
  * `act_cute_avatar`: Cute head tilt and wiggle
  * `air_kiss_avatar`: Blow an air kiss
  * `hug_avatar`: Warm hug gesture
  * `012_1_1`: Push-up workout routine
  * `dance_0001en`: Dance choreography routine
  * `speakingAct1`..`speakingAct7`: Conversational speaking gestures
* **Dutch Maatje Care Routines (Custom `/sdcard/customize/actions/`):**
  * `klappen`: Clapping hands with enthusiasm
  * `fysio1` / `fysio2` / `fysio3`: Physical therapy guided exercises
  * `heupen`: Hip mobility exercise
  * `knikarm`: Arm flexion exercise
  * `scheet`: Humor fart sound and reaction
  * `hoofd_schouder`: Head-shoulders-knees-and-toes song & dance

### Fully Verified Eye Expressions (Official `codemao1`..`codemao20` Dictionary)
Extracted directly from `/system/files/expresss/codemao*.json` Lottie files:
* `codemao1`: "东张西望" (Looking around left and right / Curious)
* `codemao2`: "忧伤" (Sad / Melancholy)
* `codemao3`: "伸懒腰忧伤" (Yawning / stretching sad)
* `codemao4`: "入睡" (Falling asleep / Rest mode)
* `codemao5`: "受惊" (Startled / Alert)
* `codemao6`: "困" (Drowsy)
* `codemao7`: "奇怪" (Wondering / Inquisitive)
* `codemao8`: "惊讶" (Surprised / Astonished)
* `codemao9`: "sneeze" (Camera shutter blink / Sneezing)
* `codemao10`: "振奋" (Excited)
* `codemao11`: "斗志" (Determined)
* `codemao12`: "用力使劲" (Straining)
* `codemao13`: "疑问" (Puzzled / Questioning)
* `codemao14`: "苏醒" (Boot sequence / Waking up)
* `codemao15`: "苦恼" (Distressed)
* `codemao16`: "笑脸" (Smiling Happy Face - Neutral Idle)
* `codemao17`: "郁闷" (Gloomy)
* `codemao18`: "渴望" (Longing)
* `codemao19`: "爱心" (Heart Eyes / Loving / Head pat reaction)
* `codemao20`: "眨眼" (Playful Wink / Blinking)

### Mouth LED Hardware Light Controls (Cmd 11 & Cmd 22)
* **Command 11 (`SET_MOUTH_LAMP_REQUEST`)**:
  * `mode` (int32): `0` = NORMAL (solid constant light), `1` = BREATH (breathing pulse)
  * `color` (int32): `1` = RED, `2` = GREEN, `4` = WHITE
  * `duration` (int32): Duration in ms (e.g. `10000`)
  * `breathDuration` (int32): Duration of 1 breath cycle in ms (e.g. `1000`)
* **Command 22 (`SWITCH_MOUTH_LAMP_REQUEST`)**:
  * `isOpen` (int32 / bool): `1` = ON, `0` = OFF

### Forehead Camera (13MP) vs. Eye Display (720x1280)
* **13MP Forehead Camera Sensor (Command 9 `TAKE_PICTURE_REQUEST`)**:
  * Does NOT hijack the eye screen.
  * Robot announces "Ready 3, 2, 1", flashes shutter blink (`codemao9`), snaps high-res photo, and saves it to `/sdcard/ubtrobot/camera/YYYY-MM-DD_HHMMSS.jpg`.
  * Returns `picPath` in `TakePictureResponse` (proto body).
* **Eye LCD Screen Mirror (`screencap -p`)**:
  * Captures Android Display 0 (720 × 1280), which drives the physical round OLED/LCD eye modules.
  * Used solely to view what is displayed on the robot's physical face.

---

## 4. Setup Guide: Starting Fresh from Scratch

Follow these exact steps to connect and control the robot:

### Step 1: Physical Link & ADB
Connect the robot to your development PC via a USB-C data cable.
```powershell
# Verify ADB sees the Alpha Mini
& "C:\Users\joeyw\AppData\Local\Android\Sdk\platform-tools\adb.exe" devices -l
# Expected output:
# 010058YUD18082410124   device product:X100 model:Alpha_Mini device:X100
```

### Step 2: Forward Ports & Unlock Screen
```powershell
$ADB = "C:\Users\joeyw\AppData\Local\Android\Sdk\platform-tools\adb.exe"

# Forward the official UBTECH WebSocket bridge ports
& $ADB forward tcp:8800 tcp:8800
& $ADB forward tcp:8801 tcp:8801

# Disable the SRS vendor kiosk lock (if not already disabled)
& $ADB shell pm disable-user com.srs.robot_alpha_mini

# Wake up screen and launch native desktop
& $ADB shell input keyevent 26
& $ADB shell am start -n com.ubtrobot.launcher/.MainActivity
```

### Step 3: Verified TypeScript Control Snippet

The native TypeScript driver is located at `bridge/robotSocket.ts`. You can execute any physical motion or eye expression directly in Node/TS:

```typescript
import { robotSocket } from './bridge/robotSocket';

async function main() {
  await robotSocket.connect();
  
  // 1. Physical motion (wave greeting)
  await robotSocket.playAction('say_hello_avatar');
  
  // 2. Dual eye display animation
  await robotSocket.playExpression('001blink.gif');
}

main();
```

To run a quick single-command test:
```powershell
npx tsx -e "import { robotSocket } from './bridge/robotSocket'; (async () => { await robotSocket.connect(); await robotSocket.playAction('say_hello_avatar'); process.exit(0); })();"
```

### Audio Hardware Architecture & TTS Subsystem

1. **Volume Protobuf Convention (Critical Finding):**
   - Decompiled from `PcCodeMao.apk` (`CodeMao_ChangeRobotVolume.proto`): `ChangeRobotVolumeRequest { float volume = 1; }`.
   - The volume parameter is a **percentage float from 0.0 to 100.0**, NOT a normalized 0.0 to 1.0!
   - Sending `0.80f` results in Android integer rounding to 0 (`STREAM_MUSIC: Muted: true, Current: 0`). Sending `80.0f` correctly sets `STREAM_MUSIC: 12..15`.
   - Never call `service call audio 7` (which executes `setMasterMute(true)` on Android 7.x). Use `input keyevent 24` (Volume Up) to unmute if needed.

2. **ALSA Hardware Amplifier Switches (`tinymix`):**
   - MediaTek MT6739 audio amplifiers reset to `Off` on robot reboot / power cycle.
   - The bridge automatically enables them on daemon startup and after every reconnect:
     ```bash
     tinymix 'Speaker_Amp_Switch' 'On'
     tinymix 'Ext_Speaker_Amp_Switch' 'On'
     tinymix 'Audio_Amp_R_Switch' 'On'
     tinymix 'Audio_Amp_L_Switch' 'On'
     tinymix 5 '8Db'
     tinymix 6 '8Db'
     ```

3. **Dual TTS Audio Pipeline:**
   - **Primary**: Google TTS synthesizes high-quality Dutch/English MP3 audio -> saved locally -> pushed via ADB to `/sdcard/customize/music/custom_tts.mp3` -> played via native Cmd 23 `playAudio('custom_tts.mp3', 4, 100.0)`.
   - **Automatic Fallback**: If ADB USB connection is lost or offline, the bridge automatically falls back to native Command 4 `playTTS(text)` so speech never halts.

4. **Capacitive Head Touch Sensor (Cmd 14):**
   - Subscribed via Cmd 14 `ObserveHeadRacketRequest { isSubscribe: true }`.
   - Push events with `command: 14` or `command: 1014` are parsed directly from incoming WebSocket packets.
   - Fallback logcat monitor watches `touch_down_broadcast:I cp2610_dev:I`.
   - Triggers `codemao19` (heart eyes), spoken Dutch response, and broadcasts `HEAD_TOUCH` over WebSocket.

---

## 5. Routine Choreographer // Drag & Drop Action Sequencer

Located at `src/components/sequencer/ActionSequencerPanel.tsx` (types at `src/types/sequence.ts`).

* **Action Palette**: Movements (walk/turn), physical gestures (wave, dance, bow, klappen, fysio), spoken text (TTS), eye expressions, sound effects, and customizable wait pauses.
* **Choreography Timeline**:
  - Drag & drop reordering using native HTML5 DnD + Up/Down buttons.
  - Inline tuners for every step parameter (e.g. step count, text content, language, emotion).
  - Chronological step runner with live active step indicators (`#00D26A` pulsing border).
* **Dual Execution Modes**:
  - **`🎮 SIMULATIE (OFFLINE)`**: Full virtual choreography playback with Web Speech Synthesis through PC speakers. Works with robot disconnected.
  - **`🤖 LIVE ROBOT`**: Dispatches commands sequentially to the physical robot via `/api/command` and `/api/robot/*`.
* **Preset Routines**: Includes 4 instant presets (*Welkom & Introductie*, *Dans & Feestje*, *Fysio & Bewegen*, *Grappige Sketch*) and localStorage persistence.

---

## 6. Clean Repository Architecture

The codebase has been trimmed to strict production standards:

```text
/
├── bridge/                         # Hardware Bridge Daemon
│   ├── server.ts                   # HTTP + WebSocket tunnel (:8088)
│   └── skillRunner.ts              # Command Queue & Mutex locks for servo protection
├── prisma/
│   └── schema.prisma               # Database Schema (CommandLog, RobotSession, VisionEvent)
├── skills/
│   └── alpha_mini/                 # Modular Python Hardware Skills
│       ├── skill_connection.py     # ADB & Battery healthchecks
│       ├── skill_speech.py         # TTS & Volume
│       ├── skill_motion.py         # 14-Servo safety clamps & choreographies
│       ├── skill_expression.py     # Eye display animations & LED controls
│       └── skill_vision_sensors.py # Camera feed & Gyro/Fall/Touch telemetry
├── src/
│   ├── app/                        # Next.js App Router (Dashboard & REST API)
│   │   ├── api/robot/              # /motion, /speech, /expression, /vision, /telemetry
│   │   ├── api/hooks/ai-pipeline   # LLM / Vision AI Webhook
│   │   └── page.tsx                # Sleek dark-mode command center UI
│   ├── components/                 # UI Panels (Camera, Eyes, Servos, Audio, Telemetry)
│   ├── config/                     # strings.ts (zero hardcoding), theme.ts (design tokens)
│   ├── core/                       # Services, Repositories, Adapters
│   └── types/                      # Strict TypeScript types for robot hardware
└── CLAUDE.md                       # This master specification
```

---

## 7. How to Run the Production Stack

1. **Start the Local Hardware Bridge Daemon:**
   ```powershell
   npx tsx bridge/server.ts
   # Runs on http://localhost:8088 with WebSocket telemetry stream
   ```

2. **Start the Web Command Center:**
   ```powershell
   npm run dev
   # Opens Next.js Dashboard on http://localhost:3000
   ```

3. **Verify the Live Telemetry Endpoint:**
   ```powershell
   curl http://localhost:3000/api/robot/telemetry
   ```

