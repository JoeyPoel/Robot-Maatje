/**
 * Native Robot WebSocket Client for UBTECH Alpha Mini
 * Direct Protobuf WebSocket bridge to com.ubt.pccodemao on port 8800/8801.
 * Auto-activates Programming Mode (Command 16) to take full control from master policy.
 */

import WebSocket from 'ws';
import { execFile } from 'child_process';
import fs from 'fs';
import { EventEmitter } from 'events';

const ADB_PATH =
  process.env.ADB_PATH ||
  (fs.existsSync('C:\\Users\\joeyw\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe')
    ? 'C:\\Users\\joeyw\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe'
    : 'adb');

function encodeVarint(value: number): Buffer {
  const bytes: number[] = [];
  let bits = value & 0x7f;
  value >>>= 7;
  while (value > 0) {
    bytes.push(0x80 | bits);
    bits = value & 0x7f;
    value >>>= 7;
  }
  bytes.push(bits);
  return Buffer.from(bytes);
}

function encodeTag(fieldNumber: number, wireType: number): Buffer {
  return encodeVarint((fieldNumber << 3) | wireType);
}

function encodeString(fieldNumber: number, str: string): Buffer {
  const buf = Buffer.from(str, 'utf-8');
  return Buffer.concat([encodeTag(fieldNumber, 2), encodeVarint(buf.length), buf]);
}

function encodeBytes(fieldNumber: number, buf: Buffer): Buffer {
  return Buffer.concat([encodeTag(fieldNumber, 2), encodeVarint(buf.length), buf]);
}

function encodeInt(fieldNumber: number, val: number): Buffer {
  return Buffer.concat([encodeTag(fieldNumber, 0), encodeVarint(val)]);
}

function encodeFloat(fieldNumber: number, val: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeFloatLE(val, 0);
  return Buffer.concat([encodeTag(fieldNumber, 5), buf]);
}

/**
 * Builds the canonical Base64 + '&' delimited packet expected by com.ubt.pccodemao
 */
export function buildPacket(
  cmdId: number,
  bodyBytes: Buffer,
  reqId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
): string {
  // MessageHeader: 1: id (string), 3: command (int32). Target (0) is omitted (proto3 default)
  const header = Buffer.concat([
    encodeString(1, reqId),
    encodeInt(3, cmdId),
  ]);

  // Message: 1: header (bytes), 2: bodyData (bytes)
  const rootMsg = Buffer.concat([
    encodeBytes(1, header),
    encodeBytes(2, bodyBytes),
  ]);

  // Base64 + '&' delimiter
  return rootMsg.toString('base64') + '&';
}

const LEGACY_EMOTION_MAP: Record<string, string> = {
  '001_face.gif': 'codemao16',
  '001blink.gif': 'codemao20',
  '010_face.gif': 'codemao8',
  'sleepmode_001.gif': 'codemao4',
  'emo_029.gif': 'codemao5',
  'emo_007.gif': 'codemao1',
  'bootSuccess.gif': 'codemao14',
  '001_tapHead.gif': 'codemao19',
  'photograph_001.gif': 'codemao9',
  'happy': 'codemao16',
  'wink': 'codemao20',
  'surprised': 'codemao8',
  'sleepy': 'codemao4',
  'angry': 'codemao5',
  'curious': 'codemao1',
  'boot': 'codemao14',
  'tap_head': 'codemao19',
  'photograph': 'codemao9',
};

