//Globals
let gl;
let program;
let uniforms;
let stuff;
let time;

setup_stuff();

function setup_stuff()
{
	console.trace("Started");	
	const canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas, { alpha: false });

	program = initShaders(gl, "vert", "frag");
	program_coord = initShaders(gl, "simple_vert", "simple_frag");
	gl.useProgram(program);
	uniforms=cacheUniformLocations(gl, program);
	let uniforms_coord=cacheUniformLocations(gl, program_coord);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	let eyePos = vec3(1.5,.6,-0.6); // this is apparently what is meant by default
	
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

	trsMatrix = mat4(); // no transformations just yet
	let coord = coordinateSystem(gl);
	gl.useProgram(program_coord);
	gl.uniformMatrix4fv(uniforms_coord.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms_coord.camera_Matrix, false, flatten(cameraMatrix));
	gl.uniformMatrix4fv(uniforms_coord.trsMatrix, false, flatten(trsMatrix));

	gl.clear(gl.COLOR_BUFFER_BIT );
	send_array_to_attribute_buffer("a_Position", coord.points, 3, gl, program);
	gl.drawArrays(gl.LINES, 0, coord.drawCount);
	gl.useProgram(program);
	trsMatrix=scalem(3.0,1.0,5);
	gl.uniformMatrix4fv(uniforms.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(cameraMatrix));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));

	stuff = plane_3d(gl,50,30);
	send_floats_to_attribute_buffer("a_Position", stuff.points, 2, gl, program);

	//  //gl.drawArrays(gl.LINE_STRIP, 0,6);
	// //return;
	// // Create an empty buffer object to store Index buffer
	// let index_buffer = gl.createBuffer();

	// //// Bind appropriate array buffer to it
	// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

	// //// Pass the vertex data to the buffer
	// gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, stuff.indecies, gl.STATIC_DRAW);

	// //// Draw the triangle
	// gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);

	send_floats_to_attribute_buffer("a_Position", stuff.points, 2, gl, program);
	let index_buffer2 = gl.createBuffer();

	//// Bind appropriate array buffer to it
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer2);

	//// Pass the vertex data to the buffer
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, stuff.line_indecies, gl.STATIC_DRAW);

	//// Draw the triangle
	gl.drawElements(gl.LINES, stuff.line_indecies.length, gl.UNSIGNED_SHORT, 0);

//	gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectSpec.drawCount);
	time=0.0;
render(); // no need for since we only have a static image

}


function render()
{	
	time=time+.03;
	gl.uniform1f(uniforms.time,time);
	gl.clear(gl.COLOR_BUFFER_BIT);
//	gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectSpec.drawCount);
	gl.drawElements(gl.LINES, stuff.line_indecies.length, gl.UNSIGNED_SHORT, 0);
	requestAnimationFrame(render); 
}