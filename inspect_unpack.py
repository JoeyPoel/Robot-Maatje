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

def get_type_name(t_idx):
    d_idx, = struct.unpack('<I', dex[type_ids_off + t_idx*4 : type_ids_off + (t_idx+1)*4])
    return get_str(d_idx)

code_off = 3639324
insns = dex[code_off+16:code_off+16+97*2]
# at offset 0x14:
meth_idx, = struct.unpack('<H', insns[0x14+2:0x14+4])
off = m_off + meth_idx * 8
c_idx, p_idx, n_idx = struct.unpack('<HHI', dex[off:off+8])
print(f'Method at 0x14: class={get_type_name(c_idx)}, name={get_str(n_idx)}')

