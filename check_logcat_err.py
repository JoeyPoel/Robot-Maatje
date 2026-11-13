import subprocess

# Let's see what body bytes were sent
# Buffer.concat([encodeString(1, 'codemao19'), encodeInt(2, 0)])
# In hex:
# tag 1, wire 2: (1 << 3) | 2 = 0x0a
# len('codemao19') = 9 (0x09)
# 'codemao19' = 63 6f 64 65 6d 61 6f 31 39
# tag 2, wire 0: (2 << 3) | 0 = 0x10
# val 0: 0x00
# Total body: 0a 09 63 6f 64 65 6d 61 6f 31 39 10 00

# Let's inspect what Android logcat printed when unPackData failed!
cmd = ['C:\\Users\\joeyw\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe', 'logcat', '-d', '-s', 'Tag[PcCodemao]', 'PcCodeMao', 'System.err', 'AndroidRuntime']
res = subprocess.run(cmd, capture_output=True, text=True)
for line in res.stdout.splitlines()[-40:]:
    print(line)

