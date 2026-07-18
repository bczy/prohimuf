"""Generate the muf crew bitmap: 19 pixel-art Claudes, one per project agent.

Default run writes the group poster (docs/muf-crew.png). `--singles` skips the
poster and writes one transparent RGBA sprite per crew member (1 sprite px =
1 image px) to docs/diagrams/crew/<slug>.png (override with $CREW_OUTDIR) —
consumed by docs/diagrams/agents-pipeline-infographic.html, which upscales
them with `image-rendering: pixelated`.
"""
import os, sys, zlib, struct

SCALE = 10          # sprite pixel -> image px
CW, CH = 22, 20     # cell size in sprite pixels
COLS, ROWS = 5, 4   # 19 agents fit in 20 cells (last cell left empty)
M = 30              # outer margin
GAP_X, GAP_Y = 14, 16
TS = 3              # label font scale (role + persona)
MS = 2              # model tag font scale (smaller third line)

BG = (31, 31, 29)
PANEL = (44, 44, 41)
PANEL_EDGE = (24, 24, 22)

PAL = {
    'B': (217, 119, 87),   # coral body (Claude)
    'E': (28, 26, 24),     # eyes
    'K': (12, 12, 12),     # black accessory
    'W': (240, 240, 233),  # white
    'S': (152, 152, 148),  # gray
    'G': (170, 255, 40),   # acid green
    'C': (80, 220, 255),   # cyan
    'P': (255, 80, 180),   # magenta
    'Y': (255, 210, 60),   # yellow
    'R': (235, 70, 60),    # red
    'U': (95, 125, 255),   # blue
    'N': (170, 120, 70),   # wood
    'O': (255, 150, 50),   # orange
    'F': (238, 190, 152),  # skin (human)
    'H': (82, 56, 36),     # hair (human)
}

# Which model backs each agent (shown as the third label line on the poster).
# Tiering rationale lives in docs/adr/0038-agent-capability-upgrade.md.
MODELS = {
    "pm": "SONNET 5",
    "producer": "HAIKU 4.5",
    "senior-architect": "OPUS 4.8",
    "lead-game-designer": "OPUS 4.8",
    "game-designer": "OPUS 4.8",
    "narrative-designer": "OPUS 4.8",
    "ux-designer": "SONNET 5",
    "qa-lead": "OPUS 4.8",
    "dev-gameplay": "OPUS 4.8",
    "dev-r3f-render": "OPUS 4.8",
    "dev-tooling-assets": "SONNET 5",
    "lead-art": "OPUS 4.8",
    "art-advisor": "SONNET 5",
    "concept-artist": "OPUS 4.8",
    "game-graphist": "SONNET 5",
    "gpu-specialist": "OPUS 4.8",
    "tech-writer": "SONNET 5",
    "sound-designer": "SONNET 5",
    "tech-scout": "OPUS 4.8",
}
# Tier -> palette key for the model tag color.
MODEL_COLOR = {"OPUS": 'G', "SONNET": 'C', "HAIKU": 'Y', "HUMAIN": 'F'}

BASE = [
    "..BB......BB..",
    "..BB......BB..",
    ".BBBBBBBBBBBB.",
    ".BBBBBBBBBBBB.",
    ".BBEEBBBBEEBB.",
    ".BBBBBBBBBBBB.",
    "BBBBBBBBBBBBBB",
    "BBBBBBBBBBBBBB",
    ".BBBBBBBBBBBB.",
    ".BBBBBBBBBBBB.",
    "..BB.BB.BB.BB.",
    "..BB.BB.BB.BB.",
]
SPRITE_OX, SPRITE_OY = 4, 5

