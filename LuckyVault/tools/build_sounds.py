# Renders Lucky Vault's sound pack (original, generated here — no third-party samples) to assets/audio/*.mp3
# Layered synthesis: FM bells/glockenspiel, plucked marimba, detuned brass pads, filtered noise, stereo convolution reverb.
import numpy as np, subprocess, os, wave
from scipy.signal import butter, sosfilt, fftconvolve
SR = 44100
OUT = '/home/claude/slots/assets/audio/'; os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)
def T(d): return np.arange(int(SR * d)) / SR
def env(n, a=.005, d=.3, curve=4.0):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * np.maximum(0, t - a) / max(d, 1e-4)); return e
def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR / 2 - 100) / (SR / 2), 'low', output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f / (SR / 2), 'high', output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], 'band', output='sos'), x)
def noise(d): return rng.standard_normal(int(SR * d))
def mix(*parts, length=None):
    L = length or max(len(p) + int(o * SR) for p, o in parts); y = np.zeros(L)
    for p, o in parts:
        s = int(o * SR); e = min(L, s + len(p)); y[s:e] += p[:e - s]
    return y
def fmbell(f, d, v=1., ratio=3.5, idx=2.2, decay=3.):
    t = T(d); m = np.sin(2 * np.pi * f * ratio * t) * idx * np.exp(-t * decay * 1.6)
    return v * np.sin(2 * np.pi * f * t + m) * env(len(t), .002, d, decay)
def glock(f, d=.9, v=1.):
    a = fmbell(f, d, v, 3.0, 1.4, 4.5); b = .35 * fmbell(f * 2, d * .6, v, 4.0, 1.0, 6); a[:len(b)] += b; return a
def marimba(f, d=.5, v=1.):
    t = T(d); x = np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30) + .1 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t * 60)
    return v * x * env(len(t), .002, d * .45, 3.5)
def pluck(f, d=.6, v=1.):
    # Karplus-Strong
    n = int(SR * d); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .996
    return v * lp(out, 6000)
def brass(f, d, v=1., bright=2500):
    t = T(d); x = sum(((np.mod(f * k * t + rng.random(), 1) * 2 - 1)) for k in (1, 1.004, .996)) / 3
    e = env(len(t), .04, d, 1.2) * np.minimum(1, (len(t) - np.arange(len(t))) / (SR * .08))
    cut = 600 + bright * np.exp(-t * 2.5)
    y = np.zeros_like(x); # time-varying lowpass via blocks
    B = 1024
    for i in range(0, len(x), B):
        y[i:i + B] = lp(x[max(0, i - 2048):i + B], cut[min(i, len(cut) - 1)])[-len(x[i:i + B]):]
    return v * y * e
def kick(d=.35, v=1., f0=120, f1=42):
    t = T(d); ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-t * 28)) / SR
    return v * (np.sin(ph) * env(len(t), .001, d * .5, 3) + .3 * lp(noise(d), 1500) * env(len(t), .001, .02, 6))
def timp(f=80, d=1.2, v=1.):
    t = T(d); ph = 2 * np.pi * np.cumsum(f * (1 + .25 * np.exp(-t * 15))) / SR
    return v * (np.sin(ph) + .4 * np.sin(ph * 1.5)) * env(len(t), .003, d * .5, 2.5) + v * .25 * lp(noise(d), 800) * env(len(t), .001, .05, 5)
def coin(v=1., f=None):
    f = f or rng.uniform(3200, 5200); d = .35; t = T(d)
    parts = [(1, 1), (1.47, .6), (2.09, .45), (2.56, .3), (3.9, .15)]
    x = sum(a * np.sin(2 * np.pi * f * r * t + rng.random() * 6) * np.exp(-t * (14 + 9 * r)) for r, a in parts)
    return v * (x * .5 + .4 * hp(noise(d), 6000) * np.exp(-t * 90))
