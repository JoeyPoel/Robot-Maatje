import zipfile, struct

with zipfile.ZipFile('PcCodeMao.apk') as z:
    dex = z.read('classes.dex')

# Find string 'CodeMao_PlayExpression.proto'
pos = dex.find(b'CodeMao_PlayExpression.proto')
print('Descriptor at', pos)
print(dex[pos-10:pos+300])

