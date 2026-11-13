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

class_defs_size, class_defs_off = struct.unpack('<II', dex[96:104])
for i in range(class_defs_size):
    c_off = class_defs_off + i * 32
    c_idx, _, _, _, _, _, class_data_off, _ = struct.unpack('<IIIIIIII', dex[c_off:c_off+32])
    if class_data_off == 0: continue
    off = class_data_off
    static_sz, off = read_uleb128(dex, off)
    inst_sz, off = read_uleb128(dex, off)
    dir_sz, off = read_uleb128(dex, off)
    virt_sz, off = read_uleb128(dex, off)
    for _ in range(static_sz + inst_sz):
        _, off = read_uleb128(dex, off); _, off = read_uleb128(dex, off)
    mid = 0
    for _ in range(dir_sz):
        diff, off = read_uleb128(dex, off); mid += diff; _, off = read_uleb128(dex, off); c_off, off = read_uleb128(dex, off)
        if c_off <= 3654594 < c_off + 2000:
            print('Found in direct method:', get_method_name(mid), 'at code_off', c_off)
    mid = 0
    for _ in range(virt_sz):
        diff, off = read_uleb128(dex, off); mid += diff; _, off = read_uleb128(dex, off); c_off, off = read_uleb128(dex, off)
        if c_off <= 3654594 < c_off + 2000:
            print('Found in virtual method:', get_method_name(mid), 'at code_off', c_off)

