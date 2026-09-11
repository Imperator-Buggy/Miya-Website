"""Miya character sprites. 32x32 base grid, transparent background.

Placeholder chars are remapped per outfit at build time:
  1 = apron / skirt primary
  2 = sleeves / bodice secondary
  3 = trim / hem accent
  4 = headwear primary
  5 = headwear accent
"""
from art_lib import Grid

W = 32

# ---------------------------------------------------------------- head (rows 0-14)
HEAD = [
    "................................",  # 0
    "................................",  # 1
    "................................",  # 2
    "................................",  # 3
    "...........HHHHHHHHHH...........",  # 4
    "..........HHHHHHHHHHHH..........",  # 5
    "..........HHSSSSSSSSHH..........",  # 6
    ".........HHHSSSSSSSSHHH.........",  # 7
    ".........HHHSKKSSKKSHHH.........",  # 8  closed happy eyes
    ".........HHHSSSSSSSSHHH.........",  # 9
    ".........HHHPSSKKSSPHHH.........",  # 10 blush + smile
    "........HHHHSSSSSSSSHHHH........",  # 11
    "........HHHHHSSSSSSHHHHH........",  # 12
    ".......HHHHHHHSSSSHHHHHHH.......",  # 13
    ".......HHHHHHHssssHHHHHHH.......",  # 14
]


def head_grid():
    g = Grid(W, W)
    for y, r in enumerate(HEAD):
        g.row(y, 0, r)
    return g


def head_yawn(g):
    """Sleepy variant of the face: small open yawn."""
    g.row(10, 12, "PSSKKSSP")
    g.px(15, 11, 'K'); g.px(16, 11, 'K')
    return g




# ---------------------------------------------------------------- face variants
def _clear_face(g):
    g.row(8, 12, "SSSSSSSS")
    g.row(9, 12, "SSSSSSSS")
    g.row(10, 12, "SSSSSSSS")
    g.row(11, 12, "SSSSSSSS")
    g.row(12, 13, "SSSSSS")
    return g


def _blush(g, y=10):
    g.px(12, y, 'P'); g.px(19, y, 'P')


def _smile_arc(g, y):
    """corners one row up, base two px wide -> reads as a warm smile."""
    g.px(14, y, 'K'); g.px(17, y, 'K')
    g.px(15, y + 1, 'K'); g.px(16, y + 1, 'K')


def face_closed(g):
    """v1: happy closed eyes, straight from the logo."""
    return g


def face_A(g):
    """Open round eyes + smile arc."""
    _clear_face(g)
    g.row(8, 13, "KK"); g.row(8, 17, "KK")
    g.row(9, 13, "KK"); g.row(9, 17, "KK")
    g.px(13, 8, 'W'); g.px(17, 8, 'W')
    _blush(g, 10); _smile_arc(g, 11)
    return g


def face_B(g):
    """Tall cozy eyes + smile arc, dropped a row."""
    _clear_face(g)
    for y in (8, 9, 10):
        g.row(y, 13, "KK"); g.row(y, 17, "KK")
    g.px(13, 8, 'W'); g.px(17, 8, 'W')
    _blush(g, 11); _smile_arc(g, 12)
    return g


def face_C(g):
    """Half-lidded, relaxed: lid line over a soft brown eye."""
    _clear_face(g)
    g.row(8, 12, "KKK"); g.row(8, 17, "KKK")
    g.row(9, 13, "ee"); g.row(9, 17, "ee")
    g.px(13, 9, 'W'); g.px(17, 9, 'W')
    _blush(g, 10); _smile_arc(g, 11)
    return g


def face_D(g):
    """Round eyes + open 'oh' mouth."""
    _clear_face(g)
    g.row(8, 13, "KK"); g.row(8, 17, "KK")
    g.row(9, 13, "KK"); g.row(9, 17, "KK")
    g.px(13, 8, 'W'); g.px(17, 8, 'W')
    _blush(g, 11)
    g.row(11, 15, "KK"); g.row(12, 15, "KK")
    return g


def face_E(g):
    """Warm brown iris, black lid -- softest read."""
    _clear_face(g)
    g.row(8, 13, "KK"); g.row(8, 17, "KK")
    g.row(9, 13, "ee"); g.row(9, 17, "ee")
    g.px(13, 8, 'W'); g.px(17, 8, 'W')
    _blush(g, 10); _smile_arc(g, 11)
    return g


