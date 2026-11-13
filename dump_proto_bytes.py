import zipfile

with zipfile.ZipFile('PcCodeMao.apk') as z:
    dex = z.read('classes.dex')

pos = dex.find(b'CodeMao_PlayExpression.proto')
print('Descriptor at', pos)
# Read around pos
raw = dex[pos-10:pos+250]
print(repr(raw))