def whoosh(d, f0, f1, v=1., q=1.2):
    n = noise(d); t = T(d); y = np.zeros_like(n); B = 512
    fs = f0 * (f1 / f0) ** (t / d)
    for i in range(0, len(n), B):
        c = fs[min(i, len(fs) - 1)]; y[i:i + B] = bp(n[max(0, i - 2048):i + B], c / (1 + q * .3), c * (1 + q * .3))[-len(n[i:i + B]):]
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return v * y * e
def reverb(x, dur=1.6, wet=.25, damp=5000):
    n = int(SR * dur); t = np.arange(n) / SR
    irL = lp(rng.standard_normal(n), damp) * np.exp(-t * 6.9 / dur); irR = lp(rng.standard_normal(n), damp) * np.exp(-t * 6.9 / dur)
    irL[:int(SR * .012)] *= np.linspace(0, 1, int(SR * .012)); irR[:int(SR * .017)] *= np.linspace(0, 1, int(SR * .017))
    irL /= np.sqrt((irL ** 2).sum()); irR /= np.sqrt((irR ** 2).sum())
    M = len(x) + n; L = np.pad(fftconvolve(x, irL), (0, 1))[:M]; R = np.pad(fftconvolve(x, irR), (0, 1))[:M]
    dry = np.concatenate([x, np.zeros(n)])[:M]
    return np.stack([dry + wet * L * 3, dry + wet * R * 3], 1)
def pan(x, p):  # mono -> stereo, p -1..1
    return np.stack([x * np.sqrt((1 - p) / 2), x * np.sqrt((1 + p) / 2)], 1)
def write(name, y, rv=(.9, .18), peak=.89, trim=True, sub=''):
    if y.ndim == 1: y = reverb(y, *rv) if rv else np.stack([y, y], 1)
    else:
        if rv: l = reverb(y[:, 0], *rv); r = reverb(y[:, 1], *rv); y = np.stack([l[:, 0], r[:, 1]], 1)
    y = y / (np.abs(y).max() + 1e-9) * peak
    if trim:
        a = np.abs(y).max(1); k = np.where(a > 1e-3)[0]; y = y[:k[-1] + 1] if len(k) else y
        fade = min(len(y), int(SR * .03)); y[-fade:] *= np.linspace(1, 0, fade)[:, None]
    w = '/tmp/_s.wav'
    with wave.open(w, 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((y * 32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-c:a', 'libmp3lame', '-q:a', '4', OUT + sub + name + '.mp3'], check=True)
N = lambda m: 440 * 2 ** ((m - 69) / 12)


# ======================= instrument palette =======================
def xylo(f, d=.35, v=1.):
    t = T(d); x = np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 3.0 * t) * np.exp(-t * 25) + .2 * np.sin(2 * np.pi * f * 6.2 * t) * np.exp(-t * 50)
    return v * x * env(len(t), .001, d * .35, 3.5)
def crystal(f, d=1.4, v=1.):
    a = fmbell(f, d, v, 1.41, 1.8, 2.2); b = fmbell(f * 2.76, d * .7, v * .35, 1.0, .6, 4); a[:len(b)] += b
    t = T(d); a += v * .15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 9); return a
def accordion(f, d, v=1.):
    t = T(d); x = sum((np.mod(f * k * t + p, 1) * 2 - 1) for k, p in ((1, 0), (1.006, .3), (2.0, .6))) / 3
    x = lp(x, 2600) * (1 + .25 * np.sin(2 * np.pi * 5.5 * t)); e = np.minimum(1, t / .05) * np.minimum(1, (d - t) / .08).clip(0, 1)
    return v * x * e
def organ(f, d, v=1.):
    t = T(d); vib = 1 + .004 * np.sin(2 * np.pi * 5.8 * t)
    x = sum(a * np.sin(2 * np.pi * f * h * np.cumsum(vib) / SR) for h, a in ((.5, .5), (1, 1), (2, .6), (3, .35), (4, .3), (6, .15), (8, .12)))
    e = np.minimum(1, t / .07) * np.minimum(1, (d - t) / .15).clip(0, 1); return v * x * e / 2.5
def harp(f, d=1.5, v=1.):
    n = int(SR * d); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p) * np.hanning(p) * 2; out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .9985
    return v * lp(out, 5000)
def banjo(f, d=.7, v=1.):
    y = pluck(f, d, v); t = T(d); y += v * .5 * hp(noise(d), 3000) * np.exp(-t * 120); return hp(y, 120) * (1 + .3 * np.exp(-t * 20))
