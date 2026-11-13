import zipfile, struct

with zipfile.ZipFile('PcCodeMao.apk') as z:
    dex = z.read('classes.dex')

target = b'codemao_running is running'
str_ids_size, str_ids_off = struct.unpack('<II', dex[56:64])

def read_uleb128(data, off):
    val = 0; shift = 0
    while True:
        b = data[off]; off += 1
        val |= (b & 0x7f) << shift
        if not (b & 0x80): break
        shift += 7
    return val, off

target_str_idx = None
for i in range(str_ids_size):
    s_off, = struct.unpack('<I', dex[str_ids_off + i*4 : str_ids_off + (i+1)*4])
    s_len, s_data = read_uleb128(dex, s_off)
    if dex[s_data:s_data+len(target)] == target:
        target_str_idx = i
        print('Target str idx:', target_str_idx)
        break

# Find in bytecode where target_str_idx is loaded (1a 00 xx xx)
pattern = struct.pack('<H', target_str_idx)
pos = 0
while True:
    pos = dex.find(pattern, pos)
    if pos == -1: break
    if dex[pos-2] == 0x1a:
        print(f'const-string found at {pos-2}')
        # print snippet around it
        snippet = dex[max(0, pos-100):min(len(dex), pos+200)]
        print(' '.join([f'{b:02x}' for b in snippet]))
    pos += 1

