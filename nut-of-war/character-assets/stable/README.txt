AGE OF NUT - STABLE FULL-BODY ANIMATIONS
Fixed master torso/head artwork, articulated limbs, baked complete frames.
Idle 50, walk 43, attack 40, death 23, all 30fps. Attack sound frame 12 and damage frame 19 (zero-based).
Body and head remain fixed during walk/idle; attack uses keyed torso lean; death rotates the same complete rig. No independently generated animation frames.
Motion is reference-guided, not a pixel-exact trace of the original.
Preview defaults to this version; select Previous redraws to compare the earlier jitter.
Full-body source cells are 320x320 in an 8x8 atlas. Origin (190,270).
Editable Godot source is in source/. Run Godot --path source --script bake.gd to bake.
The gameplay reference has not been reskinned.
