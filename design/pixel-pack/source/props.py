"""Miya's signature cookie + item sprites. 16x16 grid."""
from art_lib import Grid

S = 16


def disc(g, cx, cy, r, fill, edge=None, edge_w=1.0):
    for y in range(g.h):
        for x in range(g.w):
            d = ((x + 0.5) - cx) ** 2 + ((y + 0.5) - cy) ** 2
            if d <= r * r:
                if edge and d > (r - edge_w) ** 2:
                    g.px(x, y, edge)
                else:
                    g.px(x, y, fill)


def erase_disc(g, cx, cy, r):
    for y in range(g.h):
        for x in range(g.w):
            d = ((x + 0.5) - cx) ** 2 + ((y + 0.5) - cy) ** 2
            if d <= r * r:
                g.px(x, y, '.')


def _shade(g, chars=('c',), to='C'):
    """Add a bottom-right shadow band."""
    for y in range(g.h):
        for x in range(g.w):
            if g.g[y][x] in chars and (x + y) > 19:
                g.px(x, y, to)


def cookie_signature():
    g = Grid(S, S)
    disc(g, 8, 8, 6.6, 'c', 'd', 1.2)
    _shade(g)
    # nutella pockets showing through the crackle
    for x, y in [(5, 5), (9, 4), (11, 8), (6, 10), (9, 11)]:
        g.px(x, y, 'N'); g.px(x + 1, y, 'n')
    # sea salt flakes
    for x, y in [(7, 3), (4, 8), (12, 6), (8, 8), (10, 10), (6, 12)]:
        g.px(x, y, 'X')
    return g


def cookie_bitten():
    g = cookie_signature()
    erase_disc(g, 14, 3, 4.0)
    # nutella filling revealed along the bite
    for y in range(1, 8):
        for x in range(6, 15):
            if g.g[y][x] == '.':
                continue
        # noop
    disc_edge = []
    for y in range(g.h):
        for x in range(g.w):
            if g.g[y][x] in ('c', 'C', 'd'):
                if any(0 <= x + dx < S and 0 <= y + dy < S and g.g[y + dy][x + dx] == '.'
                       for dx, dy in ((1, 0), (0, -1), (1, -1))) and x > 7 and y < 8:
                    disc_edge.append((x, y))
    for x, y in disc_edge:
        g.px(x, y, 'N')
    g.px(10, 5, 'n'); g.px(11, 6, 'n')
    return g


def cookie_split():
    """Half cookie, molten nutella core + drip."""
    g = Grid(S, S)
    disc(g, 8, 8, 6.6, 'c', 'd', 1.2)
    _shade(g)
    erase_disc(g, 8, 0, 5.0)
    # molten core
    disc(g, 8, 9, 3.4, 'n', 'N', 1.0)
    # drip
    g.row(12, 7, "NN")
    g.row(13, 7, "NN")
    g.px(8, 14, 'N')
    for x, y in [(5, 6), (11, 7), (7, 5)]:
        g.px(x, y, 'X')
    return g


def cookie_dough():
    g = Grid(S, S)
    disc(g, 8, 9, 5.6, 't', 'e', 1.1)
    for x, y in [(6, 7), (10, 9), (8, 11)]:
        g.px(x, y, 'N')
    g.px(7, 6, 'X')
    return g


def cookie_golden():
    g = Grid(S, S)
    disc(g, 8, 8, 6.6, 'G', 'g', 1.2)
    for x, y in [(5, 5), (10, 6), (7, 10)]:
        g.px(x, y, 'N')
    for x, y in [(8, 3), (4, 8), (12, 9)]:
        g.px(x, y, 'X')
    # sparkles
    for x, y in [(1, 2), (14, 3), (13, 13), (2, 12)]:
        g.px(x, y, 'X')
    return g


def cookie_burnt():
    g = Grid(S, S)
    disc(g, 8, 8, 6.6, 'N', 'K', 1.2)
    for x, y in [(6, 6), (10, 9)]:
        g.px(x, y, 'k')
    # smoke
    g.px(6, 2, 'w'); g.px(7, 1, 'w'); g.px(9, 2, 'w'); g.px(10, 1, 'w')
    return g


def crumbs():
    g = Grid(S, S)
    for x, y in [(3, 9), (6, 11), (9, 10), (11, 12), (7, 8), (4, 12), (12, 8), (9, 6)]:
        g.px(x, y, 'd'); g.px(x + 1, y, 'c')
    for x, y in [(5, 10), (10, 9), (8, 12)]:
        g.px(x, y, 'N')
    return g


