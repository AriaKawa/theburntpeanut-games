extends melee_unit

var rocket_fired := false
var hit_sfx


# Called when the node enters the scene tree for the first time.
func _ready():
	health = 70
	damage = 10
	move_speed = 50
	money_die_reward = 20
	
	# Both are 384x256 frames baked from the original SWF timelines at half scale.
	# Habibi (military rifleman puppet) stands at (192,222), Hutch (cave melee puppet) at (192,236).
	$AnimatedSprite2D.sprite_frames = preload("res://assets/age-of-nut/characters/habibi/frames.tres") if is_player_owned else preload("res://assets/age-of-nut/characters/hutch/frames.tres")
	$AnimatedSprite2D.scale = Vector2(0.5,0.5)
	var sprite_origin = Vector2(0,-47) if is_player_owned else Vector2(0,-54)
	sprite_walk_position = sprite_origin
	sprite_idle_position = sprite_origin
	sprite_die_position = sprite_origin
	sprite_attack_position = sprite_origin
	
	hit_sfx = get_node("sfx/hit_sfx")
	
	
	super()
	if is_player_owned == false:
		$Shadow.position.x = -$Shadow.position.x
	
	


# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta):
	super(delta)

func attack_state():
	if is_player_owned:
		launcher_attack()
		return
	if $RayCast2D.is_colliding() == false:
		change_state(state.walk)
		stop_all_sfx()
		return
	
	if $AnimatedSprite2D.frame == 12:
		hit_sfx.play()
		# whack_sfx.pitch_scale = randf_range(0.9, 1.1)
	if $AnimatedSprite2D.frame == 19:
		do_damage($RayCast2D.get_collider())


	

func find_rocket_target():
	var world=get_node_or_null("/root/main_game")
	if world==null: return null
	var candidates=[]
	var enemies=world.get_node_or_null("enemy_units")
	if enemies!=null: candidates=enemies.get_children()
	var base=world.get_node_or_null("enemy_base")
	if base!=null: candidates.append(base)
	var nearest=null
	var distance=231.0
	for candidate in candidates:
		if candidate.health<=0: continue
		var dx=candidate.global_position.x-global_position.x
		if dx>=-10 and dx<distance:
			distance=dx
			nearest=candidate
	return nearest

func move_state(delta):
	if is_player_owned and find_rocket_target()!=null:
		change_state(state.attack)
		return
	super(delta)

func idle_state():
	if is_player_owned and find_rocket_target()!=null:
		change_state(state.attack)
		return
	super()

func launcher_attack():
	var victim=find_rocket_target()
	if victim==null:
		rocket_fired=false
		change_state(state.walk)
		return
	# Rifleman shoot timeline fires on zero-based frame 9.
	if $AnimatedSprite2D.frame!=9: rocket_fired=false
	if $AnimatedSprite2D.frame==9 and not rocket_fired:
		rocket_fired=true
		var rocket=Node2D.new()
		rocket.set_script(preload("res://assets/age-of-nut/rocket.gd"))
		rocket.target=victim
		rocket.destination=victim.global_position+Vector2(0,-30)
		rocket.is_player_owned=true
		get_node("/root/main_game").add_child(rocket)
		rocket.global_position=global_position+Vector2(47,-65)
		rocket.rotation=(rocket.destination-rocket.global_position).angle()
