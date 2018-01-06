let gl;
let program;
let uniforms;
let rectSpec;

function setup_stuff() 
{
	console.trace("Started");
	const canvas = document.getElementById('draw_area');

	gl = WebGLUtils.setupWebGL(canvas);
	program = initShaders(gl, "vert", "frag");
	uniforms = cacheUniformLocations(gl,program);

	gl.useProgram(program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	rectSpec = rectangle_2d(gl);
	send_floats_to_attribute_buffer("a_Position",rectSpec.vertices,rectSpec.perDrawing,gl,program);
	requestAnimationFrame(render); 
}
var y_offset = 0.1;


function render()
{
	gl.uniform1f(uniforms.y_offset, y_offset);
	y_offset += 0.1;
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(rectSpec.drawtype, 0, rectSpec.drawCount);
	requestAnimationFrame(render); 
}

setup_stuff();