import zipfile, struct

with zipfile.ZipFile('PcCodeMao.apk') as z:
    dex = z.read('classes.dex')

target = b'Lcom/ubtrobot/lancommunication/protocol/ProtoBufferDispose;'
str_pos = dex.find(target)
print('Target string:', str_pos)

# find methods in ProtoBufferDispose
pos = 0
while True:
    pos = dex.find(b'unPackData', pos)
    if pos == -1: break
    print('unPackData at', pos)
    snippet = dex[max(0, pos-40):min(len(dex), pos+200)]
    print(' '.join([chr(b) if 32 <= b < 127 else '.' for b in snippet]))
    pos += 1

