import struct, zlib, os

def make_png(w, h, r, g, b):
    def chunk(t, d):
        c = t + d
        crc = struct.pack('>I', zlib.crc32(c) & 0xffffffff)
        return struct.pack('>I', len(d)) + c + crc

    raw = b''
    for y in range(h):
        raw += b'\x00'
        for x in range(w):
            raw += struct.pack('BBBB', r, g, b, 255)

    compressed = zlib.compress(raw)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')
    return png

outdir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'icons')
os.makedirs(outdir, exist_ok=True)

for size in [192, 512, 72, 96, 128, 144, 152, 384]:
    fn = os.path.join(outdir, f'icon-{size}x{size}.png')
    with open(fn, 'wb') as f:
        f.write(make_png(size, size, 255, 59, 48))
    print(f'Created {fn}')

favicon = os.path.join(os.path.dirname(outdir), 'favicon.png')
with open(favicon, 'wb') as f:
    f.write(make_png(48, 48, 255, 59, 48))
print(f'Created {favicon}')
