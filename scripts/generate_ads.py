# -*- coding: utf-8 -*-
"""
Al Madim Ad Generator v2 — Premium ads with real IDF soldier photos.
Uses python-bidi for correct Hebrew RTL rendering.
"""
import os
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from bidi.algorithm import get_display

BASE = Path(__file__).resolve().parent.parent
ASSETS = BASE / "src" / "assets" / "idf"
OUT = BASE / "public" / "ads"
OUT.mkdir(parents=True, exist_ok=True)

# ── Colors ──
GREEN = (74, 222, 128)
DARK_GREEN = (20, 46, 20)
DARKER_GREEN = (14, 28, 14)
NEAR_BLACK = (8, 10, 8)
WHITE = (255, 255, 255)
MUTED = (160, 180, 160)

# ── Fonts ──
def find_font(names, size):
    font_dir = Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts"
    for name in names:
        for ext in (".ttf", ".ttc"):
            p = font_dir / f"{name}{ext}"
            if p.exists():
                return ImageFont.truetype(str(p), size)
    return ImageFont.truetype("arial.ttf", size)

def F(size, bold=False):
    if bold:
        return find_font(["arialbd", "segoeuib"], size)
    return find_font(["arial", "segoeui"], size)

def he(text):
    return get_display(text)

# ── Helpers ──
def crop_cover(img, tw, th, fy=0.35):
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    left = (nw - tw) // 2
    top = max(0, min(int((nh - th) * fy), nh - th))
    return img.crop((left, top, left + tw, top + th))

def dark_overlay(img, opacity=0.55):
    ov = Image.new("RGBA", img.size, (6, 8, 6, int(255 * opacity)))
    return Image.alpha_composite(img.convert("RGBA"), ov)

def gradient_bottom(img, ratio=0.6, color=(6, 10, 6)):
    w, h = img.size
    g = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    start = int(h * (1 - ratio))
    for y in range(start, h):
        p = (y - start) / (h - start)
        a = int(230 * p ** 1.4)
        d.line([(0, y), (w, y)], fill=(*color, a))
    return Image.alpha_composite(img.convert("RGBA"), g)

def gradient_top(img, ratio=0.35, color=(6, 10, 6)):
    w, h = img.size
    g = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    end = int(h * ratio)
    for y in range(0, end):
        p = 1 - (y / end)
        a = int(200 * p ** 1.8)
        d.line([(0, y), (w, y)], fill=(*color, a))
    return Image.alpha_composite(img.convert("RGBA"), g)

def gradient_left(img, ratio=0.5, color=(6, 10, 6)):
    w, h = img.size
    g = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    end = int(w * ratio)
    for x in range(0, end):
        p = 1 - (x / end)
        a = int(210 * p ** 1.3)
        d.line([(x, 0), (x, h)], fill=(*color, a))
    return Image.alpha_composite(img.convert("RGBA"), g)

def gradient_right(img, ratio=0.5, color=(6, 10, 6)):
    w, h = img.size
    g = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    start = int(w * (1 - ratio))
    for x in range(start, w):
        p = (x - start) / (w - start)
        a = int(210 * p ** 1.3)
        d.line([(x, 0), (x, h)], fill=(*color, a))
    return Image.alpha_composite(img.convert("RGBA"), g)

def add_grain(img, intensity=10):
    w, h = img.size
    grain = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = grain.load()
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            v = random.randint(-intensity, intensity)
            a = min(abs(v), 255)
            c = 255 if v > 0 else 0
            px[x, y] = (c, c, c, a)
    return Image.alpha_composite(img.convert("RGBA"), grain)

def tw(f, t):
    b = f.getbbox(t)
    return b[2] - b[0]

def shadow_text(draw, xy, text, fnt, fill, offset=3, shadow=(0,0,0,180)):
    x, y = xy
    draw.text((x+offset, y+offset), text, font=fnt, fill=shadow)
    draw.text((x, y), text, font=fnt, fill=fill)

def rrect(draw, xy, r, **kw):
    draw.rounded_rectangle(xy, radius=r, **kw)

def pill(draw, xy, text, fnt, bg, fg, px=16, py=8):
    x, y = xy
    w = tw(fnt, text)
    h = fnt.getbbox(text)[3] - fnt.getbbox(text)[1]
    rrect(draw, (x, y, x+w+px*2, y+h+py*2), 20, fill=bg)
    draw.text((x+px, y+py-1), text, font=fnt, fill=fg)
    return x+w+px*2

