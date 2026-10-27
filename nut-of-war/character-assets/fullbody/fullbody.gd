extends Node2D
signal animation_event(event_name: String)
signal animation_finished
@export_enum("peanut", "hutch") var character := "peanut"
@export var facing_left := false
var animation := "idle"
var frame := 0
var elapsed := 0.0
var playing := true
var data: Dictionary
var textures := {}
func _ready():
	var folder = get_script().resource_path.get_base_dir()
	data = JSON.parse_string(FileAccess.get_file_as_string(folder + "/animations.json"))
	for state in data.characters[character]:
		textures[state] = load(folder + "/" + data.characters[character][state].image)
	queue_redraw()
func play(state: String):
	if not data.animations.has(state): return
	animation = state
	frame = 0
	elapsed = 0.0
	playing = true
	queue_redraw()
func _process(delta):
	if not playing or data.is_empty(): return
	elapsed += delta
	var meta = data.animations[animation]
	while elapsed >= meta.durations[frame] / meta.fps:
		elapsed -= meta.durations[frame] / meta.fps
		if frame + 1 >= meta.count:
			if meta.loop: frame = 0
			else:
				playing = false
				animation_finished.emit()
				break
		else: frame += 1
		if animation == "attack":
			for event_name in data.events.attack:
				if frame == int(data.events.attack[event_name]): animation_event.emit(event_name)
	queue_redraw()
func _draw():
	if data.is_empty(): return
	var entry = data.characters[character][animation].frames[frame]
	if entry == null: return
	var s = entry.src
	var d = entry.dst
	draw_set_transform(Vector2.ZERO, 0, Vector2(-1 if facing_left else 1, 1))
	draw_texture_rect_region(textures[animation], Rect2(d[0]-160,d[1]-270,d[2],d[3]), Rect2(s[0],s[1],s[2],s[3]))
