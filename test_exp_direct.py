import asyncio
import websockets
import base64

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
    async with websockets.connect('ws://127.0.0.1:8801') as ws:
        # Try sending expression directly without Cmd 16
        body = encode_string(1, 'codemao19') + encode_int(2, 0)
        await ws.send(build_packet(10, body, 'req_exp_direct'))
        r = await ws.recv()
        print('Cmd 10 direct resp:', r)
        b = base64.b64decode(r.rstrip('&'))
        print('Decoded:', b)

asyncio.run(test())

