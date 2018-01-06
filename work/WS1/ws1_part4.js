//global variables
let rectSpec;
let gl;
let program;
let theta = 0.5;
let uniforms;
function setup_stuff() 
{
	console.trace("Started");
	var canvas = document.getElementById('draw_area');

	gl = WebGLUtils.setupWebGL(canvas);

	program = initShaders(gl, "vert", "frag");

	gl.useProgram(program);
	uniforms = cacheUniformLocations(gl,program); //instead of requesting all uniform locations we use find these right after init
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	const colors = [ CommonColors.red
					, CommonColors.blue
					, CommonColors.green
					, CommonColors.blue];

	rectSpec = rectangle_2d(gl); // this is specified in ../other_common/shapes.js
	send_floats_to_attribute_buffer("a_Position", rectSpec.vertices, rectSpec.perDrawing, gl, program);
	send_array_to_attribute_buffer("a_Color", colors, 4, gl, program);
	requestAnimationFrame(render);
}

function render()
{
	gl.uniform1f(uniforms.theta, theta); //location is already stored
	theta += 0.1;
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(rectSpec.drawtype, 0, rectSpec.drawCount);
	requestAnimationFrame(render); 
}

setup_stuff(); // start!