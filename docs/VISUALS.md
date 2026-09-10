# Product visual provenance

Product studio assets in `public/products/` were generated with the built-in image generation tool on 2026-09-10 UTC. They are illustrative photorealistic renderings, not manufacturer photographs, mechanical CAD models or teardown measurements. No generated factory photo is presented as a real site. Actual sourcing relationships come solely from the independently cited claim records.

The interaction uses a perspective-transformed image plane and individually selectable visual layers. For Raspberry Pi 4, Pi 5 and Pico, illustrated chip regions separate from the board image; the other products use conceptual component tiles. The layer positions, package depictions and ordering are approximate. The view is explicitly labeled; it is not a repair guide and should not be used to locate physical components. Rotation changes the presentation angle rather than exposing a mechanically modeled reverse side.

The studio links each documented component to its entity, individually scoped claims and other products using that part. The factory section only lists locations in product-specific evidence. Filters constrain its claim set, and unknown manufacturing locations remain visible. No material, factory or supplier is inferred from rendered appearance.

## Prompt set

Shared direction: premium photorealistic product visualization for a research application; straight overhead orthographic view; long edge horizontal; complete product centered at roughly 82% of image width; uniform dark navy `#011B34` background; realistic studio lighting and metal/plastic texture; landscape 1536×1024; no extra text, callouts, props or hands; illustrative rendering, not engineering reference.

- `pi5.png`: Raspberry Pi 5 green single-board computer, GPIO along upper edge, USB and Ethernet blocks on the right, square metal processor near center-left, smaller black I/O chip and fine PCB detail.
- `pi4.png`: Raspberry Pi 4 green single-board computer, GPIO along upper edge, metal central BCM2711 processor, right-side USB/Ethernet, smaller radio and USB controller packages.
- `pico.png`: Raspberry Pi Pico elongated green microcontroller board, micro USB at left, central RP2040 package and gold castellated contacts along long edges.
- `pi500.png`: Raspberry Pi 500 compact white keyboard computer with subtle red lower rim and rear connectors.
- `pi400.png`: Raspberry Pi 400 white compact keyboard computer with red lower enclosure rim.
- `pico2.png`: Raspberry Pi Pico 2 elongated board, central RP2350, external flash and crystal, gold edge contacts.
- `pico-w.png`: Raspberry Pi Pico W board, RP2040 and illustrated shielded wireless section, PCB antenna.
- `mac-pro-2019.png`: Apple Mac Pro 2019 silver perforated tower enclosure with stainless handles, three-quarter view (a deliberate exception to the overhead direction).
- `galaxy-s9.png`: Samsung Galaxy S9 black curved-screen handset shown vertically in the landscape frame, abstract blue wallpaper.

All selected outputs are copied into the repository. The original generated files remain in the tool's generated-images directory. Source Sans 3 is self-hosted through Fontsource under its SIL Open Font License; Clario is not bundled because the attached references do not grant a font license. See `DESIGN.md` for the supplied token system and disclosed substitution.

## Aircraft studio assets

Two additional images were generated with the **built-in image tool** on September 10, 2026 and inspected before integration. Final project paths are `public/products/mohajer6.png` and `public/products/shahed238.png`; both are 1536 × 1024. They are original exterior illustrations, not source photographs. Complete airframes are retained with padded containment in the studio. Rotation changes the image-plane angle. System cards separate as conceptual topics rather than as physical internal parts.

### Mohajer-6 prompt

```text
Use case: product-mockup
Asset type: Original exterior illustration for a Supply Atlas public-interest explanatory product profile.
Scene/backdrop: Seamless solid dark navy studio background, base color #011B34. No horizon, scenery, props, or people.
Primary request: A single photorealistic exterior-only illustration of a Mohajer-6 unmanned airframe, in a restrained premium product-catalog aesthetic.
Subject: Externally recognizable light gray Mohajer-6, long straight wings, twin-boom tail, aft pusher propeller, wheel landing gear deployed, external observation turret visible under the forward fuselage. No attached weapons or weapons fittings.
Style/medium: Original high-detail photorealistic studio illustration; realistic subtle matte painted surfaces, restrained seams, crisp silhouette, clean neutral rendering.
Composition/framing: Landscape 3:2 image. Entire isolated airframe centered with at least 15 percent empty margin around every extremity; no cropped wings, tail, nose, or landing gear. Elevated three-quarter overview, nose pointing toward the lower left. Exterior shell only.
Lighting/mood: Soft gallery lighting with broad gentle highlights, subtle rim separation from navy background, quiet and analytical. Very faint studio grounding shadow.
Constraints: Public-interest illustrative exterior, not engineering documentation or factual photographic evidence. No internal cutaways, exposed internal mechanisms, detailed dimensions, specifications, diagrams, arrows, annotations, labels, letters, numbers, watermarks, weapons, explosives, weapon attachments, flags, logos, insignia, soldiers, battle scenes, scenery, or dramatic effects.
```

### Shahed-238 prompt