def celesta(f, d=1.2, v=1.): return fmbell(f, d, v, 4.0, .9, 3.5)
def choir(f, d, v=1.):
    t = T(d); x = sum((np.mod(f * k * t + rng.random(), 1) * 2 - 1) for k in (1, 1.005, .995)) / 3
    y = sum(bp(x, fc * .8, fc * 1.2) * a for fc, a in ((700, 1), (1150, .6), (2600, .25)))
    e = np.minimum(1, t / .25) * np.minimum(1, (d - t) / .3).clip(0, 1) * (1 + .05 * np.sin(2 * np.pi * 5 * t)); return v * y * e * 2.2
def uke(f, d=.5, v=1.):
    a = pluck(f, d, v); b = pluck(f * 2.003, d * .7, v * .3); a[:len(b)] += b; return a
def woodknock(v=1., f=900):
    d = .12; t = T(d); return v * (bp(noise(d), f * .7, f * 1.4) * np.exp(-t * 60) * 1.6 + np.sin(2 * np.pi * f * .35 * t) * np.exp(-t * 40))
def cannon(v=1.):
    d = 1.6; t = T(d); return v * (kick(d, 1.2, 90, 30)[:len(t)] + lp(noise(d), 400) * np.exp(-t * 2.2) * .9 + hp(noise(d), 2000) * np.exp(-t * 30) * .3)
def whip(v=1.):
    d = .35; t = T(d); w = whoosh(.25, 600, 6000, .6, 1.5); y = np.zeros(len(t)); y[:len(w)] += w; s0 = int(SR * .22)
    y[s0:s0 + int(SR * .05)] += hp(noise(.05), 3000) * np.exp(-T(.05) * 80) * 1.5; return v * y
def thunder(v=1., d=2.5):
    t = T(d); x = lp(noise(d), 300) * np.exp(-t * 1.3) * 1.6
    for k in range(6): s0 = int(SR * rng.uniform(0, .6)); c = lp(noise(.3), 1500) * np.exp(-T(.3) * 15); x[s0:s0 + len(c)] += c[:len(x) - s0] * .7
    return v * x
def clap(v=1.):
    d = .15; return v * mix(*[(bp(noise(d), 900, 4000) * np.exp(-T(d) * 35), o) for o in (0, .008, .016)])
def heart(v=1.): return mix((kick(.25, v, 70, 35), 0), (kick(.25, v * .7, 65, 32), .2))
def sparkle(n=14, lo=84, hi=100, v=.3, inst=None, dt=.05):
    inst = inst or glock; return mix(*[(inst(N(rng.integers(lo, hi)), .5, v * rng.uniform(.5, 1)), i * dt + rng.random() * .02) for i in range(n)])