# (slug = crew/<slug>.png filename, role label, persona label, overlays)
AGENTS = [
    ("pm", "PM", "JOHN", [
        (["W..W"], 9, 10),                                             # collar
        (["RR", "RR", "RR", "RR"], 10, 11),                            # tie
        ([".SS.", "WWWW", "WKKW", "WWWW", "WKKW", "WWWW"], 18, 7),      # clipboard
    ]),
    ("producer", "PRODUCER", "MARION", [
        (["SSSSSSSSSS"], 6, 4),                                        # headset band
        (["SS", "SS"], 4, 8), (["SS", "SS"], 16, 8),                   # ear cups
        (["S.", "S.", "SO"], 3, 10),                                   # mic
        (["SSSS", "SRYS", "SGYS", "SSSS"], 0, 8),                      # kanban board
    ]),
    ("senior-architect", "ARCHITECT", "WINSTON", [
        (["KKKK", "K..K", "KKKK"], 6, 8),                              # glasses L
        (["KKKK", "K..K", "KKKK"], 12, 8),                             # glasses R
        (["KK"], 10, 9),                                               # bridge
        (["UUUU", "UWWU", "UUWU", "UUUU"], 18, 8),                     # blueprint
    ]),
    ("lead-game-designer", "LEAD GAME DESIGN", "KARIM", [
        (["GGGGGGGGGG"], 6, 4),                                        # sweatband
        (["N", "N", "N", "N", "N", "N", "N", "N"], 18, 5),             # flag pole
        (["GGG", "GGG"], 19, 5),                                       # design-gate flag
    ]),
    ("game-designer", "GAME DESIGNER", "SACHA", [
        (["SSSSSS", "SKSGRS"], 8, 14),                                 # gamepad
        (["WWW", "WKW", "WWW"], 0, 13),                                # die
    ]),
    ("narrative-designer", "NARRATIVE", "YASMINE", [
        (["...W", "..WW", ".WW.", "YW.."], 17, 1),                     # quill
        (["PPPP", "PWWP", "PWWP", "PPPP"], 0, 9),                      # lore book
    ]),
    ("ux-designer", "UX DESIGN", "TONY", [
        (["KKKK", "KCCK", "KCCK", "KCCK", "KKKK"], 0, 8),              # phone
        (["W....", "WW...", "WWW..", "WWWW.", "..W..", "..WW."], 17, 4),  # pointer
        (["GG"], 18, 12), (["SS"], 20, 12),                            # toggle ON
    ]),
    ("qa-lead", "QA LEAD", "INES", [
        ([".SS.", "SCCS", "SCCS", ".SS."], 17, 5),                     # magnifier
        (["S"], 20, 9), (["S"], 21, 10),                               # handle
        ([".G.", "GGG", "G.G"], 0, 14),                                # the bug
    ]),
    ("dev-gameplay", "DEV GAMEPLAY", "AMELIA", [
        (["....G", "...GG", "G.GG.", "GGG..", ".G..."], 8, 10),        # TDD check
        (["KKKK", "KG.K", "K..K", "KKKK"], 18, 8),                     # terminal
        (["R"], 18, 6), (["G"], 20, 6),                                # red/green tests
    ]),
    ("dev-r3f-render", "DEV RENDER", "AMELIA", [
        (["CCCCCCCCCC", "CCCCCCCCCC"], 6, 8),                          # neon visor
        (["K", "K"], 5, 8), (["K", "K"], 16, 8),                       # visor edges
        (["PPPP", "P..P", "P..P", "PPPP"], 17, 3),                     # 3D wire cube
    ]),
    ("dev-tooling-assets", "DEV TOOLING", "AMELIA", [
        (["UUUUUUUUUU"], 6, 3),                                        # backwards cap
        (["UUUUUUUUUUUU"], 4, 4),                                      # cap + brim behind
        (["S.S", "SSS", ".S.", ".S.", ".S.", ".S."], 18, 6),           # wrench
    ]),
    ("lead-art", "LEAD ART", "NICO", [
        ([".KKKKKK."], 6, 3), (["KKKKKKKK"], 6, 4), (["K"], 9, 2),     # beret
        (["N", "N", "N", "N", "S", "P", "P"], 19, 6),                  # brush
        (["P"], 19, 14),                                               # paint drip
    ]),
    ("art-advisor", "ART ADVISOR", "ESTELLE", [
        (["YYYY", "Y..Y", "YYYY"], 12, 8),                             # monocle
        (["Y"], 16, 11), (["Y"], 17, 12), (["Y"], 17, 13),             # chain
        (["KKKK", "KPPK", "KPPK", "KKKK"], 0, 8),                      # 90s rave vinyl
    ]),
    ("concept-artist", "CONCEPT ARTIST", "MAUD", [
        (["Y"], 11, 1), (["Y"], 9, 2), (["Y"], 13, 2), (["W"], 11, 2), # idea sparks
        (["PP", "YY", "YY", "YY", "YY", "NN", ".K"], 19, 5),           # pencil
    ]),
    ("game-graphist", "GAME GRAPHIST", "SERGE", [
        (["SSSSSSSS"], 7, 3), (["SSSSSSSSSSS"], 6, 4),                 # flat cap (ST era)
        (["W....", "WW...", "WWW..", "WWWW.", "WWWWW", "..W..", "..WW."], 17, 6),  # cursor
    ]),
    ("gpu-specialist", "GPU PERF", "BEN", [
        (["....S.", ".RRRS.", "RRRRR.", "K...K.", "K...K."], 0, 12),   # the moto
        (["KKKK", "KGGK", "KKKK"], 18, 5),                             # GPU chip
        (["G"], 18, 9), (["G"], 19, 10), (["G"], 20, 9),               # frame graph
    ]),
    ("tech-writer", "TECH WRITER", "OTIS", [
        ([".SS.", "WWWW", "WKKW", "WWWW", "WKKW", "WWWW"], 0, 7),      # the doc
        (["PP", "YY", "YY", "YY", "NN", ".K"], 19, 4),                 # pen
        (["KKKKKKKK"], 7, 9),                                          # reading shades
    ]),
    ("sound-designer", "SOUND DESIGNER", "MALIK", [
        (["UUUUUU"], 8, 3), (["UU"], 6, 4), (["UU"], 14, 4),           # headphone band
        (["UU", "UU", "UU"], 3, 8), (["UU", "UU", "UU"], 17, 8),       # big cups
        ([".G", ".G", ".G", "GG"], 19, 2),                             # note R
        ([".W", ".W", "WW"], 0, 4),                                    # note L
    ]),
    ("tech-scout", "TECH SCOUT", "NADIA", [
        (["KKKK", "KCCK", "KCCK", "KKKK"], 4, 8),                      # binocular barrel L
        (["KKKK", "KCCK", "KCCK", "KKKK"], 11, 8),                     # binocular barrel R
        (["KK"], 9, 9),                                                # bridge
        (["S"], 3, 10), (["S"], 2, 11),                                # strap L
        (["S"], 15, 10), (["S"], 16, 11),                              # strap R
        (["C"], 19, 2), (["S"], 19, 3), (["S"], 19, 4), (["K"], 19, 5), # spyglass
    ]),
]

