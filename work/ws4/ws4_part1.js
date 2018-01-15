/**
 * Global variables
 */
let sphere; //Specification of the cube containing the vertices
let coordinateSys;
let gl;		  //the GL context
let program;  // the compiled GL-program
let cameraMatrix;

function init()
{
	
	console.log("setup event handler");
	setup_stuff();
	document.getElementById("subdivision_slider").onchange = render;
	requestAnimationFrame(render); 
	
}
function setup_stuff() {

	//general boiler plate stuff
	let canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);
	program = initShaders(gl, "vert", "frag");
	gl.useProgram(program);
	uniforms = cacheUniformLocations(gl, program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	coordinateSys = coordinateSystem(gl);

	let eye = vec3(1.0, 4.0, 3.0); //We put camera in corner in order to make the isometric view
	let upVec = vec3(0.1, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.22, 1.1, 1.0);// for isometric we should look at origo

	cameraMatrix = lookAt(eye, cameraTarget, upVec);

	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 1.0;
	let far = 100.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);

	//gl.enable(gl.DEPTH_TEST);
	//gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

	let proj_transform_Matrix = mult(perMatrix, cameraMatrix);
	gl.uniformMatrix4fv(uniforms.proj_transform_Matrix, false, flatten(proj_transform_Matrix));
	
}
init();

function render()
{
	const avoid_crashing=document.getElementById("avoid_crash").checked;
	if(avoid_crashing)
	{
		//For some reason i have to perform some vector operation, otherwise sphere_3d() crash after >20 calls
		let hat = vec4(2.0, 1.0, 3.0, 1.0); 
		hat = vec3(hat[0], hat[1], hat[2]);
		let hat2 = vec3(0.0, 1.0, 0.0);
		let hat3 = vec3(0.22, 0.1, 0.0);
		let crap  = lookAt(hat, hat2, hat3);
	}
	let num_divisions = document.getElementById('subdivision_slider').value;
	sphere = sphere_3d(num_divisions);
	console.log("create cube of "+num_divisions+ " divisions" );
	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	{// draw coordinat system
		trsMatrix = mat4();
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		send_array_to_attribute_buffer("vPosition", coordinateSys.points, 3, gl, program);
		send_array_to_attribute_buffer("vColor", coordinateSys.colors, 4, gl, program);
		gl.drawArrays(coordinateSys.drawtype, 0, coordinateSys.drawCount);
	}

	{//The sphere
		trsMatrix = mat4();//rotateX(Math.random() * 45);
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		send_array_to_attribute_buffer("vPosition", sphere.Points, 4, gl, program);
		send_array_to_attribute_buffer("vColor", sphere.Colors, 4, gl, program);
		gl.drawArrays(gl.TRIANGLES, 0, sphere.drawCount);
	}

//	requestAnimationFrame(render); //we only have to do this for each change of the slider
}