# ======================= families =======================
MAJ = [0, 2, 4, 7, 9]; MIN = [0, 3, 5, 7, 10]; HMIN = [0, 2, 3, 7, 8]; DOR = [0, 2, 3, 7, 9]
def sc(root, mode, k):  # k-th scale degree (can be >5)
    return root + 12 * (k // len(mode)) + mode[k % len(mode)]
FAM = {
 'casino': dict(root=72, mode=MAJ, lead=glock, low=marimba, pad=lambda f, d, v: brass(f, d, v * .9, 2600), stop=lambda i: mix((kick(.25, .9, 150, 55), 0), (marimba(N(55 + [0, 2, 4, 7, 9][i]), .35, .55), 0)), impact=lambda: kick(.5, 1, 90, 40), rv=(1.2, .24)),
 'golden': dict(root=67, mode=MAJ, lead=lambda f, d=.9, v=1.: glock(f, d, v) + 0, low=lambda f, d=.5, v=1.: brass(f, d, v * .7, 2200), pad=lambda f, d, v: brass(f, d, v, 3200), stop=lambda i: mix((timp(N(40 + [0, 2, 4, 7, 9][i]), .5, .8), 0), (coin(.25), .01)), impact=lambda: timp(N(31), 1.8, 1.2), rv=(1.8, .28)),
 'candy': dict(root=76, mode=MAJ, lead=xylo, low=lambda f, d=.4, v=1.: uke(f, d, v), pad=lambda f, d, v: xylo(f, min(d, .6), v), stop=lambda i: mix((np.sin(2 * np.pi * np.cumsum(300 + 900 * (1 - np.exp(-T(.12) * 30)) + i * 60) / SR) * env(int(SR * .12), .002, .07, 4) * .8, 0), (xylo(N(72 + [0, 2, 4, 7, 9][i]), .25, .4), 0)), impact=lambda: mix((clap(1), 0), (kick(.3, .8, 160, 60), 0)), rv=(.8, .18)),
 'gems': dict(root=79, mode=MAJ, lead=crystal, low=lambda f, d=.6, v=1.: crystal(f, d, v * .7), pad=lambda f, d, v: choir(f, d, v * .5), stop=lambda i: mix((crystal(N(74 + [0, 2, 4, 7, 9][i]), .5, .55), 0), (kick(.2, .5, 140, 60), 0), (hp(noise(.03), 6000) * .3, 0)), impact=lambda: mix((whoosh(.5, 300, 8000, .6), 0), (kick(.5, 1, 100, 40), .4)), rv=(2.0, .32)),
 'pirate': dict(root=62, mode=DOR, lead=lambda f, d=.6, v=1.: accordion(f, d, v * .7), low=lambda f, d=.5, v=1.: pluck(f, d, v), pad=lambda f, d, v: accordion(f, d, v * .8), stop=lambda i: mix((woodknock(1, 700 + i * 70), 0), (kick(.25, .6, 120, 50), 0)), impact=lambda: cannon(1), rv=(1.0, .2)),
 'magic': dict(root=69, mode=HMIN, lead=celesta, low=lambda f, d=1.2, v=1.: harp(f, d, v), pad=lambda f, d, v: choir(f, d, v * .7), stop=lambda i: mix((harp(N(57 + [0, 2, 3, 7, 8][i]), .8, .7), 0), (kick(.2, .45, 130, 55), 0), (sparkle(3, 88, 100, .12, celesta, .03), .02)), impact=lambda: mix((whoosh(.6, 200, 6000, .7), 0), (thunder(.5, 1.2), .5)), rv=(2.2, .34)),
 'horror': dict(root=57, mode=HMIN, lead=lambda f, d=1.2, v=1.: celesta(f, d, v * .8), low=lambda f, d=1., v=1.: organ(f, d, v), pad=lambda f, d, v: organ(f, d, v), stop=lambda i: mix((kick(.4, 1, 90, 35), 0), (lp(noise(.25), 600) * np.exp(-T(.25) * 12) * .6, 0), (organ(N(45 + [0, 3, 7, 8, 11][i]), .3, .25), 0)), impact=lambda: thunder(1.2, 2.5), rv=(2.6, .36)),
 'western': dict(root=64, mode=MAJ, lead=banjo, low=lambda f, d=.6, v=1.: pluck(f, d, v), pad=lambda f, d, v: pluck(f, min(d, 1.2), v), stop=lambda i: mix((woodknock(.9, 1100 - i * 60), 0), (woodknock(.6, 900 - i * 50), .09), (kick(.2, .4, 120, 50), 0)), impact=lambda: mix((whip(1), 0), (kick(.4, .9, 100, 40), .2)), rv=(.9, .2)),
}
def music(fam, c):
    root = c['root'] - 12; mode = c['mode']; out = []; R = np.random.default_rng(sum(map(ord, fam)) % 999)
    base = c.get('base', fam)
    if base == 'casino':
        bpm = 92; prog = [(50, 53, 57, 60, 64), (55, 59, 62, 65, 69), (48, 52, 55, 59, 62), (45, 48, 52, 55, 60)] * 2; beat = 60 / bpm
        def ep(f, d, v):
            t = T(d); x = np.sin(2 * np.pi * f * t + 1.2 * np.sin(2 * np.pi * f * t) * np.exp(-t * 3)) + .2 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 6)
            return v * x * env(len(t), .004, d, 1.6) * (1 + .15 * np.sin(2 * np.pi * 5 * t))
        for b, ch in enumerate(prog):
            o = b * beat * 4
            for k, m in enumerate(ch[1:]): out.append((ep(N(m), beat * 3.6, .1), o + k * .012)); out.append((ep(N(m), beat * 1.6, .05), o + beat * 2.5 + k * .01))
            for k, m in enumerate([ch[0] - 12, ch[0] - 12, ch[0] - 5, ch[0] - 10]):
                tt = T(beat * .9); out.append(((np.sin(2 * np.pi * N(m) * tt) + .3 * np.sin(4 * np.pi * N(m) * tt)) * env(len(tt), .01, beat * .8, 2) * .22, o + k * beat))
            for k in range(8): out.append((bp(noise(.12), 3000, 12000) * env(int(SR * .12), .004, .08, 4) * (.06 if k % 2 else .035), o + k * beat / 2 + (.04 if k % 2 else 0)))
            out.append((kick(.25, .25, 100, 45), o))
        L = int(SR * beat * 4 * len(prog)); return out, L
    STY = {'golden': (84, 4), 'candy': (120, 4), 'gems': (100, 4), 'pirate': (112, 6), 'magic': (72, 4), 'horror': (64, 4), 'western': (104, 4)}
    bpm, meter = c.get('sty') or STY[base]; beat = 60 / bpm; bars = 8; prog = [0, 3, 4, 0, 0, 3, 4, 0] if mode in (MAJ,) else [0, 2, 3, 0, 0, 3, 4, 0]
    chords = lambda deg: [sc(root, mode, deg), sc(root, mode, deg + 2), sc(root, mode, deg + 4)]
    for b in range(bars):
        o = b * beat * meter; ch = chords(prog[b])
        if base == 'golden':
            for m in ch: out.append((brass(N(m), beat * meter * .95, .09, 1800), o))
            out.append((timp(N(ch[0] - 12), 1.2, .35), o)); out.append((timp(N(ch[0] - 12), .8, .2), o + beat * 2.5))
            for k in range(4): out.append((glock(N(sc(root + 12, mode, prog[b] + R.integers(0, 5))), .8, .1), o + k * beat + beat * .5 * (k % 2)))
        elif base == 'candy':
            for k in range(4):
                for m in ch: out.append((uke(N(m + 12), .35, .1), o + k * beat + beat / 2))
                out.append((kick(.2, .25, 140, 50), o + k * beat)); out.append((clap(.15), o + k * beat + beat) if k % 2 == 0 else (clap(.0), 0))
                out.append((xylo(N(sc(root + 24, mode, R.integers(0, 7))), .3, .14), o + k * beat + (beat / 2 if R.random() < .5 else 0)))
            out.append((pluck(N(ch[0] - 12), beat * 1.8, .3), o)); out.append((pluck(N(ch[0] - 5), beat * 1.8, .25), o + beat * 2))
        elif base == 'gems':
            for m in ch: out.append((choir(N(m), beat * meter, .05), o))
            for k in range(16): out.append((crystal(N(sc(root + 12, mode, prog[b] + [0, 2, 4, 7, 4, 2, 7, 9][k % 8])), .5, .06), o + k * beat / 4))
            out.append((kick(.25, .2, 110, 45), o)); out.append((kick(.25, .15, 110, 45), o + beat * 2))
        elif base == 'pirate':
            for k in range(6):
                if k in (0, 3): out.append((pluck(N(ch[0] - 12), beat * 1.5, .35), o + k * beat))
                else: out.append((accordion(N(ch[1]), beat * .6, .07) + accordion(N(ch[2]), beat * .6, .06)[:int(SR * beat * .6)], o + k * beat))
                out.append((woodknock(.12 if k in (0, 3) else .06, 800), o + k * beat))
            for k, deg in enumerate([0, 1, 2, 4, 2, 1] if b % 2 == 0 else [2, 4, 5, 4, 2, 0]): out.append((accordion(N(sc(root + 12, mode, prog[b] + deg)), beat * .9, .07), o + k * beat))
        elif base == 'magic':
            for m in ch: out.append((choir(N(m), beat * meter, .05), o))
            for k in range(8): out.append((harp(N(sc(root + 12, mode, prog[b] + [0, 2, 4, 7, 9, 7, 4, 2][k])), 1.2, .14), o + k * beat / 2))
            if b % 2: out.append((celesta(N(sc(root + 24, mode, prog[b] + R.integers(0, 5))), 1.6, .12), o + beat * 2))
        elif base == 'horror':
            for m in ch: out.append((organ(N(m - 12), beat * meter, .06), o))
            out.append((heart(.35), o)); out.append((heart(.25), o + beat * 2))
            for k, deg in enumerate([4, 3, 2, 1] if b % 2 == 0 else [0, 1, 2, -1]): out.append((glock(N(sc(root + 24, mode, prog[b] + deg)), 1.0, .07), o + k * beat))
        elif base == 'western':
            for k in range(4):
                out.append((pluck(N(ch[0] - 12 if k % 2 == 0 else ch[2] - 12), beat * .9, .3), o + k * beat))
                for j, m in enumerate(ch): out.append((banjo(N(m + 12), .3, .06), o + k * beat + beat * .5 + j * .012))
                out.append((woodknock(.08, 1000), o + k * beat)); out.append((woodknock(.05, 1200), o + k * beat + beat * .66))
            if b % 2 == 0:
                for k, deg in enumerate([0, 2, 4, 2]): out.append((banjo(N(sc(root + 12, mode, prog[b] + deg)), .6, .12), o + k * beat + beat * .33))
    return out, int(SR * beat * meter * bars)
