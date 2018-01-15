/**
 * Global variables
 */
let cubeSpec; //Specification of the cube containing the vertices
let coordinateSys;
let gl;		  //the GL context
let program;  // the compiled GL-program
let moveCube; //matrix for positioning the cube

const gl_drawtype = { "LINES": 0, "TRIANGLES": 1 };

function setup_stuff() {
	console.trace("Started");

	//general boiler plate stuff
	let canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);
	program = initShaders(gl, "vert1", "frag1");
	gl.useProgram(program);
	uniforms = cacheUniformLocations(gl, program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	coordinateSys = coordinateSystem(gl);

	let eye = vec3(1.0, 3.0, 5.0); //We put camera in corner in order to make the isometric view
	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.0, 0.0, 0.0);// for isometric we should look at origo

	cameraMatrix = lookAt(eye, cameraTarget, upVec);

	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 1.0;
	let far = 100.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

	let proj_transform_Matrix = mult(perMatrix, cameraMatrix);
	gl.uniformMatrix4fv(uniforms.proj_transform_Matrix, false, flatten(proj_transform_Matrix));
	

	let sphere = sphere_3d(4);
	{//The sphere
		trsMatrix = mat4();//rotateX(Math.random() * 45);
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		send_array_to_attribute_buffer("vPosition", sphere.Points, 4, gl, program);
		send_array_to_attribute_buffer("vColor", sphere.Colors, 4, gl, program);
		gl.drawArrays(gl.TRIANGLES, 0, sphere.drawCount);
	}

	requestAnimationFrame(render); 
}
setup_stuff();

function render()
{


	//requestAnimationFrame(render); 
}