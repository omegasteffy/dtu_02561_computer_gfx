//Globals
let gl;
let program;
let uniforms;
let stuff;
let freqScales;
let lightOffset;
let lineSpec;
let plane;
let time;
function generate_line()
{
	let x={};
	x.NUM_STEP=200;
	x.step_size=1/x.NUM_STEP;
	x.linepoints = new Float32Array(x.NUM_STEP);
	for(let n=0; n <x.NUM_STEP ; n++)
	{
		x.linepoints[n] = x.step_size*n;
	}
	return x;
}
init();

function init()
{
	console.trace("Started");	
	const canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas, { alpha: false });

	program = initShaders(gl, "vert", "frag");
	gl.useProgram(program);
	uniforms=cacheUniformLocations(gl, program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	freqScales = new Float32Array(4);
	lineSpec = generate_line();
	plane = plane_3d(gl,100,100);
	time = 0;
	document.getElementById("frq1_slider").onchange = setup_stuff;
	document.getElementById("frq2_slider").onchange = setup_stuff;
	document.getElementById("frq3_slider").onchange = setup_stuff;
	document.getElementById("frq4_slider").onchange = setup_stuff;
	document.getElementById("light_offset_slider").onchange = setup_stuff;
	setup_stuff();
	render();
}
function setup_stuff()
{

	freqScales[0] = document.getElementById("frq1_value").innerHTML;
	freqScales[1] = document.getElementById("frq2_value").innerHTML;
	freqScales[2] = document.getElementById("frq3_value").innerHTML;
	freqScales[3] = document.getElementById("frq4_value").innerHTML;
	lightOffset = document.getElementById("light_offset_value").innerHTML;


	gl.clear(gl.COLOR_BUFFER_BIT );
	gl.useProgram(program);
	
}



function render()
{	
	let do_scroll = document.getElementById("enable_scroll").checked;
	if(do_scroll)
	{
		time=time+.01;
	}
	let trsMatrix=mult(translate(-1,0,0), scalem(2.0,1.0,1));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));

	gl.uniform1f(uniforms.time, time);
	gl.uniform1i(uniforms.is_a_line, false);

	gl.uniform1f(uniforms.light_offset, lightOffset);
	gl.uniform4fv(uniforms.noise_frq_scale,freqScales);
	send_floats_to_attribute_buffer("a_Position", plane.points, 2, gl, program);

	let index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, plane.indecies, gl.STATIC_DRAW);
	gl.drawElements(gl.TRIANGLES, plane.indecies.length, gl.UNSIGNED_SHORT, 0);

	//Draw noise line
	trsMatrix=mult(translate(-1,-.5,0), scalem(2.0,1.0,1.0));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
	gl.uniform1i(uniforms.is_a_line, true);
	
	send_floats_to_attribute_buffer("a_Position", lineSpec.linepoints, 1, gl, program);
	gl.drawArrays(gl.LINE_STRIP, 0, lineSpec.NUM_STEP);
	requestAnimationFrame(render); 
}