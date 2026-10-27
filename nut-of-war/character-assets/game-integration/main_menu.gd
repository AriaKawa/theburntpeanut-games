extends Control

func _ready():
	# Keep the original title placement and shadow, with the new gold artwork.
	var title = $VBoxContainer/Title
	$VBoxContainer/Title/Logo.hide()
	$VBoxContainer/Title/LogoBG.hide()
	var texture = load("res://assets/age-of-nut/age-of-nut-logo.png")
	for is_shadow in [true, false]:
		var logo = Sprite2D.new()
		logo.texture = texture
		logo.region_enabled = true
		logo.region_rect = Rect2(30, 220, 2130, 280)
		logo.scale = Vector2(0.252, 0.252)
		logo.position = Vector2(141, 19 if is_shadow else 17)
		if is_shadow:
			logo.modulate = Color(0.12, 0.08, 0.0, 0.65)
		else:
			var shine = ShaderMaterial.new()
			shine.shader = load("res://assets/age-of-nut/gold-shine.gdshader")
			logo.material = shine
		title.add_child(logo)

func _on_play_pressed():
	GlobalVariables.current_stage = GlobalVariables.stage.cave
	GlobalVariables.player_exp = 0
	GlobalVariables.player_money = 175
	get_tree().change_scene_to_file("res://scenes/difficulty_selection.tscn")

func _on_instructions_pressed():
	get_tree().change_scene_to_file("res://scenes/instructions_screen.tscn")

func _on_options_pressed():
	get_tree().change_scene_to_file("res://scenes/options_menu.tscn")

func _on_extra_pressed():
	get_tree().change_scene_to_file("res://scenes/extra_screen.tscn")

func _on_credits_pressed():
	get_tree().change_scene_to_file("res://scenes/credits_menu.tscn")

func _on_exit_pressed():
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.location.assign(new URL('../', window.location.href).href)")
	else:
		OS.shell_open("https://ariakawa.github.io/theburntpeanut-games/")

func _on_assets_pressed():
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.location.assign(new URL('character-assets/preview.html', window.location.href).href)")
	else:
		OS.shell_open("https://ariakawa.github.io/theburntpeanut-games/nut-of-war/character-assets/preview.html")
