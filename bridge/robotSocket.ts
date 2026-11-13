/**
 * Native Robot WebSocket Client for UBTECH Alpha Mini
 * Direct Protobuf WebSocket bridge to com.ubt.pccodemao on port 8800/8801.
 * Auto-activates Programming Mode (Command 16) to take full control from master policy.
 */

import WebSocket from 'ws';
import { execFile } from 'child_process';
import fs from 'fs';

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

/**
 * Builds the canonical Base64 + '&' delimited packet expected by com.ubt.pccodemao
 */
export function buildPacket(cmdId: number, bodyBytes: Buffer, reqId = `req_${Date.now()}`): string {
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

export class RobotSocketClient {
  private ws: WebSocket | null = null;
  private pendingResolvers = new Map<string, (res: any) => void>();
  private activePort: number = 8800;
  private isConnecting = false;
  private isProgramMode = false;

  public async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.isConnecting) return;

    this.isConnecting = true;

    // Try primary port 8800, fallback to 8801
    const ports = [8800, 8801];
    let connected = false;

    for (const port of ports) {
      try {
        await this.tryConnectPort(port, 2000);
        this.activePort = port;
        connected = true;
        console.log(`[RobotSocket] Successfully established link on port ${port}`);
        break;
      } catch (err: any) {
        console.log(`[RobotSocket] Port ${port} not reachable (${err.message}), trying alternative...`);
      }
    }

    this.isConnecting = false;
    if (!connected) {
      throw new Error('Unable to connect to robot daemon on ports 8800 or 8801');
    }

    // Immediately put robot in programming mode to preempt autonomous idle blinks
    try {
      await this.enterProgram();
    } catch (e: any) {
      console.warn('[RobotSocket] enterProgram non-critical error:', e.message);
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

  public async setVolume(volume: number) {
    const level = Math.max(0, Math.min(100, Math.trunc(volume)));
    return this.sendCommand(28, encodeInt(1, level));
  }

  /**
   * Command 23: Play Audio file on robot physical loudspeaker
   * fileName: e.g. 'custom_tts.mp3' or 'BCM_happy.mp3'
   * storageType: 3 = PRESET_LOCAL, 4 = CUSTOMIZE_LOCAL
   */
  public async playAudio(fileName: string, storageType = 4, volume = 1.0): Promise<any> {
    if (!this.isProgramMode) await this.enterProgram();
    // CloudStorage: 1: url, 2: type
    const cloud = Buffer.concat([
      encodeString(1, fileName),
      encodeInt(2, storageType),
    ]);
    const volBuf = Buffer.alloc(4);
    volBuf.writeFloatLE(Math.max(0.0, Math.min(1.0, volume)), 0);
    const body = Buffer.concat([
      encodeBytes(1, cloud),
      encodeTag(2, 5),
      volBuf,
    ]);
    return this.sendCommand(23, body, 4000);
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