def nutella_jar():
    g = Grid(S, S)
    g.row(1, 6, "KKKK")
    g.row(2, 5, "KwwwwK")
    g.row(3, 5, "KKKKKK")
    g.row(4, 4, "KWWWWWWK")
    for y in range(5, 13):
        g.row(y, 4, "KNNNNNNK")
    g.row(5, 5, "WWWWWW")
    g.row(6, 5, "WnnnnW")
    g.row(13, 5, "KKKKKK")
    g.px(6, 8, 'X'); g.px(9, 10, 'X')
    return g


def salt_shaker():
    g = Grid(S, S)
    g.row(2, 6, "kkkk")
    g.row(3, 6, "kXXk")
    g.row(4, 5, "kkkkkk")
    for y in range(5, 13):
        g.row(y, 5, "WWWWWW")
        g.px(10, y, 'w')
    g.row(13, 5, "wwwwww")
    g.px(6, 7, 'X')
    for x, y in [(12, 4), (13, 6), (11, 7), (13, 9), (12, 11)]:
        g.px(x, y, 'X')
    return g


def milk_glass():
    g = Grid(S, S)
    g.row(2, 4, "wwwwwwww")
    g.row(3, 4, "wWWWWWWw")
    for y in range(4, 8):
        g.row(y, 4, "wWWWWWWw")
    for y in range(8, 12):
        g.row(y, 5, "wWWWWWw")
    g.row(12, 6, "wWWWWw")
    g.row(13, 6, "wwwww")
    g.px(6, 5, 'X'); g.px(6, 6, 'X')
    g.px(10, 4, 'w'); g.px(10, 9, 'w')
    return g


def heart():
    g = Grid(S, S)
    rows = [
        (4, "..RRR..RRR.."),
        (5, ".RRRRRRRRRR."),
        (6, "RRRRRRRRRRRR"),
        (7, "RRRRRRRRRRRR"),
        (8, ".RRRRRRRRRR."),
        (9, "..RRRRRRRR.."),
        (10, "...RRRRRR..."),
        (11, "....RRRR...."),
        (12, ".....RR....."),
    ]
    for y, s in rows:
        g.row(y, 2, s)
    g.px(5, 6, 'p'); g.px(6, 6, 'p'); g.px(5, 7, 'p')
    return g


def star():
    g = Grid(S, S)
    rows = [
        (3, ".....GG....."),
        (4, "....GGGG...."),
        (5, "GGGGGGGGGGGG"),
        (6, ".GGGGGGGGGG."),
        (7, "..GGGGGGGG.."),
        (8, "..GGGGGGGG.."),
        (9, ".GGGG..GGGG."),
        (10, "GGG......GGG"),
    ]
    for y, s in rows:
        g.row(y, 2, s)
    return g


def chef_hat_icon():
    g = Grid(S, S)
    g.row(2, 5, "WWWWWW")
    g.row(3, 3, "WWWWWWWWWW")
    g.row(4, 2, "WWWWWWWWWWWW")
    g.row(5, 2, "WWWWWWWWWWWW")
    g.row(6, 3, "WWWWWWWWWW")
    g.row(7, 3, "wwwwwwwwww")
    g.row(8, 3, "wwwwwwwwww")
    g.px(5, 3, 'w'); g.px(11, 4, 'w')
    return g


def cookie_tray():
    g = Grid(S, S)
    for cx in (3, 7, 11):
        g.row(5, cx, "ddd")
        g.row(6, cx - 1, "dcNcd")
        g.row(7, cx - 1, "dcXcd")
        g.row(8, cx, "ddd")
    g.row(9, 1, "wwwwwwwwwwwwww")
    g.row(10, 1, "wwwwwwwwwwwwww")
    g.row(11, 2, "tttttttttttt")
    return g


PROPS = {
    'cookie_signature': ("Signature cookie (Nutella + sea salt)", cookie_signature),
    'cookie_bitten': ("Bitten cookie", cookie_bitten),
    'cookie_split': ("Molten split cookie", cookie_split),
    'cookie_dough': ("Raw dough ball", cookie_dough),
    'cookie_golden': ("Golden cookie (power-up)", cookie_golden),
    'cookie_burnt': ("Burnt cookie (penalty)", cookie_burnt),
    'crumbs': ("Crumb particles", crumbs),
    'nutella_jar': ("Nutella jar", nutella_jar),
    'salt_shaker': ("Sea salt shaker", salt_shaker),
    'milk_glass': ("Glass of milk", milk_glass),
    'cookie_tray': ("Cookie tray", cookie_tray),
    'heart': ("Heart / life", heart),
    'star': ("Star / score", star),
    'chef_hat': ("Chef hat icon", chef_hat_icon),
}
