AGE OF NUT - FULL-BODY ANIMATION REDRAWS

Peanut and Hutch are whole-body frames, not limb rigs. Each original cave-melee pose atlas was supplied as the primary image-generation reference.

Idle: 50 frames; Walk: 43; Attack: 40; Die: 24. All 30 fps, original frame durations and loops retained. Attack sound: zero-based frame 12; damage: zero-based frame 19. Final death frame is empty.

animations.json is the authoritative atlas map: src is the PNG crop, dst is its placement in a 320x320 canvas, origin (160,270). Atlas row spacing is irregular, so do not slice using a uniform grid. Registration follows the original bounding-box bottom and horizontal center; character scale is fixed from its idle height. No raster artwork was altered during registration.

Redraw poses follow the reference but are not pixel-identical; generated outlines have some frame-to-frame variation. Playback timing is exact.

Original reference: github.com/apiotrowski255/age-of-war, commit c6f2d0f6954a5e83e28e0809115b3b3a2af04a39, units/cave/melee. This repository is a fan recreation using extracted original artwork; it does not establish a license for the original game assets. References are included for comparison.

Godot: attach fullbody.gd to a Node2D, set character to peanut or hutch. Call play("walk") etc. animation_event emits sound/damage on the original frames. Assets are prepared here; the live reference game is not yet reskinned.
