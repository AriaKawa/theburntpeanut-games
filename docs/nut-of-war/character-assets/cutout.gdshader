shader_type canvas_item;
varying vec4 tint;
void vertex() { tint = COLOR; }
void fragment() {
 vec4 part = texture(TEXTURE,UV);
 if(part.a < 0.9) { discard; }
 COLOR = vec4(part.rgb,1.0) * tint;
}
