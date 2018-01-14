//Globals
let gl;
let program;
let uniforms;
let grid;

setup_stuff();

function setup_stuff()
{
	console.trace("Started");	
	const canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas, { alpha: false });


	program = initShaders(gl, "vert", "frag");
	program_coord = initShaders(gl, "simple_vert", "simple_frag");

	uniforms = cacheUniformLocations(gl, program);
	let uniforms_coord = cacheUniformLocations(gl, program_coord);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	let eyePos = vec3(.5,.3,-0.6); // this is apparently what is meant by default
	
	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.5, 0.3, 0.0);// for isometric we should look at origo

	let cameraMatrix = lookAt(eyePos, cameraTarget, upVec);

	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 0.1;
	let far = 200.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);

//	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	gl.clear(gl.COLOR_BUFFER_BIT );

	//Draw the coordinate system
	gl.useProgram(program_coord);
	trsMatrix = mat4(); // no for the coordinate system just yet
	let coord = coordinateSystem(gl);
	gl.uniformMatrix4fv(uniforms_coord.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms_coord.camera_Matrix, false, flatten(cameraMatrix));
	gl.uniformMatrix4fv(uniforms_coord.trsMatrix, false, flatten(trsMatrix));

	send_array_to_attribute_buffer("a_Position", coord.points, 3, gl, program_coord);
	send_array_to_attribute_buffer("a_Color", coord.colors, 4, gl, program_coord);
	gl.drawArrays(gl.LINES, 0, coord.drawCount);

	//Draw the grid
	gl.useProgram(program);
	trsMatrix=scalem( 1.0 , 1.0 , 5.0 ); //extend 5x as long in the z-direction
	gl.uniformMatrix4fv(uniforms.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(cameraMatrix));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));

	grid = plane_3d(gl,50,10);
	send_floats_to_attribute_buffer("a_Position", grid.points, 2, gl, program);
	
	let index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, grid.line_indecies, gl.STATIC_DRAW);

	//// Draw the triangles
	gl.drawElements(gl.LINES, grid.line_indecies.length, gl.UNSIGNED_SHORT, 0);
//	render(); // no need for since we only have a static image
}


function render()
{	

	gl.clear(gl.COLOR_BUFFER_BIT);
//	gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectSpec.drawCount);
 	gl.drawElements(gl.TRIANGLES, grid.indecies.length/3, gl.UNSIGNED_SHORT, 0);
	requestAnimationFrame(render); 
}