```text
Use case: product-mockup
Asset type: Original exterior illustration for a Supply Atlas public-interest explanatory product profile.
Scene/backdrop: Seamless solid dark navy studio background, base color #011B34. No horizon, scenery, props, or people.
Primary request: A single photorealistic exterior-only illustration of a Shahed-238 unmanned airframe, in a restrained premium product-catalog aesthetic.
Subject: Externally recognizable compact charcoal-dark Shahed-238 delta-wing jet airframe, sharp triangular wing silhouette, upper air intake, rear outlet, and no propeller. Exterior surfaces closed.
Style/medium: Original photorealistic studio illustration; realistic subtle matte charcoal painted surfaces, restrained exterior seams, crisp silhouette, clean neutral rendering.
Composition/framing: Landscape 3:2 image. Elevated three-quarter overview, nose pointing toward the lower left. Entire isolated airframe centered, visually occupying only the central 70 percent of the canvas width and height so at least 15 percent empty navy margin remains around every extremity. Show complete nose, wings, fins, and rear. No cropping. Exterior shell only.
Lighting/mood: Soft gallery lighting with broad gentle highlights, subtle rim separation from navy background, quiet and analytical. Very faint studio grounding shadow.
Constraints: Public-interest illustrative exterior, not engineering documentation or factual photographic evidence. No internal cutaways, exposed internal mechanisms, detailed dimensions, specifications, diagrams, arrows, annotations, labels, letters, numbers, watermarks, weapons fittings, attached weapons, visible explosives, flags, logos, insignia, soldiers, battle scenes, scenery, dramatic effects, propeller, or added props.
```

## LUCAS exterior and interactive diagram

The original `public/products/lucas.png` image was generated with the built-in image tool and visually inspected. The code-native SVG in `app/lucas-studio.tsx` provides interactive conceptual exterior separation; it is not an image edit or measured mechanical model. Only exterior sections move; dashed topics do not identify internal positions.

Generation record and exact prompt:

```text
Tool: built-in image_gen.imagegen (no API/CLI fallback)
Workspace asset: public/products/lucas.png
Original output: C:/Users/Joe/.codex/generated_images/01a08bb4-a600-7361-8ec7-76e00100c258/exec-eb74ee4a-ec87-43ef-9ece-e845d1e3e544.png
Dimensions: 1536 x 1024
Inspected official reference photos:
https://www.centcom.mil/MEDIA/PUBLIC-RELEASES/Article/4347030/us-launches-one-way-attack-drone-force-in-the-middle-east/
https://media.defense.gov/2025/Dec/03/2003834253/1920/1080/0/251123-D-D0477-1163.JPG
https://media.defense.gov/2025/Dec/03/2003834255/1920/1080/0/251123-D-D0477-1029.JPG
Reference photographs viewed in browser; no reference photo is embedded or copied into this original illustration.
Visual QA: complete aircraft in frame, nose lower-left, delta wing, upright wingtip fins, aft two-blade pusher propeller, closed exterior shell, navy background, no labels/dimensions/internal assemblies. Surface seams and dorsal details are illustrative, not measured configuration evidence.

Exact prompt:
Use case: product-mockup.
Asset type: original editorial exterior illustration for the Supply Atlas research application, 1536 x 1024 pixels, landscape 3:2.
Primary request: a premium photorealistic studio illustration of one complete US SpektreWorks LUCAS unmanned aircraft, showing only its closed external shell. LUCAS has a propeller-driven delta-wing exterior; it is not the jet-powered Shahed-238.
Reference-informed appearance: Based on externally visible morphology in CENTCOM's November 23, 2025 photographs published December 3, 2025. A narrow smooth light-gray central fuselage with a rounded tapered nose extending well forward of the broad swept delta wings; two straight, upright wingtip fins at the rear outer corners; an aft two-blade wooden/tan pusher propeller behind the fuselage; modest low-profile dorsal surface features. No conventional separate tailplane. Do not show a jet exhaust, turbine inlet, undercarriage, missiles or external weapon fittings.
Scene/backdrop: seamless uniform deep navy #011B34 background, matching a dark research dashboard. No scenery, no platform, no horizon, no floor.
Composition/framing: one entire aircraft centered with generous breathing room on every side, all wing tips and both propeller blades inside frame. Elevated upper three-quarter view, nose toward lower-left, aft propeller toward upper-right. The aircraft fills approximately 70 percent of the canvas width. Keep the silhouette clear and recognizable.
Style/medium: polished photorealistic product illustration, restrained editorial mood, not a technical rendering. Matte light-gray composite skin with subtle realistic surface seams, restrained soft highlights and faint cool rim light. No dramatic smoke or action.
Constraints: closed outer shell only. No cutaways, no disassembly, no transparent panels, no hidden internal components, no explosives, no engineering dimensions, no operating mechanisms, no diagrams or arrows. No humans, logos, flags, text, numbers, watermarks, or markings. Do not imitate an actual documentary photograph or label it as measured CAD.

```
