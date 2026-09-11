#!/usr/bin/env python3
"""Generate PWA icons from the 1x hero sprite using pure-stdlib PNG decode/encode.
Nearest-neighbour integer scaling keeps the pixel art crisp.

    python3 tools/make_icons.py
"""
import struct, zlib, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets/img/sprites/miya_nutella_hero.png'
OUT = ROOT / 'assets/img/icons'
KRAFT = (0xD8, 0xB3, 0x89)


def read_png(path):
    data = path.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    pos, chunks, idat = 8, {}, b''
    while pos < len(data):
        (length,), ctype = struct.unpack('>I', data[pos:pos + 4]), data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + length]
        if ctype == b'IHDR':
            chunks['ihdr'] = struct.unpack('>IIBBBBB', body)
        elif ctype == b'IDAT':
            idat += body
        pos += 12 + length
    w, h, depth, ctype, _, _, interlace = chunks['ihdr']
    assert depth == 8 and interlace == 0 and ctype in (2, 6), 'unsupported PNG variant'
    bpp = 4 if ctype == 6 else 3
    raw = zlib.decompress(idat)
    stride = w * bpp
    prev = bytearray(stride)
    pixels = []
    for y in range(h):
        f = raw[y * (stride + 1)]
        line = bytearray(raw[y * (stride + 1) + 1:(y + 1) * (stride + 1)])
        for i in range(stride):
            a = line[i - bpp] if i >= bpp else 0
            b = prev[i]
            c = prev[i - bpp] if i >= bpp else 0
            if f == 1: line[i] = (line[i] + a) & 255
            elif f == 2: line[i] = (line[i] + b) & 255
            elif f == 3: line[i] = (line[i] + (a + b) // 2) & 255
            elif f == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if pa <= pb and pa <= pc else b if pb <= pc else c
                line[i] = (line[i] + pr) & 255
        row = []
        for x in range(w):
            px = line[x * bpp:(x + 1) * bpp]
            row.append((px[0], px[1], px[2], px[3] if bpp == 4 else 255))
        pixels.append(row)
        prev = line
    return w, h, pixels


def write_png(path, w, h, rows):
    raw = b''.join(b'\x00' + bytes(v for px in row for v in px) for row in rows)
    def chunk(t, b): return struct.pack('>I', len(b)) + t + b + struct.pack('>I', zlib.crc32(t + b) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) \
        + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    path.write_bytes(png)


def make(size, pad, name):
    w, h, px = read_png(SRC)
    scale = (size - pad * 2) // w
    d = w * scale
    off = (size - d) // 2
    rows = []
    for y in range(size):
        row = []
        for x in range(size):
            sx, sy = (x - off) // scale, (y - off) // scale
            if 0 <= sx < w and 0 <= sy < h and px[sy][sx][3] > 127:
                r, g, b, _ = px[sy][sx]
                row.append((r, g, b))
            else:
                row.append(KRAFT)
        rows.append(row)
    write_png(OUT / name, size, size, rows)
    print('wrote', OUT / name)


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    make(192, 0, 'icon-192.png')
    make(512, 0, 'icon-512.png')
    make(512, 96, 'icon-maskable-512.png')
