extends Node2D
func _unhandled_key_input(event):
	if event is InputEventKey and event.pressed and not event.echo:
		var states = {KEY_1:"idle",KEY_2:"walk",KEY_3:"attack",KEY_4:"die"}
		for rig in [$Peanut,$Hutch]:
			if event.keycode in states:
				rig.animation=states[event.keycode]
				rig.clock=0.0
				rig.animate=true
			elif event.keycode==KEY_SPACE:
				rig.animate=not rig.animate
