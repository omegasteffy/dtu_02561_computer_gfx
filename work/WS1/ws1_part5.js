let gl;
let program;
let uniforms;
let circle;
let y_offset = 0.1;

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
	setup_circle();
	document.getElementById("subdivision_slider").onchange = setup_circle;
	requestAnimationFrame(render);
}
function setup_circle()
{
	let num_stops_on_circle = document.getElementById("subdivision_slider").value;
	circle = circle_2d(gl,num_stops_on_circle);
	send_floats_to_attribute_buffer("a_Position",circle.vertices,circle.perDrawing,gl,program);
}

function render()
{
	gl.uniform1f(uniforms.y_offset, y_offset);
	y_offset += 0.1;
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(circle.drawtype, 0, circle.drawCount);
	requestAnimationFrame(render); 
}

setup_stuff(); // start