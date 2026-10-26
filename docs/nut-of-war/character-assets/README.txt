AGE OF NUT CHARACTER ANIMATION MASTERS

Open project.godot in Godot 4.7 and run workshop.tscn.
1 = idle, 2 = walk, 3 = attack, 4 = die; Space pauses.

rig.gd assembles independent shoulder/elbow, hip/knee/ankle, head/helmet,
torso, and weapon nodes. Both sides use separate instances of the limb art.
The weapon inherits the hand transform. All region rectangles and joint
positions are editable in rig.gd; source atlases are retained unchanged.
cutout.gdshader removes the generated soft halo at render time.

baked/peanut.tres and baked/hutch.tres are Godot SpriteFrames resources.
Each has 48 frames: 12 each of idle, walk, attack and die. First three loop;
die ends on the ground. Timings are in animation-manifest.json.

The current game uses AnimatedSprite2D, not skeletal animation. Import these
resources and the PNG sheets under the same baked/ folder. The source rig is
for authoring; the baked frames are for the game's runtime animation system.
Every 384x256 frame shares the ground pivot (190,220). With centered drawing,
set offset to Vector2(2,-92), use zero state-specific sprite positions, and
choose the sprite scale for the unit (the original cave unit uses 0.5).
Retarget the unit's damage and sound events to these new 12-frame attacks;
the suggested contact frame is 5. These are starter motions, not a claim of
frame-exact reproduction of every original animation.

To regenerate the sheets after changing the rig, run Godot with:
  --path <this-folder> --script res://bake.gd
Use a rendering-capable process, not --headless. Reimport after baking.

References, final prompts and generation method: animation-manifest.json.
