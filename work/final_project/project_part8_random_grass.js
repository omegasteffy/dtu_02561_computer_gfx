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
	uniforms=cacheUniformLocations(gl, program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	let eyePos = vec3(1.5,1.8,-1.2); 
	
	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(1.5, 0.8, 3.0);// for isometric we should look at origo

	let cameraMatrix = lookAt(eyePos, cameraTarget, upVec);

	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 0.1;
	let far = 200.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);
	let light_pos = vec4(5.0 /*left  of cam*/,30.0 /*above*/,4.7 /*behind*/,0.0); // a bit above, to the right and in the front of the camera

	gl.enable(gl.DEPTH_TEST);

	//gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required


	gl.clear(gl.COLOR_BUFFER_BIT );
	gl.useProgram(program);
	trsMatrix=scalem(3.0,1.0,5);
	gl.uniformMatrix4fv(uniforms.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(cameraMatrix));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
	gl.uniform4fv(uniforms.light_pos, flatten(light_pos));


	grid = plane_3d(gl,50,30);
	send_floats_to_attribute_buffer("a_Position", grid.points, 2, gl, program);

	let index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, grid.indecies, gl.STATIC_DRAW);
	time=0.0;
	render();

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
	gl.drawElements(gl.TRIANGLES, grid.indecies.length, gl.UNSIGNED_SHORT, 0);
	requestAnimationFrame(render); 
}