//Globals
let gl;
let program;
let uniforms;
let grid;
let time;

setup_stuff();

function setup_stuff()
{
	console.trace("Started");	
	const canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas, { alpha: false });

	program = initShaders(gl, "vert", "frag");
	gl.useProgram(program);
	uniforms=cacheUniformLocations(gl, program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	let eyePos = vec3(1.5,.6,-1.3); // this is apparently what is meant by default
	
	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(1.5, 0.5, 0.0);// for isometric we should look at origo

	let cameraMatrix = lookAt(eyePos, cameraTarget, upVec);

	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 0.1;
	let far = 200.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);

//	gl.enable(gl.DEPTH_TEST);
//	gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

	gl.clear(gl.COLOR_BUFFER_BIT );

	gl.useProgram(program);
	trsMatrix=scalem(3.0,1.0,5);
	gl.uniformMatrix4fv(uniforms.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(cameraMatrix));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));

	grid = plane_3d(gl,50,30);

	send_floats_to_attribute_buffer("a_Position", grid.points, 2, gl, program);
	let index_buffer = gl.createBuffer();

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, grid.line_indecies, gl.STATIC_DRAW);
	gl.drawElements(gl.LINES, grid.line_indecies.length, gl.UNSIGNED_SHORT, 0);

	time=0.0;
	render();

}


function render()
{	

	let do_scroll = document.getElementById("enable_scroll").checked;
	if(do_scroll)
	{
		time=time+.017;
	}
	gl.uniform1f(uniforms.time,time);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawElements(gl.LINES, grid.line_indecies.length, gl.UNSIGNED_SHORT, 0);
	requestAnimationFrame(render); 
}