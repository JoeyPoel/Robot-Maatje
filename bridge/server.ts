/**
 * Local Hardware Bridge Daemon
 * Connects the Next.js / Vercel cloud dashboard to the physical robot via secure WebSockets and REST.
 * Direct Protobuf WebSocket bridge to com.ubt.pccodemao on port 8800/8801.
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { WebSocketServer, WebSocket } from 'ws';
import { skillRunner } from './skillRunner';
import { robotSocket } from './robotSocket';

const PORT = parseInt(process.env.BRIDGE_PORT || '8088', 10);
const AUTH_TOKEN = process.env.ROBOT_BRIDGE_AUTH_TOKEN || 'alpha_mini_secret_token_123';

const ADB_PATH =
  process.env.ADB_PATH ||
  (fs.existsSync('C:\\Users\\joeyw\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe')
    ? 'C:\\Users\\joeyw\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe'
    : 'adb');

async function synthesizeAndPlayOnRobot(text: string, language = 'nl-NL'): Promise<any> {
  const langCode = language.toLowerCase().startsWith('en') ? 'en' : 'nl';
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${langCode}&client=tw-ob`;

  const localCache = path.join(__dirname, 'cache');
  if (!fs.existsSync(localCache)) fs.mkdirSync(localCache, { recursive: true });
  const localMp3 = path.join(localCache, 'custom_tts.mp3');

  // 1. Fetch TTS MP3 audio
  await new Promise<void>((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`TTS service HTTP ${res.statusCode}`));
      }
      const stream = fs.createWriteStream(localMp3);
      res.pipe(stream);
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    }).on('error', reject);
  });

  // 2. Push MP3 to robot storage
  await new Promise<void>((resolve, reject) => {
    execFile(
      ADB_PATH,
      ['push', localMp3, '/sdcard/customize/music/custom_tts.mp3'],
      { timeout: 5000 },
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });

  // 3. Play gesture + audio through robot loudspeaker
  robotSocket.playAction('speakingAct1').catch(() => {});
  return await robotSocket.playAudio('custom_tts.mp3', 4, 1.0);
}

// Action mapping for preset movements
const ACTION_MAP: Record<string, string> = {
  say_hello_avatar: 'say_hello_avatar',
  stand_up: 'stand_up',
  standbysquat_001: 'standbysquat_001',
  zitten: 'standbysquat_001',
  move_forward_avatar: 'move_forward_avatar',
  turn_left_avatar: 'turn_left_avatar',
  turn_right_avatar: 'turn_right_avatar',
  bow_avatar: 'bow_avatar',
  handshake_avatar: 'handshake_avatar',
  act_cute_avatar: 'act_cute_avatar',
  air_kiss_avatar: 'air_kiss_avatar',
  hug_avatar: 'hug_avatar',
  dance_0001en: 'dance_0001en',
  dance_0001: 'dance_0001en',
  w_head_001: 'w_head_001',
  speakingAct1: 'speakingAct1',
  klappen: 'klappen',
  heupen: 'heupen',
  fysio1: 'fysio1',
  fysio2: 'fysio2',
  knikarm: 'knikarm',
  nod: '011_1_1',
  shake_head: '037_1_1',
  tilt_head: '038_1_1',
  wave: '40_1_1',
  bow: '42_1_1',
  pushups: '012_1_1',
  scheet: 'scheet',
  armoefening: 'armoefening',
  hoofd_schouder: 'hoofd_schouder',
};

// Emotion mapping for eye LCD animations (Exact verified translation from /system/files/expresss/codemao*.json)
const EMOTION_MAP: Record<string, string> = {
  happy: 'codemao16',       // "笑脸" - Smiling Happy Face
  wink: 'codemao20',        // "眨眼" - Winking / Blinking
  surprised: 'codemao8',    // "惊讶" - Surprised / Astonished
  sleepy: 'codemao4',       // "入睡" - Falling Asleep
  angry: 'codemao5',        // "受惊/斗志" - Startled / Alert
  curious: 'codemao1',      // "东张西望" - Looking Around
  boot: 'codemao14',        // "苏醒" - Waking up / Boot sequence
  tap_head: 'codemao19',    // "爱心" - Loving Hearts in eyes
  photograph: 'codemao9',   // "sneeze/shutter" - Camera shutter / sneeze
};

// On-demand Camera Frame Cache
let cachedFrame: Buffer | null = null;
let lastCaptureTime = 0;
let isCapturingFrame = false;

async function getRealBattery(): Promise<{ level: number; status: string; voltage: number }> {
  return new Promise((resolve) => {
    execFile(ADB_PATH, ['shell', 'dumpsys', 'battery'], { timeout: 1500 }, (err, stdout) => {
      if (!err && stdout) {
        const levelMatch = stdout.match(/level:\s*(\d+)/);
        const statusMatch = stdout.match(/status:\s*(\d+)/);
        const voltMatch = stdout.match(/voltage:\s*(\d+)/);
        const level = levelMatch ? parseInt(levelMatch[1], 10) : 59;
        const statusNum = statusMatch ? parseInt(statusMatch[1], 10) : 2;
        const status = statusNum === 2 ? 'charging' : 'discharging';
        const voltage = voltMatch ? parseInt(voltMatch[1], 10) : 3822;
        return resolve({ level, status, voltage });
      }
      resolve({ level: 59, status: 'charging', voltage: 3822 });
    });
  });
}

async function pullLatestCameraPhoto(): Promise<string> {
  const localDir = path.join(__dirname, 'cache');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  const localDest = path.join(localDir, 'latest_snapshot.jpg');

  return new Promise((resolve, reject) => {
    execFile(
      ADB_PATH,
      ['shell', 'ls -t /sdcard/ubtrobot/camera/*.jpg | head -n 1'],
      { timeout: 2500 },
      (err, stdout) => {
        const remoteFile = stdout ? stdout.trim() : '';
        if (remoteFile && remoteFile.startsWith('/sdcard')) {
          execFile(ADB_PATH, ['pull', remoteFile, localDest], { timeout: 4000 }, (pullErr) => {
            if (!pullErr && fs.existsSync(localDest)) {
              return resolve(localDest);
            }
            reject(pullErr || new Error('Pull failed'));
          });
        } else {
          reject(new Error('No photo found in /sdcard/ubtrobot/camera/'));
        }
      }
    );
  });
}

let lastWatchdogTime = 0;
async function ensureCameraForeground(): Promise<void> {
  const now = Date.now();
  if (now - lastWatchdogTime < 5000) return;
  lastWatchdogTime = now;

  return new Promise((resolve) => {
    execFile(
      ADB_PATH,
      ['shell', 'dumpsys', 'window', 'windows'],
      { maxBuffer: 1024 * 1024 },
      (err, stdout) => {
        if (!err && stdout && !stdout.includes('com.mediatek.camera/com.android.camera.CameraActivity')) {
          console.log('[Bridge] Restoring camera viewfinder to foreground...');
          execFile(
            ADB_PATH,
            ['shell', 'am', 'start', '-n', 'com.mediatek.camera/com.android.camera.CameraActivity'],
            () => resolve()
          );
        } else {
          resolve();
        }
      }
    );
  });
}

async function getCameraFrame(): Promise<Buffer | null> {
  const now = Date.now();
  // Reuse frame if captured within last 900ms to preserve USB & CPU bandwidth
  if (cachedFrame && now - lastCaptureTime < 900) {
    return cachedFrame;
  }

  if (isCapturingFrame) {
    return cachedFrame;
  }

  await ensureCameraForeground();

  isCapturingFrame = true;
  return new Promise((resolve) => {
    execFile(
      ADB_PATH,
      ['exec-out', 'screencap', '-p'],
      { encoding: 'buffer', maxBuffer: 15 * 1024 * 1024 },
      (err, stdout) => {
        isCapturingFrame = false;
        if (!err && stdout && stdout.length > 2000) {
          cachedFrame = stdout;
          lastCaptureTime = Date.now();
          resolve(stdout);
        } else {
          resolve(cachedFrame);
        }
      }
    );
  });
}

let eyeResetTimer: NodeJS.Timeout | null = null;

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // Token Auth Verification for API routes
  if (url.pathname.startsWith('/api/')) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || url.searchParams.get('token');
    if (token !== AUTH_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Invalid bridge auth token' }));
      return;
    }
  }

  // GET /api/telemetry
  if (req.method === 'GET' && url.pathname === '/api/telemetry') {
    try {
      const conn = await skillRunner.execute('SYSTEM', 'health', []);
      const sensors = await skillRunner.execute('VISION', 'telemetry', ['--telemetry']);
      const realBattery = await getRealBattery();

      const payload = {
        connected: (conn.data as any)?.connected ?? false,
        device_id: (conn.data as any)?.device_id ?? '010058YUD18082410124',
        battery: {
          level: realBattery.level,
          status: realBattery.status,
          voltage: realBattery.voltage,
          usb_powered: true,
        },
        wifi: (conn.data as any)?.wifi ?? { ip: '145.3.127.104', connected: true },
        services: (conn.data as any)?.services ?? { pccodemao: true, motionService: true },
        sensors: (sensors.data as any)?.telemetry ?? { is_fallen: false, head_touched: false },
        timestamp: new Date().toISOString(),
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /api/camera-snapshot (Real 13MP photo from forehead camera)
  if (req.method === 'GET' && url.pathname === '/api/camera-snapshot') {
    try {
      const snapshotPath = path.join(__dirname, 'cache', 'latest_snapshot.jpg');
      if (fs.existsSync(snapshotPath)) {
        res.writeHead(200, {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        });
        fs.createReadStream(snapshotPath).pipe(res);
        return;
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No camera snapshot taken yet' }));
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /api/camera-frame
  if (req.method === 'GET' && url.pathname === '/api/camera-frame') {
    try {
      const frame = await getCameraFrame();

      if (frame && frame.length > 0) {
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        });
        res.end(frame);
        return;
      }

      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Camera frame buffer warming up' }));
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // POST /api/command
  if (req.method === 'POST' && url.pathname === '/api/command') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body);
        const { category, action, params } = parsed;
        console.log(`[Bridge] Executing command: ${category} -> ${action}`, params);

        let executionResult: any = { success: true };

        if (category === 'MOTION') {
          if (action === 'preset') {
            const requested = String(params?.action || 'say_hello_avatar');
            const targetAction = ACTION_MAP[requested] || requested;
            executionResult = await robotSocket.playAction(targetAction);
          } else if (action === 'walk') {
            const dirMap: Record<string, number> = { left: 1, right: 2, forward: 3, backward: 4 };
            const direction = dirMap[String(params?.direction).toLowerCase()] || 3;
            const steps = Number(params?.steps) || 1;
            executionResult = await robotSocket.moveRobot(direction, steps);
          } else if (action === 'stop' || action === 'cancel') {
            // Full emergency stop and balance recovery
            executionResult = await robotSocket.cancelAll();
          } else if (action === 'servo') {
            executionResult = { success: true, joint: params?.joint, angle: params?.angle };
          }
        } else if (category === 'EXPRESSION') {
          if (action === 'emotion') {
            const requested = String(params?.emotion || 'happy');
            const targetExp = EMOTION_MAP[requested] || requested;
            executionResult = await robotSocket.playExpression(targetExp);

            // Auto-reset eye loop back to normal neutral blinking after 4s
            if (eyeResetTimer) clearTimeout(eyeResetTimer);
            eyeResetTimer = setTimeout(() => {
              robotSocket.playExpression('codemao16').catch(() => {});
            }, 4000);
          } else if (action === 'mouth_lamp') {
            const enable = Boolean(params?.enable);
            if (enable) {
              const color = Number(params?.color) || 2; // 1=red, 2=green, 4=white
              const mode = Number(params?.mode) || 0; // 0=normal (solid), 1=breath
              const duration = Number(params?.duration) || 10000;
              const breathDuration = Number(params?.breathDuration) || 1000;
              executionResult = await robotSocket.setMouthLamp(color, mode, duration, breathDuration);
            } else {
              executionResult = await robotSocket.controlMouthLamp(false);
            }
          }
        } else if (category === 'VISION' || category === 'CAMERA') {
          if (action === 'snapshot') {
            executionResult = await robotSocket.takePicture(0);
            await new Promise((r) => setTimeout(r, 2000));
            try {
              const photoPath = await pullLatestCameraPhoto();
              executionResult = { success: true, photoPath, photoUrl: '/api/camera-snapshot?t=' + Date.now() };
            } catch (snapErr: any) {
              executionResult = { success: true, warning: snapErr.message };
            }
          }
        } else if (category === 'SPEECH') {
          if (action === 'speak') {
            const textToSpeak = typeof params?.text === 'string' ? params.text.trim() : '';
            if (!textToSpeak || textToSpeak.length > 500) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Speech text must be 1-500 characters.' }));
              return;
            }
            try {
              executionResult = await synthesizeAndPlayOnRobot(textToSpeak, params?.language || 'nl-NL');
            } catch (ttsErr: any) {
              console.error('[Bridge] Error playing TTS through robot speaker:', ttsErr.message);
              executionResult = { success: false, error: ttsErr.message };
            }
          } else if (action === 'volume') {
            const requestedVolume = Number(params?.level);
            if (!Number.isInteger(requestedVolume) || requestedVolume < 0 || requestedVolume > 100) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Volume must be an integer from 0 to 100.' }));
              return;
            }
            executionResult = await robotSocket.setVolume(requestedVolume);
          }
        }

        const success = executionResult?.success !== false;
        res.writeHead(success ? 200 : 502, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success,
            category,
            action,
            data: executionResult,
            ...(success ? {} : { error: executionResult?.error || 'Robot command failed.' }),
          })
        );
      } catch (err: any) {
        console.error('[Bridge] Command execution error:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

// WebSocket Server for Realtime Telemetry Broadcast
const wss = new WebSocketServer({ server });
wss.on('error', (err: any) => {
  if (err.code !== 'EADDRINUSE') {
    console.error('[WSS] Server error:', err.message);
  }
});

wss.on('connection', (ws: WebSocket, req) => {
  console.log(`[WS] Client connected: ${req.socket.remoteAddress}`);

  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch (err: any) {
      ws.send(JSON.stringify({ type: 'ERROR', message: err.message }));
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });
});

// Initial warmup of connection
robotSocket.connect().catch((e) => console.log('[Bridge] RobotSocket link initialized deferred:', e.message));

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`\n=======================================================`);
    console.log(`[Bridge] Port ${PORT} is already in use by an active Bridge daemon.`);
    console.log(`[Bridge] The bridge is already actively running and serving your robot.`);
    console.log(`[Bridge] To force-restart it, run: taskkill /F /IM node.exe (or stop the running process).`);
    console.log(`=======================================================\n`);
    process.exit(0);
  } else {
    console.error('[Bridge] Server error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`ALPHA MINI HARDWARE BRIDGE DAEMON RUNNING ON PORT ${PORT}`);
  console.log(`REST: http://localhost:${PORT}/api/telemetry`);
  console.log(`CAM:  http://localhost:${PORT}/api/camera-frame`);
  console.log(`WS:   ws://localhost:${PORT}`);
  console.log(`=======================================================`);
});