def face_F(g):
    """Wide-set big eyes, more room to breathe."""
    _clear_face(g)
    g.row(8, 12, "KK"); g.row(8, 18, "KK")
    g.row(9, 12, "KK"); g.row(9, 18, "KK")
    g.px(12, 8, 'W'); g.px(18, 8, 'W')
    g.px(11, 10, 'P'); g.px(20, 10, 'P')
    _smile_arc(g, 11)
    return g


FACES = {
    'closed': ("v1 - closed", face_closed),
    'A': ("A - round + smile", face_A),
    'B': ("B - tall cozy", face_B),
    'C': ("C - half-lidded", face_C),
    'D': ("D - round + oh", face_D),
    'E': ("E - warm brown iris", face_E),
    'F': ("F - wide-set", face_F),
}


# ---------------------------------------------------------------- torso
def torso(g):
    # hair falling past the shoulders
    g.row(15, 7, "HHHHHH"); g.row(15, 19, "HHHHHH")
    g.row(16, 6, "HHHHH"); g.row(16, 21, "HHHHH")
    g.row(17, 6, "HHHHH"); g.row(17, 21, "HHHHH")
    g.row(18, 7, "HHH"); g.row(18, 22, "HHH")
    # bodice + apron
    g.row(15, 13, "222222")
    g.row(16, 11, "2222222222")
    g.row(17, 11, "2111111112")
    g.row(18, 11, "2111111112")
    g.row(19, 11, "1111111111")
    g.row(20, 11, "1111111111")
    g.row(21, 11, "1111111111")
    g.row(22, 11, "1111111111")
    g.row(23, 11, "1113333111")
    g.row(24, 10, "111111111111")
    g.row(25, 10, "333333333333")
    return g


# ---------------------------------------------------------------- legs
def legs_stand(g):
    for y in (26, 27, 28):
        g.row(y, 12, "SSS"); g.row(y, 17, "SSS")
    for y in (29, 30):
        g.row(y, 11, "KKKK"); g.row(y, 17, "KKKK")
    return g


def legs_apart(g):
    for y in (26, 27, 28):
        g.row(y, 10, "SSS"); g.row(y, 19, "SSS")
    for y in (29, 30):
        g.row(y, 9, "KKKK"); g.row(y, 19, "KKKK")
    return g


def legs_run(g):
    g.row(26, 16, "SSS"); g.row(27, 17, "SSS"); g.row(28, 18, "SSS")
    g.row(29, 18, "KKKK"); g.row(30, 18, "KKKK")
    g.row(26, 12, "SSS"); g.row(27, 11, "SSS"); g.row(28, 11, "SSS")
    g.row(29, 10, "KKKK"); g.row(30, 10, "KKKK")
    g.px(6, 30, 'd'); g.px(7, 29, 'c'); g.px(24, 30, 'd')
    return g


# ---------------------------------------------------------------- arms
def _hand(g, x, y):
    g.row(y, x, "SSS")
    g.row(y + 1, x, "SSS")
    g.px(x + 1, y + 2, 'S')


def arms_down(g):
    for y in (18, 19, 20):
        g.row(y, 9, "22"); g.row(y, 21, "22")
    g.row(21, 9, "SS"); g.row(21, 21, "SS")
    g.px(9, 22, 'S'); g.px(22, 22, 'S')
    return g


def arms_wave(g):
    for y in (18, 19, 20):
        g.row(y, 9, "22")
    g.row(21, 9, "SS"); g.px(9, 22, 'S')
    g.row(18, 21, "22")
    g.row(17, 22, "22")
    g.row(16, 23, "22")
    g.row(15, 23, "22")
    g.row(14, 24, "22")
    g.row(13, 24, "22")
    g.rect(23, 10, 25, 12, 'S')
    g.px(28, 9, 'k'); g.px(29, 11, 'k'); g.px(28, 13, 'k')
    return g


def arms_forward(g):
    g.row(19, 9, "22"); g.row(19, 21, "22")
    g.row(20, 7, "2222"); g.row(20, 21, "2222")
    g.row(21, 6, "SS"); g.row(21, 24, "SS")
    return g


def arms_up(g):
    g.row(18, 9, "22"); g.row(17, 8, "22"); g.row(16, 7, "22"); g.row(15, 7, "22")
    g.row(14, 6, "22"); g.row(13, 6, "22")
    _hand(g, 5, 10)
    g.row(18, 21, "22"); g.row(17, 22, "22"); g.row(16, 23, "22"); g.row(15, 23, "22")
    g.row(14, 24, "22"); g.row(13, 24, "22")
    _hand(g, 24, 10)
    for x, y in ((3, 8), (28, 8), (4, 14), (27, 14)):
        g.px(x, y, 'G')
    return g


