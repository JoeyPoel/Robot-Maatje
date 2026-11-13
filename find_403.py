import zipfile, struct

with zipfile.ZipFile('PcCodeMao.apk') as z:
    dex = z.read('classes.dex')

m_size, m_off = struct.unpack('<II', dex[88:96])
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

def get_method_name(idx):
    off = m_off + idx * 8
    c_idx, p_idx, n_idx = struct.unpack('<HHI', dex[off:off+8])
    d_idx, = struct.unpack('<I', dex[type_ids_off + c_idx*4 : type_ids_off + (c_idx+1)*4])
    return f'{get_str(d_idx)}->{get_str(n_idx)}'

# Search for const/16 vX, 403 (0x13 X 0x93 0x01)
pattern = b'\x93\x01'
pos = 0
while True:
    pos = dex.find(pattern, pos)
    if pos == -1: break
    if pos >= 2 and dex[pos-2] == 0x13:
        print(f'const/16 403 found at {pos-2}')
        # Find which method contains this
        # scan class_defs
    pos += 1

