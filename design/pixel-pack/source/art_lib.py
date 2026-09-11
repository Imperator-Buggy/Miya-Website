"""Miya's Cookies - pixel art core library.
Brand-locked palette derived from the kraft-paper ink logo.
"""
from PIL import Image

T = (0, 0, 0, 0)

PALETTE = {
    '.': T,
    'K': (43, 33, 28, 255),      # ink outline (logo black)
    'k': (74, 58, 48, 255),      # soft ink
    'S': (245, 205, 168, 255),   # skin
    's': (214, 166, 124, 255),   # skin shadow
    'H': (26, 20, 20, 255),      # hair
    'h': (58, 44, 38, 255),      # hair highlight
    'P': (233, 158, 156, 255),   # blush
    'W': (255, 249, 240, 255),   # white
    'w': (223, 210, 193, 255),   # white shadow
    'T': (216, 174, 126, 255),   # kraft
    't': (181, 135, 88, 255),    # kraft shadow
    'C': (198, 137, 70, 255),    # cookie mid
    'c': (226, 172, 104, 255),   # cookie light
    'd': (150, 96, 48, 255),     # cookie dark / crust
    'N': (58, 32, 20, 255),      # nutella
    'n': (99, 56, 33, 255),      # nutella light
    'X': (255, 255, 255, 255),   # sea salt
    'G': (243, 201, 76, 255),    # gold
    'g': (198, 154, 40, 255),    # gold shadow
    'R': (214, 84, 79, 255),     # red / heart
    'p': (240, 176, 190, 255),   # pink
    'B': (104, 138, 190, 255),   # blue
    'M': (140, 198, 170, 255),   # mint
    'L': (168, 150, 201, 255),   # lavender
    'e': (120, 92, 74, 255),     # warm brown line
}

KRAFT_BG = (216, 179, 137, 255)


class Grid:
    def __init__(self, w=32, h=32, rows=None):
        if rows is not None:
            for i, r in enumerate(rows):
                assert len(r) == w, f"row {i} len {len(r)} != {w}: {r!r}"
            self.g = [list(r) for r in rows]
            self.h = len(rows)
            self.w = w
        else:
            self.w, self.h = w, h
            self.g = [['.'] * w for _ in range(h)]

    def copy(self):
        n = Grid(self.w, self.h)
        n.g = [row[:] for row in self.g]
        return n

    def px(self, x, y, ch):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.g[y][x] = ch

    def rect(self, x0, y0, x1, y1, ch):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.px(x, y, ch)

    def row(self, y, x0, s):
        for i, ch in enumerate(s):
            self.px(x0 + i, y, ch)

    def stamp(self, other, ox, oy, skip='.'):
        for y in range(other.h):
            for x in range(other.w):
                ch = other.g[y][x]
                if ch != skip:
                    self.px(ox + x, oy + y, ch)

    def replace(self, mapping):
        n = self.copy()
        for y in range(n.h):
            for x in range(n.w):
                ch = n.g[y][x]
                if ch in mapping:
                    n.g[y][x] = mapping[ch]
        return n

    def render(self, scale=1, bg=None):
        img = Image.new('RGBA', (self.w, self.h), bg if bg else T)
        px = img.load()
        for y in range(self.h):
            for x in range(self.w):
                ch = self.g[y][x]
                col = PALETTE.get(ch, T)
                if col[3] == 0:
                    continue
                px[x, y] = col
        if scale != 1:
            img = img.resize((self.w * scale, self.h * scale), Image.NEAREST)
        return img


def from_rows(rows, w=32):
    return Grid(w=w, h=len(rows), rows=rows)


DECO = {'G', 'k'}   # sparkles / motion ticks: never generate an outline


def outline(grid, ch='K'):
    """Add a 1px ink outline around the sprite silhouette (brand = ink line art)."""
    n = grid.copy()
    for y in range(grid.h):
        for x in range(grid.w):
            if grid.g[y][x] != '.':
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < grid.w and 0 <= ny < grid.h and grid.g[ny][nx] not in DECO and grid.g[ny][nx] != '.':
                    n.g[y][x] = ch
                    break
    return n
