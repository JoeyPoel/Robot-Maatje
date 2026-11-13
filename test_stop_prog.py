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
        # Try Cmd 17 (Stop Program)
        await ws.send(build_packet(17, b'', 'req_stop_prog'))
        print('Cmd 17 resp:', await ws.recv())

        # Try Cmd 21 (Exit Program)
        await ws.send(build_packet(21, b'', 'req_exit_prog'))
        print('Cmd 21 resp:', await ws.recv())

        # Try Cmd 3 (Stop Action)
        await ws.send(build_packet(3, b'', 'req_stop_act'))
        print('Cmd 3 resp:', await ws.recv())

        # Now try enter program again
        await ws.send(build_packet(16, b'', 'req_enter'))
        print('Cmd 16 resp:', await ws.recv())

        # Now try expression codemao19
        body = encode_string(1, 'codemao19') + encode_int(2, 0)
        await ws.send(build_packet(10, body, 'req_exp'))
        r = await ws.recv()
        print('Cmd 10 resp:', r)
        print('Decoded:', base64.b64decode(r.rstrip('&')))

asyncio.run(test())

