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

def get_method_name(idx):
    off = m_off + idx * 8
    c_idx, p_idx, n_idx = struct.unpack('<HHI', dex[off:off+8])
    return get_str(n_idx)

# Find PlayActionHandler class_def
target = b'Lcom/ubtrobot/lancommunication/handlers/PlayActionHandler;'
for i in range(str_ids_size):
    s_off, = struct.unpack('<I', dex[str_ids_off + i*4 : str_ids_off + (i+1)*4])
    s_len, s_data = read_uleb128(dex, s_off)
    if dex[s_data:s_data+len(target)] == target:
        target_str_idx = i; break

for i in range(type_ids_size):
    d_idx, = struct.unpack('<I', dex[type_ids_off + i*4 : type_ids_off + (i+1)*4])
    if d_idx == target_str_idx:
        target_type_idx = i; break

class_defs_size, class_defs_off = struct.unpack('<II', dex[96:104])
for i in range(class_defs_size):
    c_off = class_defs_off + i * 32
    c_idx, _, _, _, _, _, class_data_off, _ = struct.unpack('<IIIIIIII', dex[c_off:c_off+32])
    if c_idx == target_type_idx:
        off = class_data_off
        static_sz, off = read_uleb128(dex, off); inst_sz, off = read_uleb128(dex, off); dir_sz, off = read_uleb128(dex, off); virt_sz, off = read_uleb128(dex, off)
        for _ in range(static_sz + inst_sz): _, off = read_uleb128(dex, off); _, off = read_uleb128(dex, off)
        for _ in range(dir_sz): diff, off = read_uleb128(dex, off); _, off = read_uleb128(dex, off); _, off = read_uleb128(dex, off)
        mid = 0
        for _ in range(virt_sz):
            diff, off = read_uleb128(dex, off); mid += diff; _, off = read_uleb128(dex, off); code_off, off = read_uleb128(dex, off)
            print(f'PlayActionHandler virtual {get_method_name(mid)} @ {code_off}')
            if get_method_name(mid) == 'handleMsg':
                regs, ins_sz, outs_sz, tries_sz, debug_off, insns_sz = struct.unpack('<HHHHII', dex[code_off:code_off+16])
                insns = dex[code_off+16:code_off+16+insns_sz*2]
                j = 0
                while j < len(insns):
                    op = insns[j]
                    if op in [0x6e, 0x74, 0x6f, 0x75, 0x70, 0x76, 0x71, 0x77, 0x72, 0x78]:
                        m_idx, = struct.unpack('<H', insns[j+2:j+4])
                        print(f'  {j:04x}: invoke {get_method_name(m_idx)}')
                        j += 6
                    elif op == 0x1a:
                        s_idx, = struct.unpack('<H', insns[j+2:j+4])
                        print(f'  {j:04x}: const-string "{get_str(s_idx)}"')
                        j += 4
                    elif op == 0x1c:
                        t_idx, = struct.unpack('<H', insns[j+2:j+4])
                        print(f'  {j:04x}: const-class {get_type_name(t_idx)}')
                        j += 4
                    else: j += 2
        break

