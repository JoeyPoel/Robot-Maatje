import zipfile, struct

with zipfile.ZipFile('PcCodeMao.apk') as z:
    dex = z.read('classes.dex')

m_size, m_off = struct.unpack('<II', dex[88:96])
str_ids_size, str_ids_off = struct.unpack('<II', dex[56:64])

def read_uleb128(data, off):
    val = 0; shift = 0
    while True:
        b = data[off]; off += 1
        val |= (b & 0x7f) << shift
        if not (b & 0x80): break
        shift += 7
    return val, off

def get_str(str_idx):
    if str_idx >= str_ids_size: return f'<str_{str_idx}>'
    s_off, = struct.unpack('<I', dex[str_ids_off + str_idx*4 : str_ids_off + (str_idx+1)*4])
    s_len, s_data = read_uleb128(dex, s_off)
    return dex[s_data:s_data+s_len].decode('utf-8', errors='ignore')

def get_method_name(idx):
    if idx >= m_size: return f'<meth_{idx}>'
    off = m_off + idx * 8
    c_idx, p_idx, n_idx = struct.unpack('<HHI', dex[off:off+8])
    return get_str(n_idx)

code_off = 3639324
registers_size, ins_size, outs_size, tries_size, debug_info_off, insns_size = struct.unpack('<HHHHII', dex[code_off:code_off+16])
insns = dex[code_off+16:code_off+16+insns_size*2]

i = 0
while i < len(insns):
    op = insns[i]
    if op in [0x6e, 0x74, 0x6f, 0x75, 0x70, 0x76, 0x71, 0x77, 0x72, 0x78]:
        meth_idx, = struct.unpack('<H', insns[i+2:i+4])
        print(f'{i:04x}: invoke {get_method_name(meth_idx)}')
        i += 6
    elif op == 0x1a:
        str_idx, = struct.unpack('<H', insns[i+2:i+4])
        print(f'{i:04x}: const-string "{get_str(str_idx)}"')
        i += 4
    else:
        i += 2