def prepare_photo(path, W, H, darkness=0.6, fy=0.35, gb=0.65, gt=0.3):
    img = Image.open(path)
    img = crop_cover(img, W, H, fy)
    img = dark_overlay(img, darkness)
    if gb > 0:
        img = gradient_bottom(img, gb)
    if gt > 0:
        img = gradient_top(img, gt)
    img = add_grain(img, 8)
    return img


# ═══════════════════════════════════════════════════════════════
# AD 1 — IG Square Hebrew: "שירות מתחיל בתכנון" (border-prep)
# ═══════════════════════════════════════════════════════════════
def ad1():
    W, H = 1080, 1080
    img = prepare_photo(ASSETS/"border-prep.jpg", W, H, 0.6, 0.2, 0.7, 0.3)
    d = ImageDraw.Draw(img)

    # Top pill
    pill(d, (W-380, 60), he("פלטפורמה רשמית לתכנון השירות"), F(17, True), (*DARK_GREEN, 200), GREEN)

    # Headline RTL
    h1 = F(82, True)
    l1 = he("שירות מתחיל")
    l2 = he("בתכנון.")
    shadow_text(d, (W - tw(h1, l1) - 60, 260), l1, h1, WHITE)
    shadow_text(d, (W - tw(h1, l2) - 60, 365), l2, h1, GREEN, 4)

    # Sub
    sf = F(24)
    st = he("120+ תפקידים  ·  94% דיוק  ·  חינם")
    d.text((W - tw(sf, st) - 60, 475), st, font=sf, fill=MUTED)

    # Stats card
    cx, cy, cw, ch = 60, 560, 480, 280
    rrect(d, (cx, cy, cx+cw, cy+ch), 16, fill=(*DARKER_GREEN, 220), outline=(*GREEN, 60), width=1)
    lf, vf = F(20), F(36, True)
    stats = [(he("דפ״ר"), "82"), (he("פרופיל רפואי"), "97"), (he("התאמת תפקיד"), "94%")]
    for i, (label, val) in enumerate(stats):
        sy = cy + 30 + i * 75
        d.text((cx+30, sy), label, font=lf, fill=MUTED)
        d.text((cx+cw - tw(vf, val) - 30, sy-4), val, font=vf, fill=GREEN)
        if i < 2:
            d.line([(cx+30, sy+58), (cx+cw-30, sy+58)], fill=(*GREEN, 30), width=1)
    # Progress bar
    by = cy+ch-40
    rrect(d, (cx+30, by, cx+cw-30, by+8), 4, fill=DARK_GREEN)
    rrect(d, (cx+30, by, cx+30+int((cw-60)*0.7), by+8), 4, fill=GREEN)

    # CTA
    cf = F(26, True)
    ct = he("הצטרפו עכשיו  ←")
    bw = tw(cf, ct) + 80
    bx = (W-bw)//2
    rrect(d, (bx, 900, bx+bw, 960), 30, fill=GREEN)
    d.text((bx+40, 912), ct, font=cf, fill=NEAR_BLACK)

    # Wordmark
    wf = F(20, True)
    wt = he("מישלט")
    d.text((W - tw(wf, wt) - 40, H-50), wt, font=wf, fill=(*GREEN, 180))

    # Attribution
    af = F(10)
    d.text((20, H-25), "Photo: IDF Spokesperson / CC", font=af, fill=(80,80,80))

    img.convert("RGB").save(OUT/"ad01_hero_he.png", quality=95)
    print("  + ad01_hero_he.png")