export function parsePacketHeader(buf: Buffer): { id?: string; command?: number } {
  try {
    let pos = 0;
    while (pos < buf.length) {
      const tag = buf[pos++];
      const fieldNum = tag >>> 3;
      const wireType = tag & 0x7;
      if (fieldNum === 1 && wireType === 2) {
        let len = 0;
        let shift = 0;
        while (pos < buf.length) {
          const b = buf[pos++];
          len |= (b & 0x7f) << shift;
          if (!(b & 0x80)) break;
          shift += 7;
        }
        const headerEnd = pos + len;
        let id: string | undefined;
        let command: number | undefined;
        while (pos < headerEnd && pos < buf.length) {
          const hTag = buf[pos++];
          const hField = hTag >>> 3;
          const hWire = hTag & 0x7;
          if (hField === 1 && hWire === 2) {
            let sLen = 0;
            let sShift = 0;
            while (pos < headerEnd) {
              const b = buf[pos++];
              sLen |= (b & 0x7f) << sShift;
              if (!(b & 0x80)) break;
              sShift += 7;
            }
            id = buf.subarray(pos, pos + sLen).toString('utf-8');
            pos += sLen;
          } else if (hField === 3 && hWire === 0) {
            let cmd = 0;
            let cShift = 0;
            while (pos < headerEnd) {
              const b = buf[pos++];
              cmd |= (b & 0x7f) << cShift;
              if (!(b & 0x80)) break;
              cShift += 7;
            }
            command = cmd;
          } else if (hWire === 0) {
            while (pos < headerEnd && (buf[pos++] & 0x80)) {}
          } else if (hWire === 2) {
            let skipLen = 0;
            let skipShift = 0;
            while (pos < headerEnd) {
              const b = buf[pos++];
              skipLen |= (b & 0x7f) << skipShift;
              if (!(b & 0x80)) break;
              skipShift += 7;
            }
            pos += skipLen;
          } else if (hWire === 5) {
            pos += 4;
          } else if (hWire === 1) {
            pos += 8;
          }
        }
        return { id, command };
      }
    }
  } catch {}
  return {};
}

