import zipfile, struct

with zipfile.ZipFile('PcCodeMao.apk') as z:
    dex = z.read('classes.dex')

str_ids_size, str_ids_off = struct.unpack('<II', dex[56:64])
type_ids_size, type_ids_off = struct.unpack('<II', dex[64:72])

def read_uleb128(data, off):
    val = 0; shift = 0
    while True:
        b = data[off]; off += 1
        val |= (b & 0x7f) << shift
        if not (b & 0x80): break
        shift += 7
    return val, off

def get_str(str_idx):
    s_off, = struct.unpack('<I', dex[str_ids_off + str_idx*4 : str_ids_off + (str_idx+1)*4])
    s_len, s_data = read_uleb128(dex, s_off)
    return dex[s_data:s_data+s_len].decode('utf-8', errors='ignore')

def get_type_name(t_idx):
    d_idx, = struct.unpack('<I', dex[type_ids_off + t_idx*4 : type_ids_off + (t_idx+1)*4])
    return get_str(d_idx)

pattern = b'\xcc\xd1'
pos = 0
while True:
    pos = dex.find(pattern, pos)
    if pos == -1: break
    if pos >= 2 and dex[pos-2] == 0x71:
        before = dex[pos-16:pos+6]
        for k in range(0, 16, 2):
            if before[k] == 0x1c:
                t_idx, = struct.unpack('<H', before[k+2:k+4])
                print(f'unPackData at {pos}: class={get_type_name(t_idx)}')
    pos += 1
