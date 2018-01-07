let gl;
let program;
let uniforms;
let circle;
function circle_2d(gl,no_points)
{
	if( 5 > no_points)
	{
		throw("At least 5 points are required!");
	}
	let x = {};
	x.vertices = new Float32Array(2*(no_points+2));
	const angle_per_point = 2*Math.PI/no_points;
	// draw the center
	x.vertices[0] =0;
	x.vertices[1] =0;
	for (let n = 1; n < no_points+2; n++)
	{
		x.vertices[2*n] = 0.5* Math.cos(angle_per_point * n );
		x.vertices[2*n +1 ] = 0.5* Math.sin(angle_per_point * n );
	}
	x.perDrawing = 2;
	x.drawCount = no_points+2;
	x.drawtype = gl.TRIANGLE_FAN;
	return x;
}

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

	circle = circle_2d(gl,8);
	send_floats_to_attribute_buffer("a_Position",circle.vertices,circle.perDrawing,gl,program);
	requestAnimationFrame(render); 
}
var y_offset = 0.1;


function render()
{
	gl.uniform1f(uniforms.y_offset, y_offset);
	y_offset += 0.1;
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(circle.drawtype, 0, circle.drawCount);
	requestAnimationFrame(render); 
}

setup_stuff();