# trambz: the one human in the crew (not a Claude)
HUMAN = [
    "....HHHHHH....",
    "....HHHHHH....",
    "....HFFFFH....",
    "....FFFFFF....",
    "....FFFFFF....",
    ".....FFFF.....",
    "...KKKKKKKK...",
    "..KKGGGGGGKK..",
    "..KKGGGGGGKK..",
    "..FF.UUUU.FF..",
    ".....UU.UU....",
    "....WWW.WWW...",
]

CEO = ("TRAMBZ", "CEO", [
    (["Y.Y.Y."], 8, 3), (["YYYYYY"], 8, 4),                            # gold crown
    (["KKKKKK"], 8, 8),                                                # shades
    (["S"], 20, 7), (["S"], 19, 8),                                    # steam
    (["WWW.", "WWWW", "WWW."], 18, 9),                                 # coffee mug
])

FONT = {
    'A': ["010", "101", "111", "101", "101"],
    'B': ["110", "101", "110", "101", "110"],
    'C': ["011", "100", "100", "100", "011"],
    'D': ["110", "101", "101", "101", "110"],
    'E': ["111", "100", "110", "100", "111"],
    'F': ["111", "100", "110", "100", "100"],
    'G': ["011", "100", "101", "101", "011"],
    'H': ["101", "101", "111", "101", "101"],
    'I': ["111", "010", "010", "010", "111"],
    'J': ["001", "001", "001", "101", "010"],
    'K': ["101", "101", "110", "101", "101"],
    'L': ["100", "100", "100", "100", "111"],
    'M': ["101", "111", "111", "101", "101"],
    'N': ["110", "101", "101", "101", "101"],
    'O': ["111", "101", "101", "101", "111"],
    'P': ["111", "101", "111", "100", "100"],
    'Q': ["111", "101", "101", "111", "001"],
    'R': ["111", "101", "110", "101", "101"],
    'S': ["011", "100", "010", "001", "110"],
    'T': ["111", "010", "010", "010", "010"],
    'U': ["101", "101", "101", "101", "111"],
    'V': ["101", "101", "101", "101", "010"],
    'W': ["101", "101", "111", "111", "101"],
    'X': ["101", "101", "010", "101", "101"],
    'Y': ["101", "101", "010", "010", "010"],
    'Z': ["111", "001", "010", "100", "111"],
    '1': ["010", "110", "010", "010", "111"],
    '4': ["101", "101", "111", "001", "001"],
    '5': ["111", "100", "110", "001", "110"],
    '8': ["111", "101", "111", "101", "111"],
    '9': ["111", "101", "111", "001", "111"],
    ' ': ["000", "000", "000", "000", "000"],
    '-': ["000", "000", "111", "000", "000"],
    '.': ["000", "000", "000", "000", "010"],
}

