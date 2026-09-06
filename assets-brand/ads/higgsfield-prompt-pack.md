# HIGGSFIELD PROMPT PACK — MALUME ADS (SA context, 9:16 vertical)

**Trial plan (3-day tokens):** generate the 4 reference stills first (Day 1) to lock character/vehicle looks, then 7 video gens (Days 2–3). Shots marked ⭐ = generate first if tokens run out.
**After generation:** drop clips in `assets-brand/ads/higgsfield/clips/` and tell Hermes — stitching with the branded endcard + caption burn happens here via ffmpeg.

---

## CONSISTENCY SHEET (paste at top of every prompt where relevant)

**Characters**
- MALUME (driver): Black South African man, 50s, warm proud face, short greying beard, navy work shirt with amber trim, dark flat cap
- MAMA: Black South African mother, mid-30s, colourful headwrap, holding smartphone
- KIDS: two primary school children, navy-and-grey school uniforms, amber backpacks

**Vehicle**
- White Toyota Quantum-style minibus taxi (right-hand drive), amber stripe along the sides, BLANK white sign panels on the sides (no text), amber round sticker near the door

**Places**
- Soshanguve township street, Pretoria: sandy verges, boundary walls, distant power lines, morning golden haze
- Sunrise Primary school gate: low painted wall, amber-painted fence, teachers at the gate

**House tags (end every prompt with):**
```
Cinematic documentary style, golden hour morning light, ND filter aesthetic, warm earth tones with amber accents, Gauteng South Africa, 9:16 vertical, 4K, shallow depth of field, no stock-photo feel. NO on-screen text, no watermarks, no logos, right-hand drive vehicle, cars driving on the left side of the road.
```

**Negative prompt:**
```
text, captions, watermarks, distorted hands, extra fingers, European streets, left-hand drive, American school bus, yellow US school bus, cartoon
```

---

## AD A — "THE MORNING RUN" (live tracking) — 4 shots

### A1 ⭐ Hero: taxi departs (5s)
```
Cinematic morning shot on a Soshanguve township street, Pretoria: a white Toyota Quantum-style minibus taxi with an amber stripe and blank side panels pulls away from a tidy brick home, right-hand drive. Two primary school children in navy-and-grey uniforms with amber backpacks visible at the window waving. A proud mother in a colourful headwrap waves from the gate, golden haze, jacaranda shadows on the wall. Slow lateral tracking move following the taxi, dust catching the light.
```

### A2 ⭐ The mother's relief (5s)
```
Close-up over-the-shoulder shot: a Black South African mother in her mid-30s wearing a colourful headwrap stands on her doorstep holding a smartphone, its screen glowing a soft amber map light onto her face as she watches something with quiet relief. Morning golden hour light, Soshanguve rooftop skyline and power lines softly blurred behind her. Gentle push-in.
```

### A3 The route (5s)
```
Cinematic tracking shot driving alongside a white Toyota Quantum-style minibus taxi with an amber stripe, right-hand drive, cruising a Soshanguve street past a spaza shop with a colourful awning and a cosily stacked fruit stand. School children in uniform visible through the windows, driver's silhouette calm at the wheel. Morning light flares across the windscreen.
```

### A4 Arrival at the gate (5s)
```
Cinematic shot at a township primary school gate at golden hour: a white Toyota Quantum-style minibus taxi with an amber stripe pulls up outside a low painted wall with an amber-painted fence, right-hand drive, keeping left on the road. A teacher in a lanyard waves; children in navy-and-grey uniforms hop down with amber backpacks. Warm lens flare, birds across the sky.
```

---

## AD B — "GEOFENCE" (arrival alert) — 3 shots

### B1 ⭐ Aerial: the school zone (5s)
```
Slow aerial drone shot descending over a township primary school in Soshanguve, Pretoria at golden hour: low school buildings, an amber-painted boundary fence forming a clear zone around the grounds, netball court, sand playground. A single white minibus taxi with an amber stripe approaches the gate along a sandy street, right-hand drive. Morning haze, long shadows.
```

### B2 ⭐ The alert moment (5s)
```
Intimate close-up: a Black South African mother in a colourful headwrap at her kitchen door, smartphone in hand buzzes softly, she looks down and her face breaks into a relieved smile, warm morning light through the door frame behind her, Soshanguve home interior with lace curtains, steam from a kettle. Handheld documentary feel, gentle.
```

### B3 The handover (5s)
```
Cinematic shot at the school gate: a Black South African taxi driver in his 50s with a short greying beard, navy work shirt with amber trim and a dark flat cap helps the smallest child in a navy-and-grey school uniform step down from a white minibus taxi with an amber stripe, right-hand drive. The mother in a colourful headwrap exchanges a warm nod of thanks with him. Golden hour, township school wall and amber fence behind.
```

---

## AD C — "VERIFIED MALUME" (trust) — 4 shots

### C1 ⭐ Portrait: the uncle (5s)
```
Hero portrait, waist-up: a proud Black South African taxi driver in his 50s, short greying beard, navy work shirt with amber trim and a dark flat cap, arms crossed, leaning against the front fender of his white Toyota Quantum-style minibus taxi with an amber stripe, right-hand drive. Golden hour rim light, Soshanguve street softly blurred, dust motes in the air. Slow push-in, confident gentle smile.
```

### C2 Papers check (5s)
```
Close-up insert shot: hands of a South African driver holding a smartphone showing a clean document-checklist screen glow, beside a police-clearance style certificate folder resting on the taxi dashboard, amber lanyard visible. Morning light through the windscreen, steering wheel right side of frame (right-hand drive). Shallow depth of field.
```

### C3 The walk-around (5s)
```
Cinematic low shot: a Black South African taxi driver in navy work shirt with amber trim and dark flat cap walks a slow circle around his white Toyota Quantum-style minibus taxi with an amber stripe at dawn, crouching to check a tyre with his hand, breath visible in the cool morning air, Soshanguve street quiet, long shadows. Documentary style.
```

### C4 Head count (5s)
```
Warm cinematic shot from inside a minibus taxi looking at the driver's eyes in the large rearview mirror as he counts school children in navy-and-grey uniforms climbing in with amber backpacks, morning light pouring through the windows, right-hand drive cabin. Gentle handheld, genuine laughter.
```

---

## TOKEN BUDGET (3-day trial)
| Day | Gen | Purpose |
|-----|-----|---------|
| 1 | A1, B1, C1 stills/video | hero shots — lock the Quantum + characters |
| 2 | A2, B2, C2 | the emotional close-ups (parents react, papers check) |
| 3 | B3, C4 | trust moments (handover, head count) |

If tokens are tight, the minimum viable set = ⭐ A1 + A2 + B1 + B2 + C1 (5 gens) — enough for three 15s ads with the existing branded endcards.

## POST (Hermes does this part)
1. Download gens → `assets-brand/ads/higgsfield/clips/` (name them A1.mp4, A2.mp4 …)
2. Hermes stitches per ad: clips → brand endcard (road-M + CTA) → optional caption burn → 9:16 H.264 masters + WhatsApp 6s cuts + covers
3. Captions already written in `captions.md` — swap in the SA-specific ones below if wanted:
   - TikTok: "The scholar taxi that reports to YOU. 🚌📍 #Malume #ScholarTransport #Soshanguve #Pretoria #SAparents"
   - IG Reels: "Every trip. Every street. Watched over. 🧡 Live tracking + geofenced school zones. #Malume #ScholarTransport #SouthAfrica"
