import asyncio
import websockets
import base64
import struct

def encode_varint(val):
    res = bytearray()
    b = val & 0x7f
    val >>= 7
    while val > 0:
        res.append(0x80 | b)
        b = val & 0x7f
        val >>= 7
    res.append(b)
    return bytes(res)

def encode_tag(field_num, wire_type):
    return encode_varint((field_num << 3) | wire_type)

def encode_string(field_num, s):
    data = s.encode('utf-8')
    return encode_tag(field_num, 2) + encode_varint(len(data)) + data

def encode_int(field_num, val):
    return encode_tag(field_num, 0) + encode_varint(val)

def encode_bytes(field_num, b):
    return encode_tag(field_num, 2) + encode_varint(len(b)) + b

def build_packet(cmd, body, req_id='req_test_1'):
    hdr = encode_string(1, req_id) + encode_int(3, cmd)
    root = encode_bytes(1, hdr) + encode_bytes(2, body)
    return base64.b64encode(root).decode('utf-8') + '&'

async def test():
    # Forward port 8800 via adb
    import subprocess
    subprocess.run(['C:\\Users\\joeyw\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe', 'forward', 'tcp:8800', 'tcp:8800'])
    subprocess.run(['C:\\Users\\joeyw\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe', 'forward', 'tcp:8801', 'tcp:8801'])
    
    # Try port 8801
    async with websockets.connect('ws://127.0.0.1:8801') as ws:
        # 1. Enter program mode (Cmd 16)
        pkt16 = build_packet(16, b'', 'req_enter')
        await ws.send(pkt16)
        r = await ws.recv()
        print('Cmd 16 resp:', r)
        
        # 2. Try expression codemao19 with dirType = 0
        body1 = encode_string(1, 'codemao19') + encode_int(2, 0)
        pkt1 = build_packet(10, body1, 'req_exp1')
        await ws.send(pkt1)
        r1 = await ws.recv()
        print('Cmd 10 (dirType=0) resp:', r1)
        b1 = base64.b64decode(r1.rstrip('&'))
        print('Decoded 1:', b1.hex())

        # 3. Try expression codemao19 with ONLY expressName (dirType omitted)
        body2 = encode_string(1, 'codemao19')
        pkt2 = build_packet(10, body2, 'req_exp2')
        await ws.send(pkt2)
        r2 = await ws.recv()
        print('Cmd 10 (name only) resp:', r2)
        b2 = base64.b64decode(r2.rstrip('&'))
        print('Decoded 2:', b2.hex())

        # 4. Try 001_tapHead.gif
        body3 = encode_string(1, '001_tapHead.gif') + encode_int(2, 0)
        pkt3 = build_packet(10, body3, 'req_exp3')
        await ws.send(pkt3)
        r3 = await ws.recv()
        print('Cmd 10 (001_tapHead.gif) resp:', r3)
        b3 = base64.b64decode(r3.rstrip('&'))
        print('Decoded 3:', b3.hex())

asyncio.run(test())