# ---------- canvas helpers ----------

def make_canvas(w, h, color):
    row = bytearray()
    for _ in range(w):
        row += bytes(color)
    return [bytearray(row) for _ in range(h)], w, h

def px(canvas, w, h, x, y, color):
    if 0 <= x < w and 0 <= y < h:
        canvas[y][3 * x:3 * x + 3] = bytes(color)

def rect(canvas, w, h, x0, y0, rw, rh, color):
    for y in range(y0, y0 + rh):
        for x in range(x0, x0 + rw):
            px(canvas, w, h, x, y, color)

def text_width(s, ts):
    return len(s) * 4 * ts - ts if s else 0

def draw_text(canvas, w, h, x, y, s, color, ts):
    cx = x
    for ch in s:
        glyph = FONT.get(ch, FONT[' '])
        for gy, grow in enumerate(glyph):
            for gx, bit in enumerate(grow):
                if bit == '1':
                    rect(canvas, w, h, cx + gx * ts, y + gy * ts, ts, ts, color)
        cx += 4 * ts

# ---------- build ----------

def build_cell(base, overlays):
    cell = [[None] * CW for _ in range(CH)]
    def blit(patch, ox, oy):
        for py_, row in enumerate(patch):
            for px_, ch in enumerate(row):
                if ch != '.' and 0 <= oy + py_ < CH and 0 <= ox + px_ < CW:
                    cell[oy + py_][ox + px_] = ch
    blit(base, SPRITE_OX, SPRITE_OY)
    for patch, ox, oy in overlays:
        blit(patch, ox, oy)
    return cell

cell_w = CW * SCALE
cell_h = CH * SCALE
label_h = 2 * (5 * TS + 5) + (5 * MS + 5) + 6
block_h = cell_h + label_h
top_h = block_h + 24     # top band: title + CEO panel

img_w = 2 * M + COLS * cell_w + (COLS - 1) * GAP_X
img_h = 2 * M + top_h + ROWS * block_h + (ROWS - 1) * GAP_Y

# color_type 2 = RGB (poster), 6 = RGBA (transparent single sprites)
def write_png(path, rows, w, h, color_type=2):
    raw = b''.join(b'\x00' + bytes(row) for row in rows)
    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data))
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, color_type, 0, 0, 0)))
        f.write(chunk(b'IDAT', zlib.compress(raw, 9)))
        f.write(chunk(b'IEND', b''))

