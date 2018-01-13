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

	let eyePos = vec3(1.5,1.4,-1.2); 
	
	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(1.5, 0.8, 3.0);// for isometric we should look at origo

	let cameraMatrix = lookAt(eyePos, cameraTarget, upVec);

	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 0.1;
	let far = 200.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);
	let light_pos = vec4(1.5 /*right of cam*/,1.1 /*above*/,-1.7 /*behind*/,0.0); // a bit above, to the right and in the front of the camera

	gl.enable(gl.DEPTH_TEST);

	gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

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
	gl.uniform4fv(uniforms.light_pos, flatten(light_pos));


	stuff = plane_3d(gl,50,30);
	send_floats_to_attribute_buffer("a_Position", stuff.points, 2, gl, program);

	//  //gl.drawArrays(gl.LINE_STRIP, 0,6);
	// //return;
	// Create an empty buffer object to store Index buffer
	let index_buffer = gl.createBuffer();

	//// Bind appropriate array buffer to it
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

	//// Pass the vertex data to the buffer
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, stuff.indecies, gl.STATIC_DRAW);

	//// Draw the triangle
	//gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);

	time=0.0;
render(); // no need for since we only have a static image

}


function render()
{	

	let do_scroll = document.getElementById("enable_scroll").checked;
	if(do_scroll)
	{
		time=time+.012;
	}
	gl.uniform1f(uniforms.time,time);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawElements(gl.TRIANGLES, stuff.indecies.length, gl.UNSIGNED_SHORT, 0);
	requestAnimationFrame(render); 
}