export class RobotSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private pendingResolvers = new Map<string, (res: any) => void>();
  private activePort: number = 8800;
  private isConnecting = false;
  private isProgramMode = false;

  constructor() {
    super();
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.isConnecting) return;

    this.isConnecting = true;

    // Ensure ADB port forward is always active
    await new Promise<void>((resolve) => {
      execFile(ADB_PATH, ['forward', 'tcp:8800', 'tcp:8800'], () => resolve());
    });

    // Strictly connect to Port 8800 (com.ubt.pccodemao RobotWebSocketServer)
    // Note: Port 8801 is PyWebSocketServer (pip installer) and must NOT be used for robot commands.
    let connected = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.tryConnectPort(8800, 2000);
        this.activePort = 8800;
        connected = true;
        console.log(`[RobotSocket] Successfully established link on port 8800 (attempt ${attempt})`);
        break;
      } catch (err: any) {
        console.log(`[RobotSocket] Port 8800 attempt ${attempt}/3 failed: ${err.message}`);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    this.isConnecting = false;
    if (!connected) {
      throw new Error('Unable to connect to robot daemon on port 8800');
    }

    // Immediately put robot in programming mode to preempt autonomous idle blinks
    try {
      await this.enterProgram();
    } catch (e: any) {
      console.warn('[RobotSocket] enterProgram non-critical error:', e.message);
    }

    // Subscribe to capacitive head touch events (Cmd 14)
    try {
      await this.subscribeHeadTouch(true);
      console.log('[RobotSocket] Subscribed to native head touch events (Cmd 14)');
    } catch (e: any) {
      console.warn('[RobotSocket] subscribeHeadTouch non-critical error:', e.message);
    }
  }

  private tryConnectPort(port: number, timeoutMs = 2000): Promise<void> {
    return new Promise((resolve, reject) => {
      let resolved = false;
      const ws = new WebSocket(`ws://127.0.0.1:${port}`);

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try { ws.close(); } catch {}
          reject(new Error(`Timeout connecting to port ${port}`));
        }
      }, timeoutMs);

      ws.on('open', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          this.ws = ws;
          this.attachListeners(ws, port);
          resolve();
        }
      });

      ws.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          reject(err);
        }
      });
    });
  }

  private attachListeners(ws: WebSocket, port: number) {
    ws.on('message', (data: WebSocket.Data) => {
      const str = data.toString();
      try {
        const raw = str.endsWith('&') ? str.slice(0, -1) : str;
        const buf = Buffer.from(raw, 'base64');
        const header = parsePacketHeader(buf);

        // Check for unsolicited push events (Command 14 or 1014: Head Tap / Pat)
        if (header.command === 14 || header.command === 1014) {
          console.log('[RobotSocket] Native Head Tap Event Detected (Cmd 14)!');
          this.emit('headTouch', { timestamp: Date.now() });
        }

        if (header.id && this.pendingResolvers.has(header.id)) {
          const cb = this.pendingResolvers.get(header.id);
          this.pendingResolvers.delete(header.id);
          if (cb) cb(str);
          return;
        }
      } catch (err: any) {
        console.warn('[RobotSocket] Error parsing incoming packet:', err.message);
      }

      const firstKey = this.pendingResolvers.keys().next().value;
      if (firstKey) {
        const cb = this.pendingResolvers.get(firstKey);
        this.pendingResolvers.delete(firstKey);
        if (cb) cb(str);
      }
    });

    ws.on('error', (err) => {
      console.error(`[RobotSocket] Connection error on port ${port}:`, err.message);
    });

    ws.on('close', () => {
      console.log(`[RobotSocket] Port ${port} connection closed`);
      this.ws = null;
      this.isProgramMode = false;
      for (const [id, cb] of this.pendingResolvers) {
        cb({ success: false, error: 'Socket closed' });
      }
      this.pendingResolvers.clear();
    });
  }

  public async sendCommand(cmdId: number, bodyBytes: Buffer, timeoutMs = 2000): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      try {
        await this.connect();
      } catch (err: any) {
        return { success: false, error: `Connection failed: ${err.message}` };
      }
    }

    const reqId = `req_${Date.now()}`;
    const packet = buildPacket(cmdId, bodyBytes, reqId);

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pendingResolvers.delete(reqId);
        resolve({ success: true, dispatched: true });
      }, timeoutMs);

      this.pendingResolvers.set(reqId, (reply) => {
        clearTimeout(timer);
        resolve({ success: true, reply });
      });

      try {
        this.ws?.send(packet);
      } catch (err: any) {
        clearTimeout(timer);
        this.pendingResolvers.delete(reqId);
        resolve({ success: false, error: err.message });
      }
    });
  }

  /**
   * Command 16: Enter programming mode (StartRunProgram)
   * Prevents autonomous master policy from interrupting custom actions
   */
  public async enterProgram() {
    console.log('[RobotSocket] Entering programming mode (Cmd 16)...');
    const res = await this.sendCommand(16, Buffer.alloc(0), 1500);
    this.isProgramMode = true;
    return res;
  }

  /**
   * Command 21: Exit programming mode
   */
  public async exitProgram() {
    this.isProgramMode = false;
    return this.sendCommand(21, Buffer.alloc(0), 1000);
  }

  /**
   * Command 1: Execute built-in motion
   */
  public async playAction(actionName: string) {
    if (!this.isProgramMode) await this.enterProgram();
    const body = encodeString(1, actionName);
    return this.sendCommand(1, body, 2500);
  }

  /**
   * Command 2: Walk robot (1=left, 2=right, 3=forward, 4=backward)
   */
  public async moveRobot(direction: number, step = 1) {
    if (!this.isProgramMode) await this.enterProgram();
    const body = Buffer.concat([encodeInt(1, direction), encodeInt(2, step)]);
    return this.sendCommand(2, body, 2500);
  }

  /**
   * Command 3: Stop all motion immediately
   */
  public async stopAction() {
    return this.sendCommand(3, Buffer.alloc(0), 1000);
  }

  /**
   * Command 20: Revert posture to origin neutral center of mass
   */
  public async revertOrigin() {
    return this.sendCommand(20, Buffer.alloc(0), 1000);
  }

  /**
   * Full Emergency Reset / Cancel Button:
   * 1. Stops running motor actions (Cmd 3)
   * 2. Reverts balance/posture to origin (Cmd 20)
   * 3. Re-enters programming mode (Cmd 16)
   * 4. Plays stand_up routine to lock knee/hip balance
   * 5. Sets eyes to happy idle (codemao7)
   */
  public async cancelAll() {
    console.log('[RobotSocket] EXECUTING CANCEL ALL & BALANCE RECOVERY...');
    await this.stopAction();
    await this.revertOrigin();
    await this.enterProgram();
    await this.playAction('stand_up');
    await this.playExpression('codemao16');
    return { success: true, status: 'CANCELLED_AND_BALANCED' };
  }

  /**
   * Command 4: TTS speak
   */
  public async playTTS(text: string) {
    if (!this.isProgramMode) await this.enterProgram();
    const body = Buffer.concat([encodeString(1, text), encodeInt(2, 1)]);
    return this.sendCommand(4, body, 2500);
  }

  /**
   * Command 28: Set Robot Master Volume
   * Protobuf ChangeRobotVolumeRequest expects float volume percentage (0.0 to 100.0)
   */
  public async setVolume(volume: number) {
    const floatVal = Math.max(0.0, Math.min(100.0, volume));
    return this.sendCommand(28, encodeFloat(1, floatVal));
  }

  /**
   * Command 23: Play Audio file on robot physical loudspeaker
   * fileName: e.g. 'custom_tts.mp3' or 'horn.mp3'
   * storageType: 3 = PRESET_LOCAL (/system/files/music/), 4 = CUSTOMIZE_LOCAL (/sdcard/customize/music/)
   * volume: float percentage (0.0 to 100.0)
   */
  public async playAudio(fileName: string, storageType = 4, volume = 100.0): Promise<any> {
    if (!this.isProgramMode) await this.enterProgram();
    // CloudStorage: 1: url, 2: type
    const cloud = Buffer.concat([
      encodeString(1, fileName),
      encodeInt(2, storageType),
    ]);
    const vol = volume <= 1.0 ? volume * 100.0 : volume;
    const volBuf = Buffer.alloc(4);
    volBuf.writeFloatLE(Math.max(0.0, Math.min(100.0, vol)), 0);
    const body = Buffer.concat([
      encodeBytes(1, cloud),
      encodeTag(2, 5),
      volBuf,
    ]);
    return this.sendCommand(23, body, 5000);
  }

  /**
   * Command 14: Subscribe to Patting Head / Head Touch Event
   * Returns continuous events when user taps capacitive head sensor
   */
  public async subscribeHeadTouch(subscribe = true) {
    // tag 1 (isSubscribe), wire type 0 (varint)
    const body = Buffer.concat([encodeTag(1, 0), encodeVarint(subscribe ? 1 : 0)]);
    return this.sendCommand(14, body, 2000);
  }

  /**
   * Command 40: Get Robot Language Model
   */
  public async getRobotLanguage() {
    return this.sendCommand(40, Buffer.alloc(0), 2000);
  }

  /**
   * Command 41: Set Robot Language
   */
  public async setRobotLanguage(language: string) {
    const body = encodeString(1, language);
    return this.sendCommand(41, body, 4000);
  }

  /**
   * Command 9: Take 13MP photo using forehead camera sensor
   * Robot executes snapshot sequence, saves JPEG to /sdcard/ubtrobot/camera/ and returns picPath
   */
  public async takePicture(type = 0): Promise<any> {
    if (!this.isProgramMode) await this.enterProgram();
    const body = encodeInt(1, type);
    return this.sendCommand(9, body, 8000);
  }

  /**
   * Command 10: Eye expression (codemao1..codemao20 or w_basic_*)
   */
  public async playExpression(expressName: string) {
    if (!this.isProgramMode) await this.enterProgram();
    const resolvedName = LEGACY_EMOTION_MAP[expressName] || expressName;
    const body = Buffer.concat([encodeString(1, resolvedName), encodeInt(2, 0)]);
    return this.sendCommand(10, body, 1500);
  }

  /**
   * Command 11: Set Mouth LED
   * color: 1=RED, 2=GREEN, 4=WHITE
   * mode: 0=NORMAL (solid), 1=BREATH
   */
  public async setMouthLamp(color = 2, mode = 0, duration = 2000, breathDuration = 1000) {
    if (!this.isProgramMode) await this.enterProgram();
    const body = Buffer.concat([
      encodeInt(1, mode),
      encodeInt(2, color),
      encodeInt(3, duration),
      encodeInt(4, breathDuration),
    ]);
    return this.sendCommand(11, body, 1500);
  }

  /**
   * Command 22: Switch Mouth Lamp ON/OFF
   */
  public async controlMouthLamp(isOpen: boolean) {
    if (!this.isProgramMode) await this.enterProgram();
    const body = encodeInt(1, isOpen ? 1 : 0);
    return this.sendCommand(22, body, 1000);
  }
}

export const robotSocket = new RobotSocketClient();