if "--singles" not in sys.argv:  # poster mode (default)
    canvas, W, H = make_canvas(img_w, img_h, BG)

    GOLD_EDGE = (150, 120, 30)

    def draw_block(bx, by, role, persona, model, base, overlays, edge):
        rect(canvas, W, H, bx - 2, by - 2, cell_w + 4, block_h + 4, edge)
        rect(canvas, W, H, bx, by, cell_w, block_h, PANEL)
        cell = build_cell(base, overlays)
        for cy in range(CH):
            for cx in range(CW):
                key = cell[cy][cx]
                if key:
                    rect(canvas, W, H, bx + cx * SCALE, by + cy * SCALE, SCALE, SCALE, PAL[key])
        ly = by + cell_h + 4
        rw_ = text_width(role, TS)
        draw_text(canvas, W, H, bx + (cell_w - rw_) // 2, ly, role, PAL['W'], TS)
        if persona:
            pw_ = text_width(persona, TS)
            draw_text(canvas, W, H, bx + (cell_w - pw_) // 2, ly + 5 * TS + 5,
                      persona, PAL['B'], TS)
        if model:
            mcol = PAL[MODEL_COLOR.get(model.split()[0], 'S')]
            mw_ = text_width(model, MS)
            draw_text(canvas, W, H, bx + (cell_w - mw_) // 2, ly + 2 * (5 * TS + 5),
                      model, mcol, MS)

    # title, vertically centered in the top band
    title = "MUF CREW"
    sub = "LES 19 CLAUDES DU PROJET"
    ty = M + (block_h - (5 * 6 + 12 + 5 * TS)) // 2
    tw = text_width(title, 6)
    draw_text(canvas, W, H, (img_w - tw) // 2, ty, title, PAL['B'], 6)
    sw = text_width(sub, TS)
    draw_text(canvas, W, H, (img_w - sw) // 2, ty + 5 * 6 + 12, sub, PAL['G'], TS)

    # model legend (color -> tier), so the third label line reads at a glance
    legend = [("OPUS 4.8", 'G'), ("SONNET 5", 'C'), ("HAIKU 4.5", 'Y')]
    gap_l = 5 * MS
    total_l = sum(text_width(t, MS) for t, _ in legend) + gap_l * (len(legend) - 1)
    lx = (img_w - total_l) // 2
    ly_l = ty + 5 * 6 + 12 + 5 * TS + 8
    for t, c in legend:
        draw_text(canvas, W, H, lx, ly_l, t, PAL[c], MS)
        lx += text_width(t, MS) + gap_l

    # the boss, top right — the one human in the crew
    role, persona, overlays = CEO
    draw_block(img_w - M - cell_w, M, role, persona, "HUMAIN", HUMAN, overlays, GOLD_EDGE)

    for i, (slug, role, persona, overlays) in enumerate(AGENTS):
        col, row = i % COLS, i // COLS
        bx = M + col * (cell_w + GAP_X)
        by = M + top_h + row * (block_h + GAP_Y)
        draw_block(bx, by, role, persona, MODELS[slug], BASE, overlays, PANEL_EDGE)


    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "muf-crew.png")
    write_png(out, canvas, W, H)
    print(f"wrote {out} ({W}x{H})")

# ---------- singles mode (one transparent sprite per crew member) ----------

def write_single(path, base, overlays):
    cell = build_cell(base, overlays)
    rows = []
    for cy in range(CH):
        row = bytearray()
        for cx in range(CW):
            key = cell[cy][cx]
            row += (bytes(PAL[key]) + b'\xff') if key else b'\x00\x00\x00\x00'
        rows.append(row)
    write_png(path, rows, CW, CH, color_type=6)

if "--singles" in sys.argv:
    outdir = os.environ.get("CREW_OUTDIR") or os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "diagrams", "crew")
    os.makedirs(outdir, exist_ok=True)
    for slug, _role, _persona, overlays in AGENTS:
        write_single(os.path.join(outdir, f"{slug}.png"), BASE, overlays)
    write_single(os.path.join(outdir, "trambz.png"), HUMAN, CEO[2])
    print(f"wrote {len(AGENTS) + 1} sprites to {outdir}")