def family(fam, c):
    sub = fam + '/'; os.makedirs(OUT + sub, exist_ok=True); L, lo, pad, rv = c['lead'], c['low'], c['pad'], c['rv']
    deg = lambda k: N(sc(c['root'], c['mode'], k))
    W = lambda n, y, r=rv: write(n, y, r, sub=sub)
    W('spin', mix((whoosh(.55, 300, 2400, .7), 0), *[(L(deg(i), .25, .14), .03 + i * .045) for i in range(5)]), (.6, .12))
    for i in range(5): W('stop%d' % (i + 1), c['stop'](i), (.5, .12))
    W('land', c['stop'](2), (.4, .1))
    W('antic', mix(*[(L(deg(i % 6 + i // 6), .3, .12 + i * .02), i * .085) for i in range(16)], (whoosh(1.5, 200, 3000, .45, .8), 0), (timp(N(c['root'] - 36), 1.6, .25), 0)), (1.2, .22))
    W('pop', mix((L(deg(7 + rng.integers(0, 3)), .3, .6), 0), (hp(noise(.04), 5000) * env(int(SR * .04), .001, .015, 5) * .2, 0)), (.5, .15))
    W('win', mix(*[(L(deg(5 + i), 1.0, .6), i * .075) for i in range(5)], *[(coin(.15), .35 + i * .05) for i in range(5)], (lo(deg(0) / 2, 1.0, .35), 0)))
    W('scatter', mix(*[(lo(deg(i), .9, .35), i * .05) for i in range(10)], (L(deg(10), 1.6, .5), .55), (L(deg(12), 1.6, .4), .62)), (2.0, .3))
    ch = [[0, 2, 4], [3, 5, 7], [4, 6, 8], [7, 9, 11]]; parts = []
    for k, cc in enumerate(ch):
        o = k * .42 if k < 3 else 1.26; d = .45 if k < 3 else 2.4
        for m in cc: parts.append((pad(deg(m) / 2, d, .2), o))
        parts.append((timp(deg(cc[0]) / 4, 1.0 if k < 3 else 2, .6), o))
    parts.append((c['impact'](), 1.26))
    parts.append((hp(noise(3.6), 5000) * np.concatenate([np.linspace(0, 1, int(SR * 1.26)) ** 3, np.exp(-np.arange(int(SR * 2.34)) / SR * 1.5)]) * .3, 0))
    parts += [(coin(rng.uniform(.12, .3)), 1.3 + i * .06 + rng.random() * .04) for i in range(30)]
    parts += [(L(deg(10 + i), 1.5, .35), 1.26 + i * .06) for i in range(5)]
    W('big', mix(*parts), (2.2, .3))
    W('mult', mix((whoosh(.7, 200, 6000, .7, 1.2), 0), (c['impact'](), .62), (L(deg(12), 1., .5), .64)), (1.2, .25))
    W('fs', mix((whoosh(1.4, 150, 4000, .5, .8), 0), *[(L(deg(5 + i), 1.4, .45), .9 + i * .08) for i in range(6)], *[(pad(deg(m) / 2, 1.6, .2), 1.1) for m in (0, 2, 4)], (c['impact'](), 1.1)), (2.0, .28))
    parts, Lm = music(fam, c); y = mix(*[p for p in parts if len(p[0])], length=Lm + int(SR * 3)); tail = y[Lm:]; y = y[:Lm].copy(); y[:len(tail)] += tail
    st = reverb(y, 1.6, .2); body = st[:Lm].copy(); body[:len(st) - Lm] += st[Lm:]
    write('music', body, None, .7, trim=False, sub=sub); print(fam, 'ok')
# shared casino UI + coin sounds (one set for all games); chip/card/dice/shuffle/chips/pack are Kenney CC0 recordings (assets/audio/KENNEY-LICENSE.txt)
write('click', mix((hp(noise(.03), 2500) * env(int(SR * .03), .0005, .01, 5) * .5, 0), (np.sin(2 * np.pi * 2300 * T(.05)) * env(int(SR * .05), .001, .03, 5) * .35, 0)), (.3, .08))
write('coins', mix(*[(coin(rng.uniform(.25, .55)), i * .045 + rng.random() * .03) for i in range(22)]), (.8, .18))
write('collect', mix((whoosh(.45, 600, 5000, .5, 1.6), 0), *[(coin(rng.uniform(.25, .5)), .05 + i * .03) for i in range(14)], (fmbell(N(96), 1.2, .55, 3.0, 1.2, 3), .5), (fmbell(N(103), 1.0, .4, 3.0, 1.2, 3), .56), (kick(.2, .35, 200, 80), .5)), (1.0, .2))
d = 4.6; t = T(d); roll = bp(noise(d), 1500, 5000) * (0.5 + .5 * np.sin(2 * np.pi * np.cumsum(14 * np.exp(-t * .5)) / SR)) * np.exp(-t * .35) * .35
write('ball', mix((roll, 0), *[(coin(.35, rng.uniform(4000, 6000)), 3.3 + x) for x in (0, .18, .31, .41, .48, .55, .6)]), (.7, .15))
def _derive(base, **kw): d = dict(FAM[base]); d.update(kw); d['base'] = base; return d
FAM.update({
 'space': _derive('gems', root=74, mode=DOR, lead=celesta, pad=lambda f, d, v: choir(f, d, v * .6), sty=(96, 4), rv=(1.8, .3)),
 'ocean': _derive('magic', root=65, mode=MAJ, lead=harp, low=lambda f, d=.8, v=1.: crystal(f, d, v * .6), sty=(78, 6), rv=(1.6, .3)),
 'egypt': _derive('golden', root=62, mode=HMIN, lead=lambda f, d=.6, v=1.: harp(f, d, v), sty=(88, 4)),
 'asian': _derive('magic', root=67, mode=MAJ, lead=lambda f, d=.7, v=1.: pluck(f, d, v), low=lambda f, d=.9, v=1.: harp(f, d, v * .8), sty=(84, 4)),
 'winter': _derive('gems', root=76, mode=MAJ, lead=glock, pad=lambda f, d, v: choir(f, d, v * .6), sty=(92, 3)),
 'jungle': _derive('western', root=60, mode=DOR, lead=xylo, low=lambda f, d=.4, v=1.: marimba(f, d, v), sty=(116, 4)),
 'sweet': _derive('candy', root=72, mode=MAJ, lead=glock, sty=(108, 4)),
 'dragon': _derive('golden', root=64, mode=HMIN, lead=lambda f, d=.9, v=1.: brass(f, d, v * .8, 2600), sty=(76, 4)),
})
import sys
for fam, c in FAM.items():
    if len(sys.argv) > 1 and fam not in sys.argv[1:]: continue
    family(fam, c)
print('done')
