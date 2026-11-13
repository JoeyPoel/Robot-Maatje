# 🤖 Robot Maatje // UBTECH Alpha Mini Command Center

Een productie-rijp, full-stack Command Center en modulaire AI-architectuur voor de fysieke **UBTECH Alpha Mini** robot (in Nederland geleverd als *Robot Maatje* / *Zorgrobot Robin*). 

Gebouwd met **Next.js (App Router)**, **TypeScript (Strict Mode)**, **Prisma ORM**, en een lokale hardware-bridge daemon met WebSocket-streaming en concurrency safety locks.

---

## 🏛️ Architectuur Overzicht

```text
┌─────────────────────────────────────────────────────────────────┐
│                       Vercel Cloud Deployment                   │
│   Next.js 14 (App Router) + Prisma + Dark Mode Dashboard        │
│                                                                 │
│   - API Controllers (Zod Validatie)                             │
│   - Domain Services (Motion, Speech, Expression, Vision, AI)    │
│   - Repositories (PostgreSQL via Supabase / Neon)               │
│   - AI Webhook Pipeline (/api/hooks/ai-pipeline)                │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                   HTTPS / WSS Tunnel (Bearer Auth)
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│               Lokale Hardware Bridge Daemon (/bridge)           │
│   Node.js + WebSockets (:8088) + Command Queue & Mutex Locks    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                   ADB / TCP / IPC Directe Hardware Sockets
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│            UBTECH Alpha Mini Robot (Android 7.0 / MTK)          │
│   - 14 Servos Kinematics          - 13MP Forehead Camera        │
│   - Dual Eye LCD Displays         - 4-Microphone SSL Array      │
│   - Gyro / Accelerometer / Val    - Hoofd Touch Sensor (CP2610) │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Snelle Start

### 1. Vereisten
- Node.js v18+ of v22+
- Python 3.10+
- Android SDK Platform-Tools (`adb`)
- Fysieke Alpha Mini aangesloten via USB (of verbonden via hetzelfde Wi-Fi netwerk)

### 2. Installatie
```bash
git clone https://github.com/JoeyPoel/Robot-Maatje.git
cd Robot-Maatje
npm install
```

### 3. Omgevingsvariabelen (`.env`)
Kopieer `.env.example` naar `.env` en configureer je instellingen:
```env
NEXT_PUBLIC_APP_NAME="Alpha Mini Command Center"
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Lokale Hardware Bridge
ROBOT_BRIDGE_WS_URL="ws://localhost:8088"
ROBOT_BRIDGE_HTTP_URL="http://localhost:8088"
ROBOT_BRIDGE_AUTH_TOKEN="alpha_mini_secret_token_123"

# Database (PostgreSQL / Supabase / Neon)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/robot_maatje?schema=public"

# AI Webhook Hooks (Optioneel)
AI_PIPELINE_WEBHOOK_URL="http://localhost:8000/api/ai/events"
```

### 4. Database Setup (Prisma)
Genereer de client en synchroniseer het databaseschema:
```bash
npx prisma generate
npx prisma db push
```

### 5. Start de Lokale Hardware Bridge Daemon
Start de daemon die rechtstreeks communiceert met de robot via ADB en de Python-skills:
```bash
npm run bridge
```
*De bridge start op `http://localhost:8088` en streamt live telemetrie over WebSocket.*

### 6. Spraak inschakelen
Verbind de robot via USB, controleer dat ADB hem ziet en forward de officiële UBTECH-spraakbridge:
```powershell
adb devices
adb forward tcp:8800 tcp:8800
adb forward tcp:8801 tcp:8801
```

Als de SRS-configuratie-app het scherm overneemt, kun je die handmatig uitschakelen en de native launcher starten:
```powershell
adb shell pm disable-user com.srs.robot_alpha_mini
adb shell am start -n com.ubtrobot.launcher/.MainActivity
```

Start daarna `npm run bridge` en de webapplicatie. Gebruik het paneel **Speech & Audio** om een zin te versturen. De TTS-opdracht is asynchroon: de interface meldt dat de opdracht naar de bridge is verstuurd, niet dat spraak fysiek hoorbaar was. De huidige UBTECH TTS-protobuf bevat geen taalveld; de stemtaal moet daarom in de Android TTS-instellingen van de robot worden ingesteld.

### 7. Start de Web Applicatie
Open in een tweede terminal:
```bash
npm run dev
```
Navigeer naar `http://localhost:3000` om het Command Center te openen.

---

## 📦 Modulaire Hardware Skills (`/skills/alpha_mini/`)

Elke fysieke functionaliteit is geïsoleerd als een zelfstandige, herbruikbare Python skill met CLI-ondersteuning en een `--test` diagnose-flag:

| Skill | Beschrijving | CLI Voorbeeld |
| :--- | :--- | :--- |
| `skill_connection.py` | Batterij (percentage, temperatuur), Wi-Fi en services | `python skills/alpha_mini/skill_connection.py --test` |
| `skill_speech.py` | Meertalige TTS (nl-NL, en-US), volume en audio | `python skills/alpha_mini/skill_speech.py --speak "Hallo Maatje" --lang nl-NL` |
| `skill_motion.py` | 14 servo's met hoekbeveiliging & UBX presets | `python skills/alpha_mini/skill_motion.py --action say_hello_avatar` |
| `skill_expression.py` | Ronde oog-LCD animaties & mond-LED | `python skills/alpha_mini/skill_expression.py --expression happy` |
| `skill_vision_sensors.py`| Camera frame capture, hoofd touch & valdetectie | `python skills/alpha_mini/skill_vision_sensors.py --test` |

---

## 🧠 Externe AI & Model Integratie (`/api/hooks/ai-pipeline`)

De architectuur is ontworpen om externe LLM's (zoals OpenAI, Claude, Gemini), Whisper STT en Computer Vision modellen direct te koppelen:

```bash
# Simuleer een gesproken gebruikerscommando via de webhook:
curl -X POST http://localhost:3000/api/hooks/ai-pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user_speech",
    "text": "Kun je voor mij zwaaien?",
    "confidence": 0.98
  }'
```

Het systeem genereert autonoom een `AIActionPlan`, voert spraak, beweging en oogexpressies gesynchroniseerd uit en logt alles naar PostgreSQL.

---

## ☁️ Vercel Deployment

1. Push de code naar je GitHub repository.
2. Importeer het project in Vercel.
3. Vul de omgevingsvariabelen in onder **Project Settings > Environment Variables**:
   - `DATABASE_URL` (bijv. van Supabase of Neon PostgreSQL)
   - `ROBOT_BRIDGE_HTTP_URL` (de publieke URL van je lokale bridge, bijv. via Cloudflare Tunnel of ngrok)
   - `ROBOT_BRIDGE_AUTH_TOKEN` (identiek aan je lokale token)
4. Deploy! De serverless API routes communiceren naadloos met de tunnel naar de fysieke robot.
