# UBTECH Alpha Mini (Robot Maatje) - Modular Hardware Skills

Deze map bevat de zelfstandige, modulaire hardware-skills voor directe aansturing van de fysieke **UBTECH Alpha Mini** robot (Robot Maatje / Zorgrobot Robin).

Elke skill is voorzien van robuuste error handling, timeouts, CLI flags, JSON-uitvoer en een `--test` diagnose-modus.

---

## 1. `skill_connection.py` (Verbinding & Healthcheck)
Beheert de ADB verbinding, leest batterijstatus (percentage, spanning, temperatuur), Wi-Fi netwerkgegevens en controleert actieve robot-services.

```bash
# Diagnose test uitvoeren
python skills/alpha_mini/skill_connection.py --test

# JSON telemetrie opvragen
python skills/alpha_mini/skill_connection.py --json
```

## 2. `skill_speech.py` (Text-to-Speech & Audio)
Ondersteunt spraaksynthese in het Nederlands (`nl-NL`) en Engels (`en-US`), volumeregeling (0-100%) en het afspelen van audiobestanden op het apparaat.

```bash
# Zelfdiagnose test
python skills/alpha_mini/skill_speech.py --test

# Tekst uitspreken in het Nederlands
python skills/alpha_mini/skill_speech.py --speak "Hallo, ik ben Robot Maatje." --lang nl-NL

# Robot volume aanpassen
python skills/alpha_mini/skill_speech.py --volume 80

# Audiobestand afspelen
python skills/alpha_mini/skill_speech.py --play "/sdcard/customize/systemaudio/alarm_long.mp3"
```

## 3. `skill_motion.py` (Servo- & Bewegingsbesturing)
Beheert 14 fysieke servo-hoeken met ingebouwde software-clamps (om overbelasting en tandwielstrippen te voorkomen) en voert voorgeprogrammeerde UBX acties uit.

```bash
# Zelfdiagnose test (kinematics clamp + begroeting)
python skills/alpha_mini/skill_motion.py --test

# Actie uitvoeren (bijv. zwaaien, opstaan, klappen, dansen)
python skills/alpha_mini/skill_motion.py --action say_hello_avatar
python skills/alpha_mini/skill_motion.py --action stand_up
python skills/alpha_mini/skill_motion.py --action zitten

# Individuele servo veilig aansturen (met automatische limietklem)
python skills/alpha_mini/skill_motion.py --servo head_yaw 25
python skills/alpha_mini/skill_motion.py --servo left_shoulder_roll 45

# Actieve bewegingen direct stoppen (noodstop)
python skills/alpha_mini/skill_motion.py --stop
```

## 4. `skill_expression.py` (Oog-LCD's & Emoties)
Stuurt animaties en emoties aan op de twee ronde LCD-oogdisplays, regelt mond-LED's en kan het huidige scherm vastleggen.

```bash
# Zelfdiagnose test
python skills/alpha_mini/skill_expression.py --test

# Emotie activeren
python skills/alpha_mini/skill_expression.py --expression happy
python skills/alpha_mini/skill_expression.py --expression surprised
python skills/alpha_mini/skill_expression.py --expression wink

# Oogscherm vastleggen naar lokaal PNG bestand
python skills/alpha_mini/skill_expression.py --capture ./eye_view.png
```

## 5. `skill_vision_sensors.py` (Camera & Sensoren)
Vangt visuele frames op van de robot, leest de capacitieve touch-sensoren op het hoofd uit (`cp2610`), en bewaakt de gyroscoop-, versnellings- en valdetectiestatus.

```bash
# Zelfdiagnose test
python skills/alpha_mini/skill_vision_sensors.py --test

# Frame vastleggen
python skills/alpha_mini/skill_vision_sensors.py --snapshot ./camera_frame.png

# Sensor telemetrie opvragen
python skills/alpha_mini/skill_vision_sensors.py --telemetry --json
```

