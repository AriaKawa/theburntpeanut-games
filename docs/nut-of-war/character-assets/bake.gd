extends SceneTree
## Run with a rendering-capable Godot instance, after importing this project.
## Creates game-compatible SpriteFrames with idle/walk/attack/die, 12 fps.
func _initialize():
	call_deferred("bake")

func bake():
	var viewport = SubViewport.new()
	viewport.size = Vector2i(384,256)
	viewport.transparent_bg = true
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	root.add_child(viewport)
	DirAccess.make_dir_recursive_absolute("res://baked")
	for who in ["peanut","hutch"]:
		var rig = Node2D.new()
		rig.set_script(load("res://rig.gd"))
		rig.character = who
		rig.animate = false
		rig.position = Vector2(190,220)
		viewport.add_child(rig)
		var sheet = Image.create(384*12,256*4,false,Image.FORMAT_RGBA8)
		var states = ["idle","walk","attack","die"]
		var text = "[gd_resource type=\"SpriteFrames\" load_steps=50 format=3]\n\n[ext_resource type=\"Texture2D\" path=\"res://baked/%s.png\" id=\"1\"]\n" % who
		for row in range(4):
			rig.animation = states[row]
			for frame in range(12):
				var ratio = frame/11.0 if row==3 else frame/12.0
				rig.sample_pose(ratio*rig.LENGTHS[states[row]])
				await process_frame
				await RenderingServer.frame_post_draw
				var rendered = viewport.get_texture().get_image()
				if rendered.is_empty():
					push_error("Rendering unavailable; use a rendering-capable instance, not --headless.")
					quit(1)
					return
				sheet.blit_rect(rendered,Rect2i(0,0,384,256),Vector2i(frame*384,row*256))
				text += "\n[sub_resource type=\"AtlasTexture\" id=\"F%d\"]\natlas = ExtResource(\"1\")\nregion = Rect2(%d,%d,384,256)\n" % [row*12+frame,frame*384,row*256]
		text += "\n[resource]\nanimations = [\n"
		for row in range(4):
			text += "{\"frames\": ["
			for frame in range(12):
				text += '{"duration": 1.0, "texture": SubResource("F%d")}%s' % [row*12+frame,"," if frame<11 else ""]
			text += '], "loop": %s, "name": &"%s", "speed": %f}%s\n' % ["true" if row<3 else "false",states[row],12.0/rig.LENGTHS[states[row]],"," if row<3 else ""]
		text += "]\n"
		sheet.save_png("res://baked/%s.png" % who)
		var file = FileAccess.open("res://baked/%s.tres" % who,FileAccess.WRITE)
		file.store_string(text)
		file.close()
		rig.queue_free()
		await process_frame
		print("BAKED: ",who," 48 frames; origin (190,220)")
	quit()
