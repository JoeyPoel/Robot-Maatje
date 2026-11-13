import zipfile, struct

with zipfile.ZipFile('PcCodeMao.apk') as z:
    dex = z.read('classes.dex')

code_off = 3639324
insns = dex[code_off+16:code_off+16+97*2]

# Print hex and instructions from offset 0 to 0x40
for j in range(0, 0x40, 2):
    w, = struct.unpack('<H', insns[j:j+2])
    print(f'{j:04x}: {w:04x}')