def arms_run(g):
    g.row(18, 9, "22"); g.row(19, 8, "22"); g.row(20, 7, "22")
    g.row(21, 7, "SS")
    g.row(18, 21, "22"); g.row(17, 22, "22"); g.row(16, 22, "22")
    g.row(15, 22, "SS")
    return g


def arms_hero(g):
    for y in (18, 19, 20):
        g.row(y, 9, "22")
    g.row(21, 9, "SS"); g.px(9, 22, 'S')
    g.row(18, 21, "22"); g.row(17, 22, "22"); g.row(16, 23, "22")
    g.row(15, 23, "22"); g.row(14, 24, "22")
    g.row(13, 24, "SS")
    return g


def arms_bowl(g):
    g.row(18, 9, "22"); g.row(19, 8, "22"); g.row(20, 8, "SS")
    g.row(18, 21, "22"); g.row(17, 22, "22"); g.row(16, 22, "22")
    g.row(15, 23, "SS")
    return g


# ---------------------------------------------------------------- in-pose props
def mini_cookie(g, x, y):
    g.row(y, x + 1, "ddd")
    g.row(y + 1, x, "dcNcd")
    g.row(y + 2, x, "dccXd")
    g.row(y + 3, x, "dcNcd")
    g.row(y + 4, x + 1, "ddd")
    return g


def big_cookie(g, x, y):
    g.row(y, x + 2, "dddd")
    g.row(y + 1, x, "ddccccdd")
    g.row(y + 2, x, "dcNccNcd")
    g.row(y + 3, x, "dcccXccd")
    g.row(y + 4, x, "dcNccccd")
    g.row(y + 5, x, "ddcXNcdd")
    g.row(y + 6, x + 2, "dddd")
    return g


def bowl(g):
    g.row(19, 9, "KKKKKKKKKKKKKK")
    g.row(20, 9, "KnnnnnnnnnnnnK")
    g.row(21, 9, "KnnXnnnnnXnnnK")
    g.row(22, 9, "KBBBBBBBBBBBBK")
    g.row(23, 10, "KBBBBBBBBBBK")
    g.row(24, 11, "KBBBBBBBBK")
    g.row(25, 12, "KBBBBBBK")
    g.row(26, 13, "KKKKKK")
    g.px(11, 23, 'W'); g.px(12, 24, 'W')
    return g


def spoon(g):
    for y, x in ((14, 24), (13, 24), (12, 25), (11, 25)):
        g.px(x, y, 'e'); g.px(x + 1, y, 'd')
    g.row(10, 24, "eeee")
    g.row(9, 24, "eccе".replace('е', 'e'))
    g.row(8, 25, "ee")
    g.px(25, 9, 'N'); g.px(26, 9, 'N'); g.px(26, 10, 'N')
    g.px(24, 7, 'N'); g.px(23, 6, 'n')
    return g


# ---------------------------------------------------------------- hats
def hat_chef():
    g = Grid(W, W)
    g.row(0, 11, "444"); g.row(0, 15, "44"); g.row(0, 18, "444")
    g.row(1, 10, "444444444444")
    g.row(2, 9, "44444444444444")
    g.row(3, 9, "44444444444444")
    g.row(4, 10, "444444444444")
    g.row(5, 10, "555555555555")
    g.px(21, 2, '5'); g.px(21, 3, '5'); g.px(13, 1, '5')
    return g


def hat_bandana():
    g = Grid(W, W)
    g.row(3, 12, "44444444")
    g.row(4, 10, "444444444444")
    g.row(5, 10, "455555555554")
    g.row(3, 22, "44"); g.row(4, 22, "444"); g.row(5, 23, "44")
    g.px(13, 4, '5')
    return g


def hat_nightcap():
    g = Grid(W, W)
    g.row(0, 23, "555"); g.row(1, 23, "555")
    g.row(2, 20, "4444")
    g.row(3, 13, "444"); g.row(3, 16, "444444")
    g.row(4, 10, "444444444444")
    g.row(5, 10, "555555555555")
    g.px(18, 2, '4'); g.px(19, 2, '4')
    return g


def hat_party():
    g = Grid(W, W)
    g.row(0, 15, "55")
    g.row(1, 14, "4444")
    g.row(2, 13, "455554")
    g.row(3, 12, "44444444")
    g.row(4, 11, "4455554444")
    g.row(5, 10, "555555555555")
    return g


