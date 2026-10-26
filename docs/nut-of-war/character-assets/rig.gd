extends Node2D
## Editable cutout master. Animation names match the original melee_unit.gd.
@export_enum("peanut", "hutch") var character: String = "peanut"
@export_enum("idle", "walk", "attack", "die") var animation: String = "walk"
@export var animate: bool = true
var clock: float = 0.0
var joints: Dictionary = {}
var root_pose: Node2D
var atlas: Texture2D
var part_regions: Array[Rect2]
const LENGTHS = {"idle": 1.2, "walk": 0.8, "attack": 0.9, "die": 0.8}

func _ready():
	atlas = load("res://%s-parts.png" % character)
	if character == "peanut":
		part_regions = [Rect2(70,45,285,515),Rect2(390,130,365,355),Rect2(880,155,145,300),Rect2(1275,145,160,345),Rect2(80,600,235,360),Rect2(475,620,160,325),Rect2(780,745,240,200),Rect2(1060,725,455,160)]
	else:
		part_regions = [Rect2(55,65,305,440),Rect2(425,125,340,330),Rect2(865,115,210,365),Rect2(1250,75,180,440),Rect2(90,540,210,440),Rect2(485,560,180,420),Rect2(775,740,280,160),Rect2(1080,725,450,160)]
	root_pose = Node2D.new()
	root_pose.name = "Pose"
	add_child(root_pose)
	leg("Rear", -7, true)
	arm("Rear", true)
	var body = joint("Torso", root_pose, Vector2(0,-58))
	if character == "peanut":
		piece(body,0,Vector2(43,107),Vector2(-21,-102))
		var helmet = joint("Helmet",body,Vector2(0,-107))
		piece(helmet,1,Vector2(49,47),Vector2(-25,-8))
	else:
		piece(body,0,Vector2(53,70),Vector2(-28,-67))
		var head = joint("Head",body,Vector2(-2,-56))
		piece(head,1,Vector2(48,47),Vector2(-20,-43))
	leg("Front", 6, false)
	arm("Front", false)
	sample_pose(0.0)

func joint(label: String, parent_node: Node2D, at: Vector2) -> Node2D:
	var node = Node2D.new()
	node.name = label
	node.position = at
	parent_node.add_child(node)
	joints[label] = node
	return node

func piece(parent_node: Node2D, part: int, size: Vector2, at: Vector2):
	var sprite = Sprite2D.new()
	sprite.name = "Part%d" % part
	sprite.texture = atlas
	sprite.region_enabled = true
	sprite.region_rect = part_regions[part]
	sprite.centered = false
	sprite.position = at
	sprite.scale = size / part_regions[part].size
	var material = ShaderMaterial.new()
	material.shader = preload("res://cutout.gdshader")
	sprite.material = material
	parent_node.add_child(sprite)

func leg(side: String, x: float, rear: bool):
	var hip = joint(side+"Hip",root_pose,Vector2(x,-59))
	if rear: hip.modulate = Color(0.8,0.8,0.8)
	piece(hip,4,Vector2(22,34),Vector2(-11,-4))
	var knee = joint(side+"Knee",hip,Vector2(0,27))
	piece(knee,5,Vector2(18,33),Vector2(-9,-4))
	var ankle = joint(side+"Ankle",knee,Vector2(0,26))
	piece(ankle,6,Vector2(27,17),Vector2(-10,-5))

func arm(side: String, rear: bool):
	var shoulder = joint(side+"Shoulder",root_pose,Vector2(-5,-107 if character=="peanut" else -112))
	if rear: shoulder.modulate = Color(0.8,0.8,0.8)
	piece(shoulder,2,Vector2(17,32),Vector2(-8,-5))
	var elbow = joint(side+"Elbow",shoulder,Vector2(0,24))
	piece(elbow,3,Vector2(18,36),Vector2(-8,-4))
	if not rear:
		var hand = joint("Weapon",elbow,Vector2(2,26))
		piece(hand,7,Vector2(62,20),Vector2(-7,-7))

func _process(delta):
	if animate:
		clock += delta
		sample_pose(clock)

func sample_pose(time: float):
	if not is_instance_valid(root_pose): return
	for j in joints.values(): j.rotation = 0.0
	root_pose.position = Vector2.ZERO
	root_pose.rotation = 0.0
	var phase = fmod(time,float(LENGTHS[animation])) / float(LENGTHS[animation])
	var wave = sin(phase*TAU)
	if animation == "idle":
		root_pose.position.y = wave*0.8
		joints.FrontShoulder.rotation = wave*0.025
	elif animation == "walk":
		root_pose.position.y = -abs(wave)*2.0
		for side in ["Front","Rear"]:
			var swing = wave if side=="Front" else -wave
			joints[side+"Hip"].rotation = swing*0.35
			joints[side+"Knee"].rotation = max(0.0,-swing)*0.45
			joints[side+"Ankle"].rotation = -swing*0.15
			joints[side+"Shoulder"].rotation = -swing*0.22
	elif animation == "attack":
		# Wind-up, hit at 45%, and recovery. The weapon follows the hand joint.
		var swing = -2.0*sin(phase/0.45*PI/2.0) if phase<0.45 else lerpf(-2.0,0.0,(phase-0.45)/0.55)
		joints.FrontShoulder.rotation = swing
		joints.FrontElbow.rotation = -0.35*sin(phase*PI)
		root_pose.position.x = sin(phase*PI)*4.0
	elif animation == "die":
		var fall = clampf(time/float(LENGTHS.die),0.0,1.0)
		root_pose.rotation = -fall*PI/2.0
		root_pose.position.y = -5*fall
		joints.FrontShoulder.rotation = fall*0.8
		joints.FrontKnee.rotation = fall*0.5
