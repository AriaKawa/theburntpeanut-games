extends Node2D
var target: Node2D
var destination: Vector2
var damage := 24.0
var is_player_owned := true
var speed := 400.0
var age := 0.0
var exploded := false
func _ready():
	rotation = (destination-global_position).angle()
func _draw():
	draw_polygon(PackedVector2Array([Vector2(-14,-3),Vector2(6,-3),Vector2(13,0),Vector2(6,3),Vector2(-14,3)]),PackedColorArray([Color("747a35")]))
	draw_line(Vector2(-14,0),Vector2(-22,0),Color("ffb62b"),4)
	draw_line(Vector2(-13,0),Vector2(-18,0),Color("fff3ad"),2)
func _process(delta):
	age += delta
	if exploded: return
	var step = speed*delta
	if global_position.distance_to(destination)<=step or age>2.0:
		detonate()
	else:
		global_position=global_position.move_toward(destination,step)
func detonate():
	if exploded: return
	exploded=true
	var effect=preload("res://effects/explosion_effect.tscn").instantiate()
	effect.scale=Vector2(0.32,0.32)
	get_parent().add_child(effect)
	effect.global_position=global_position+Vector2(0,24)
	# Splash affects living opponents only, once per rocket.
	var struck=[]
	for node in get_parent().find_children("*","RigidBody2D",true,false):
		if (node is melee_unit or node is range_unit) and node.is_player_owned != is_player_owned and node.health>0:
			if (node.global_position+Vector2(0,-30)).distance_to(global_position)<65:
				node.take_damage(damage)
				struck.append(node)
	if is_instance_valid(target) and target not in struck and target.has_method("take_damage"):
		target.take_damage(damage)
	queue_free()