def hat_beanie():
    g = Grid(W, W)
    g.row(1, 14, "5555")
    g.row(2, 11, "4444444444")
    g.row(3, 10, "444444444444")
    g.row(4, 10, "444444444444")
    g.row(5, 10, "555555555555")
    g.px(20, 3, '5')
    return g


HATS = {
    'chef': hat_chef,
    'bandana': hat_bandana,
    'nightcap': hat_nightcap,
    'party': hat_party,
    'beanie': hat_beanie,
}

# ---------------------------------------------------------------- outfits
OUTFITS = {
    'classic': ("Classic Chef", 'chef',
                {'1': 'W', '2': 'e', '3': 'w', '4': 'W', '5': 'w'}, None),
    'kraft': ("Kraft Apron", 'bandana',
              {'1': 'T', '2': 'W', '3': 'K', '4': 'R', '5': 'R'}, None),
    'midnight': ("Midnight Batch", 'nightcap',
                 {'1': 'L', '2': 'B', '3': 'W', '4': 'L', '5': 'W'}, None),
    'sprinkle': ("Sprinkle Party", 'party',
                 {'1': 'p', '2': 'W', '3': 'G', '4': 'p', '5': 'G'}, 'sprinkle'),
    'nutella': ("Nutella & Sea Salt", 'chef',
                {'1': 'N', '2': 'n', '3': 'X', '4': 'X', '5': 'N'}, 'salt'),
    'barista': ("Cocoa Barista", 'beanie',
                {'1': 'M', '2': 'W', '3': 't', '4': 'B', '5': 'W'}, None),
}


def add_speckle(g, kind):
    pts = [(12, 21), (18, 21), (14, 22), (19, 24), (12, 24), (16, 20), (20, 22), (11, 19)]
    for x, y in pts:
        if g.g[y][x] == '1':
            g.px(x, y, 'X' if kind == 'salt' else 'G')
    return g


# ---------------------------------------------------------------- poses
def pose_idle(g):
    torso(g); arms_down(g); legs_stand(g)


def pose_wave(g):
    torso(g); arms_wave(g); legs_stand(g)


def pose_tray(g):
    torso(g); arms_forward(g); legs_stand(g)
    for x in (7, 13, 19):
        mini_cookie(g, x, 17)
    g.row(22, 6, "KKKKKKKKKKKKKKKKKKKK")
    g.row(23, 7, "wwwwwwwwwwwwwwwwww")


def pose_mix(g):
    torso(g); arms_bowl(g); legs_stand(g)
    bowl(g); spoon(g)


def pose_cheer(g):
    torso(g); arms_up(g); legs_apart(g)


def pose_run(g):
    torso(g); arms_run(g); legs_run(g)


def pose_hero(g):
    torso(g); arms_hero(g); legs_stand(g)
    big_cookie(g, 21, 6)
    for x, y in ((19, 5), (30, 8), (29, 14)):
        g.px(x, y, 'G')


def pose_sleepy(g):
    head_yawn(g)
    torso(g)
    g.row(18, 9, "22"); g.row(17, 9, "22"); g.row(16, 10, "22")
    g.row(14, 10, "SS"); g.row(15, 10, "SS")
    g.row(18, 21, "22"); g.row(19, 21, "22"); g.row(20, 21, "22")
    g.row(21, 21, "SS")
    g.row(21, 23, "KKKK")
    g.row(22, 23, "KnnK")
    g.row(23, 23, "KnnK")
    g.row(24, 23, "KKKK")
    g.px(27, 22, 'K'); g.px(27, 23, 'K')
    g.px(24, 19, 'w'); g.px(25, 20, 'w')
    legs_stand(g)


POSES = {
    'idle': ("Idle / storefront greeter", pose_idle),
    'wave': ("Wave / onboarding hello", pose_wave),
    'tray': ("Tray of cookies / delivery", pose_tray),
    'mix': ("Mixing bowl / crafting", pose_mix),
    'cheer': ("Cheer / combo celebration", pose_cheer),
    'run': ("Run cycle key / endless runner", pose_run),
    'hero': ("Hero cookie lift / win screen", pose_hero),
    'sleepy': ("Sleepy midnight batch / idle timeout", pose_sleepy),
}


def build(pose_key, outfit_key, face='closed'):
    label_o, hat_key, mapping, speckle = OUTFITS[outfit_key]
    g = head_grid()
    FACES[face][1](g)
    POSES[pose_key][1](g)
    g.stamp(HATS[hat_key](), 0, 0)
    if speckle:
        add_speckle(g, speckle)
    return g.replace(mapping)