# ═══════════════════════════════════════════════════════════════
# AD 2 — IG Story Hebrew: Unit matching (soldiers-climbing)
# ═══════════════════════════════════════════════════════════════
def ad2():
    W, H = 1080, 1920
    img = prepare_photo(ASSETS/"soldiers-climbing.jpg", W, H, 0.72, 0.3, 0.5, 0.35)
    d = ImageDraw.Draw(img)

    h1 = F(68, True)
    shadow_text(d, ((W - tw(h1, he("לאיזה יחידה")))//2, 160), he("לאיזה יחידה"), h1, WHITE, 4)
    shadow_text(d, ((W - tw(h1, he("אתה מתאים?")))//2, 250), he("אתה מתאים?"), h1, GREEN, 4)
    d.line([(W//2-40, 340), (W//2+40, 340)], fill=GREEN, width=3)

    units = [("8200", he("יחידת מודיעין"), 0.88), (he("גולני"), he('שי"ר'), 0.76),
             (he("שייטת 13"), he("קומנדו ימי"), 0.71), (he("תלפיות"), he("מחקר ופיתוח"), 0.65)]
    nf, df, pf = F(34, True), F(18), F(28, True)
    cx, cw = 100, W-200
    for i, (name, desc, pct) in enumerate(units):
        cy = 420 + i*200
        rrect(d, (cx, cy, cx+cw, cy+160), 14, fill=(*DARKER_GREEN, 200), outline=(*GREEN, 40), width=1)
        rrect(d, (cx, cy, cx+6, cy+160), 3, fill=GREEN)
        d.text((cx+30, cy+20), name, font=nf, fill=WHITE)
        d.text((cx+30, cy+62), desc, font=df, fill=MUTED)
        ps = f"{int(pct*100)}%"
        d.text((cx+cw - tw(pf, ps) - 30, cy+25), ps, font=pf, fill=GREEN)
        rrect(d, (cx+30, cy+110, cx+30+cw-60, cy+122), 6, fill=DARK_GREEN)
        rrect(d, (cx+30, cy+110, cx+30+int((cw-60)*pct), cy+122), 6, fill=GREEN)

    cf = F(38, True)
    ct = he("גלה עכשיו  ←  מישלט")
    shadow_text(d, ((W - tw(cf, ct))//2, 1680), ct, cf, GREEN)
    tf = F(20)
    tt = he("בחינם  ·  בעברית  ·  פרטי")
    d.text(((W - tw(tf, tt))//2, 1750), tt, font=tf, fill=MUTED)

    img.convert("RGB").save(OUT/"ad02_story_units_he.png", quality=95)
    print("  + ad02_story_units_he.png")


# ═══════════════════════════════════════════════════════════════
# AD 3 — IG Square English hero (kfir-training)
# ═══════════════════════════════════════════════════════════════
def ad3():
    W, H = 1080, 1080
    img = prepare_photo(ASSETS/"kfir-training.jpg", W, H, 0.62, 0.25, 0.65, 0.25)
    d = ImageDraw.Draw(img)

    wf = F(22, True)
    d.text(((W - tw(wf, "MISHLAHAT"))//2, 60), "MISHLAHAT", font=wf, fill=GREEN)
    d.line(((W-60)//2, 95, (W+60)//2, 95), fill=GREEN, width=2)

    h1, h2 = F(72, True), F(56, True)
    shadow_text(d, ((W - tw(h1, "Know your unit"))//2, 180), "Know your unit", h1, WHITE, 4)
    shadow_text(d, ((W - tw(h2, "before the army decides."))//2, 280), "before the army decides.", h2, WHITE, 3)

    sf = F(22)
    d.text(((W - tw(sf, "AI-powered IDF role matching."))//2, 370), "AI-powered IDF role matching.", font=sf, fill=MUTED)

    stats = [("120+", "roles"), ("94%", "accuracy"), ("<3 min", "signup")]
    bw, bh, gap = 260, 130, 40
    sx = (W - bw*3 - gap*2) // 2
    bf, sf2 = F(48, True), F(18)
    for i, (v, l) in enumerate(stats):
        bx = sx + i*(bw+gap)
        rrect(d, (bx, 460, bx+bw, 460+bh), 14, fill=(*DARKER_GREEN, 200), outline=(*GREEN, 50), width=1)
        d.text((bx+(bw-tw(bf, v))//2, 480), v, font=bf, fill=GREEN)
        d.text((bx+(bw-tw(sf2, l))//2, 542), l, font=sf2, fill=WHITE)

    d.line(((W-600)//2, 640, (W+600)//2, 640), fill=(*GREEN, 100), width=2)
    tf = F(22)
    d.text(((W - tw(tf, "Free.  Private.  Hebrew."))//2, 670), "Free.  Private.  Hebrew.", font=tf, fill=MUTED)

    cf = F(28, True)
    bw2 = tw(cf, "Start now  →") + 80
    bx2 = (W-bw2)//2
    rrect(d, (bx2, 900, bx2+bw2, 964), 32, fill=GREEN)
    d.text((bx2+40, 918), "Start now  →", font=cf, fill=NEAR_BLACK)

    af = F(11)
    d.text((20, H-30), "Photo: IDF Spokesperson / Wikimedia CC", font=af, fill=(100,100,100))

    img.convert("RGB").save(OUT/"ad03_hero_en.png", quality=95)
    print("  + ad03_hero_en.png")


# ═══════════════════════════════════════════════════════════════
# AD 4 — FB Banner Hebrew (officer-graduation)
# ═══════════════════════════════════════════════════════════════
def ad4():
    W, H = 1200, 628
    img = prepare_photo(ASSETS/"officer-graduation.jpg", W, H, 0.65, 0.4, 0.0, 0.0)
    img = gradient_left(img, 0.55)
    d = ImageDraw.Draw(img)

    h1 = F(52, True)
    shadow_text(d, (60, 60), he("הכל במקום אחד."), h1, WHITE, 3)

    pf = F(20, True)
    feats = [he("מעקב נתונים"), he("התאמת תפקיד"), he("יועץ AI אישי")]
    for i, f in enumerate(feats):
        py = 160 + i*62
        fw = tw(pf, f)
        rrect(d, (60, py, 60+fw+50, py+46), 23, fill=(*DARKER_GREEN, 220), outline=(*GREEN, 80), width=1)
        d.ellipse((76, py+16, 90, py+30), fill=GREEN)
        d.text((100, py+9), f, font=pf, fill=WHITE)

    tf = F(20)
    d.text((60, H-100), he("בחינם  ·  בעברית  ·  פרטי"), font=tf, fill=MUTED)
    bf = F(16, True)
    d.text((60, H-55), he("מישלט — הפלטפורמה לתכנון השירות"), font=bf, fill=GREEN)

    d.line((W//2+40, 80, W//2+40, H-80), fill=(*GREEN, 50), width=1)

    af = F(10)
    d.text((W-280, H-25), "Photo: IDF Spokesperson / CC", font=af, fill=(80,80,80))

    img.convert("RGB").save(OUT/"ad04_banner_he.png", quality=95)
    print("  + ad04_banner_he.png")


# ═══════════════════════════════════════════════════════════════
# AD 5 — IG Square English: 3 steps (alpine-training)
# ═══════════════════════════════════════════════════════════════
def ad5():
    W, H = 1080, 1080
    img = prepare_photo(ASSETS/"alpine-training.jpg", W, H, 0.7, 0.4, 0.5, 0.2)
    d = ImageDraw.Draw(img)

    d.text((40, 40), "MISHLAHAT", font=F(20, True), fill=GREEN)

    h1 = F(56, True)
    shadow_text(d, ((W - tw(h1, "3 minutes to sign up."))//2, 140), "3 minutes to sign up.", h1, WHITE, 3)
    shadow_text(d, ((W - tw(h1, "A lifetime of clarity."))//2, 220), "A lifetime of clarity.", h1, GREEN, 3)

    steps = [("01", "Sign up", "Create a free account in under 3 minutes."),
             ("02", "Enter your data", "Medical profile, dapar score, preferences."),
             ("03", "Get matched", "AI matches you to 120+ IDF roles instantly.")]
    nf, tf2, df = F(22, True), F(44, True), F(20)
    for i, (n, t, desc) in enumerate(steps):
        sy = 380 + i*190
        rrect(d, (100, sy, 160, sy+44), 8, fill=GREEN)
        d.text((116, sy+7), n, font=nf, fill=NEAR_BLACK)
        d.text((190, sy-2), t, font=tf2, fill=WHITE)
        d.text((190, sy+52), desc, font=df, fill=MUTED)
        if i < 2:
            d.line((130, sy+50, 130, sy+185), fill=(*GREEN, 60), width=2)

    cf = F(24, True)
    ct = "Try it free  →  mishlahat.com"
    d.text(((W - tw(cf, ct))//2, 980), ct, font=cf, fill=GREEN)

    img.convert("RGB").save(OUT/"ad05_steps_en.png", quality=95)
    print("  + ad05_steps_en.png")


# ═══════════════════════════════════════════════════════════════
# AD 6 — IG Square: Big stat hero (nahal-march)
# ═══════════════════════════════════════════════════════════════
def ad6():
    W, H = 1080, 1080
    img = prepare_photo(ASSETS/"nahal-march.jpg", W, H, 0.58, 0.35, 0.7, 0.15)
    d = ImageDraw.Draw(img)

    bf = F(140, True)
    shadow_text(d, (80, 100), "94%", bf, GREEN, 5)
    sf = F(36, True)
    shadow_text(d, (80, 270), "matching accuracy.", sf, WHITE, 3)

    body = F(22)
    d.text((80, 340), "Our AI cross-references your profile against", font=body, fill=MUTED)
    d.text((80, 372), "120+ IDF roles and shows your real options.", font=body, fill=MUTED)

    stats = [("+120", "roles in database"), ("<3 min", "to sign up"), ("100%", "free forever")]
    bw, gap = 280, 30
    sx = (W - bw*3 - gap*2) // 2
    vf, lf = F(40, True), F(16)
    for i, (v, l) in enumerate(stats):
        bx = sx + i*(bw+gap)
        rrect(d, (bx, 820, bx+bw, 930), 14, fill=(*DARKER_GREEN, 200), outline=(*GREEN, 40), width=1)
        d.text((bx+(bw-tw(vf, v))//2, 838), v, font=vf, fill=GREEN)
        d.text((bx+(bw-tw(lf, l))//2, 892), l, font=lf, fill=WHITE)

    d.text((W-160, H-45), "MISHLAHAT", font=F(18, True), fill=(*GREEN, 160))

    img.convert("RGB").save(OUT/"ad06_stats_en.png", quality=95)
    print("  + ad06_stats_en.png")


# ═══════════════════════════════════════════════════════════════
# AD 7 — IG Story English (soldiers-snow)
# ═══════════════════════════════════════════════════════════════
def ad7():
    W, H = 1080, 1920
    img = prepare_photo(ASSETS/"soldiers-snow.jpg", W, H, 0.55, 0.3, 0.55, 0.25)
    d = ImageDraw.Draw(img)

    d.text((80, 80), "MISHLAHAT", font=F(22, True), fill=GREEN)
    d.text((80, 112), "IDF Service Planning Platform", font=F(14), fill=MUTED)

    h1, h2 = F(64, True), F(50, True)
    shadow_text(d, (80, 1200), "The army has", h1, WHITE, 4)
    shadow_text(d, (80, 1290), "a plan for you.", h1, WHITE, 4)
    shadow_text(d, (80, 1400), "Do you?", h2, GREEN, 3)

    ff = F(22)
    feats = ["Track your dapar & medical profile", "Match to 120+ IDF roles with AI", "Get personalized recommendations"]
    for i, f in enumerate(feats):
        d.text((80, 1510+i*42), f"✦  {f}", font=ff, fill=MUTED)

    cf = F(30, True)
    ct = "Start free  →"
    bw = tw(cf, ct) + 80
    bx = (W-bw)//2
    rrect(d, (bx, 1740, bx+bw, 1810), 35, fill=GREEN)
    d.text((bx+40, 1754), ct, font=cf, fill=NEAR_BLACK)

    d.text((80, H-40), "Photo: IDF Spokesperson / Wikimedia CC", font=F(11), fill=(80,80,80))

    img.convert("RGB").save(OUT/"ad07_story_en.png", quality=95)
    print("  + ad07_story_en.png")


# ═══════════════════════════════════════════════════════════════
# AD 8 — IG Story Hebrew calm (navy-training)
# ═══════════════════════════════════════════════════════════════
def ad8():
    W, H = 1080, 1920
    img = prepare_photo(ASSETS/"navy-training.jpg", W, H, 0.6, 0.25, 0.6, 0.3)
    d = ImageDraw.Draw(img)

    pill(d, (W-240, 80), he("מישלט"), F(16, True), (*DARK_GREEN, 220), GREEN)

    h1 = F(62, True)
    l1, l2 = he("השירות שלכם,"), he("בראש שקט.")
    shadow_text(d, ((W-tw(h1, l1))//2, 1100), l1, h1, WHITE, 4)
    shadow_text(d, ((W-tw(h1, l2))//2, 1190), l2, h1, GREEN, 4)

    ff = F(24)
    feats = [he("✦  מעקב דפ״ר ופרופיל רפואי"), he("✦  התאמה ל-120+ תפקידים"), he("✦  יועץ AI אישי ומותאם")]
    for i, f in enumerate(feats):
        d.text(((W-tw(ff,f))//2, 1330+i*48), f, font=ff, fill=MUTED)

    cf = F(28, True)
    ct = he("הצטרפו בחינם  ←")
    bw = tw(cf, ct) + 80
    bx = (W-bw)//2
    rrect(d, (bx, 1600, bx+bw, 1666), 33, fill=GREEN)
    d.text((bx+40, 1613), ct, font=cf, fill=NEAR_BLACK)

    tf = F(18)
    tt = he("בחינם  ·  בעברית  ·  הצפנה מקצה לקצה")
    d.text(((W-tw(tf,tt))//2, 1720), tt, font=tf, fill=MUTED)

    img.convert("RGB").save(OUT/"ad08_story_he_calm.png", quality=95)
    print("  + ad08_story_he_calm.png")


# ═══════════════════════════════════════════════════════════════
# AD 9 — IG Square Hebrew features (soldiers-climbing)
# ═══════════════════════════════════════════════════════════════
def ad9():
    W, H = 1080, 1080
    img = prepare_photo(ASSETS/"soldiers-climbing.jpg", W, H, 0.75, 0.5, 0.4, 0.2)
    d = ImageDraw.Draw(img)

    h1 = F(52, True)
    l1, l2 = he("שלושה כלים."), he("מסלול אחד.")
    shadow_text(d, ((W-tw(h1,l1))//2, 60), l1, h1, WHITE, 3)
    shadow_text(d, ((W-tw(h1,l2))//2, 130), l2, h1, GREEN, 3)

    cw = W - 120
    feats = [(he("מעקב נתונים"), he('דפ״ר, פרופיל רפואי, ויום המאה — הכל במסך אחד.')),
             (he("התאמת תפקיד"), he("מנוע AI שמצליב נתונים מול 120+ תפקידים בצה״ל.")),
             (he("יועץ AI אישי"), he("יועץ שמנתח את הפרופיל שלכם ונותן המלצות מותאמות."))]
    tf2, bf2 = F(30, True), F(20)
    nf = F(18, True)
    for i, (title, body) in enumerate(feats):
        cy = 240 + i*220
        rrect(d, (60, cy, 60+cw, cy+200), 16, fill=(*DARKER_GREEN, 210), outline=(*GREEN, 40), width=1)
        rrect(d, (60, cy, 60+cw, cy+4), 2, fill=GREEN)
        n = f"0{i+1}"
        rrect(d, (90, cy+30, 140, cy+60), 8, fill=GREEN)
        d.text((100, cy+33), n, font=nf, fill=NEAR_BLACK)
        d.text((160, cy+30), title, font=tf2, fill=WHITE)
        d.text((90, cy+90), body, font=bf2, fill=MUTED)

    wf = F(22, True)
    wt = he("מישלט — בחינם, בעברית, בפרטיות")
    d.text(((W-tw(wf,wt))//2, H-60), wt, font=wf, fill=GREEN)

    img.convert("RGB").save(OUT/"ad09_features_he.png", quality=95)
    print("  + ad09_features_he.png")


# ═══════════════════════════════════════════════════════════════
# AD 10 — FB Banner English (soldiers-snow)
# ═══════════════════════════════════════════════════════════════
def ad10():
    W, H = 1200, 628
    img = prepare_photo(ASSETS/"soldiers-snow.jpg", W, H, 0.6, 0.35, 0.0, 0.0)
    img = gradient_right(img, 0.55)
    d = ImageDraw.Draw(img)

    h1 = F(48, True)
    l1, l2 = "Plan your service.", "Not just your draft date."
    shadow_text(d, (W-tw(h1,l1)-60, 120), l1, h1, WHITE, 3)
    shadow_text(d, (W-tw(h1,l2)-60, 190), l2, h1, GREEN, 3)

    sf = F(20)
    st = "120+ roles  ·  94% accuracy  ·  Free  ·  Private"
    d.text((W-tw(sf,st)-60, 280), st, font=sf, fill=MUTED)

    cf = F(24, True)
    ct = "Start now  →"
    bw = tw(cf, ct) + 60
    bx = W - bw - 60
    rrect(d, (bx, 360, bx+bw, 412), 26, fill=GREEN)
    d.text((bx+30, 370), ct, font=cf, fill=NEAR_BLACK)

    d.text((W-160, H-50), "MISHLAHAT", font=F(16, True), fill=(*GREEN, 160))
    d.text((20, H-25), "Photo: IDF Spokesperson / Wikimedia CC", font=F(10), fill=(80,80,80))

    img.convert("RGB").save(OUT/"ad10_banner_en.png", quality=95)
    print("  + ad10_banner_en.png")


# ═══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("\nGenerating Al Madim ads with real IDF photos...\n")
    ad1(); ad2(); ad3(); ad4(); ad5()
    ad6(); ad7(); ad8(); ad9(); ad10()
    count = len(list(OUT.glob("ad*.png")))
    print(f"\nDone! {count} ads saved to {OUT}\n")
