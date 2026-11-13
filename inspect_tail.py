import zipfile, struct

with zipfile.ZipFile('PcCodeMao.apk') as z:
    dex = z.read('classes.dex')

code_off = 3639324
insns = dex[code_off+16:code_off+16+97*2]
# print instructions from offset 0x90 to 0xc0
for j in range(0x90, len(insns)-2, 2):
    w, = struct.unpack('<H', insns[j:j+2])
    print(f'{j:04x}: {w:04x} ({insns[j]:02x} {insns[j+1]:02x})')
