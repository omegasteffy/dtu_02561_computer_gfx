//Globals
let gl;
let program;
let uniforms;

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
	document.getElementById("freq_scale_slider").onchange = setup_stuff; // restart on each change
	setup_stuff();
}


//Create a smooth line by several short straigh lines
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

function setup_stuff()
{
	let freq_scaling = document.getElementById("freq_scale_slider").value;

	gl.clear(gl.COLOR_BUFFER_BIT );
	gl.useProgram(program);
	trsMatrix=mult(translate(-1,0,0), scalem(2.0,1.0,1)); // we wish the grid/noise image to span the upper part from x=-1,1 and y=0,1
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));

	gl.uniform1i(uniforms.is_a_line, false);
	grid = plane_3d(gl,100,100);

	gl.uniform1f(uniforms.frequencyScale, freq_scaling);
	send_floats_to_attribute_buffer("a_Position", grid.points, 2, gl, program);

	let index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, grid.indecies, gl.STATIC_DRAW);
	gl.drawElements(gl.TRIANGLES, grid.indecies.length, gl.UNSIGNED_SHORT, 0);
	//Draw noise line
	trsMatrix=mult(translate(-1,-.5,0), scalem(2.0,1.0,1.0));// move it down and to the left for it spans from -1,to 1 on the screen
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
	gl.uniform1i(uniforms.is_a_line, true);
	
	
	let line = generate_line();

	send_floats_to_attribute_buffer("a_Position", line.linepoints, 1, gl, program); //only a x-coordinate needed when function is inside shader program
	gl.drawArrays(gl.LINE_STRIP, 0, line.NUM_STEP);
//	render(); // no need for since we only have a static image
}