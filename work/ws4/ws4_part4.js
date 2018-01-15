/**
 * Global variables
 */
let coordinateSys;
let gl;		  //the GL context
let program;  // the compiled GL-program
let moveCube; //matrix for positioning the cube
let sphere1;
let time = 0;


function setup_stuff()
{
	console.trace("Started");

	//general boiler plate stuff
	let canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);
	program = initShaders(gl, "vert", "frag");
	gl.useProgram(program);
	uniforms = cacheUniformLocations(gl, program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	
	coordinateSys = coordinateSystem(gl);
	
	
	render();

}
setup_stuff();

function render()
{
	let triangle_divisions = document.getElementById('subdivision_slider').value
	sphere1 = sphere_3d(triangle_divisions);
	time += 1;
	let eyePos = vec4(2.0, 3.0, 5.0, 1.0); //We put camera in corner in order to make the isometric view
	eyePos = mult(rotateY(time * 2), eyePos);
	eyePos = vec3(eyePos[0], eyePos[1], eyePos[2]);
	
	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.0, 0.0, 0.0);// for isometric we should look at origo

	cameraMatrix = lookAt(eyePos, cameraTarget, upVec);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	let canvas = document.getElementById('draw_area');
	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 1.0;
	let far = 100.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

	gl.uniformMatrix4fv(uniforms.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(cameraMatrix));

	let lightDirection = vec4(0, 0, -1, 0); //From +z toward -z
	let is_white_selected = document.getElementById("colorscheme_white").checked;
	let use_halfway_vector = document.getElementById("reflect_model_h").checked;
	if(use_halfway_vector)
	{
		gl.uniform1i(uniforms.use_halfway_vector, 1);
	}else{
		gl.uniform1i(uniforms.use_halfway_vector, 0);
	}
	gl.uniform4fv(uniforms.lightDirection, flatten(lightDirection));
	if (is_white_selected) {
		var diffuseColor = vec4(0.8, 0.8, 0.8, 1.0);
		var specularColor = vec4(0.8, 0.8, 0.8, 1.0);
	}
	else {
		var diffuseColor = vec4(0.1, 0.1, 0.8, 1.0);
		var specularColor = vec4(0.8, 0.1, 0.1, 1.0);
	}
	let ambientColor = vec4(0.25, 0.25, 0.25, 1.0); //always
	let shinyness = document.getElementById('shine_slider').value;
	
	
	
	let ambient_coef = document.getElementById("ambientlight_slider").value*.01;
	let specular_coef = document.getElementById("specularlight_slider").value * .01;
	let diffuse_coef =document.getElementById("diffuselight_slider").value * .01;

	gl.uniform4fv(uniforms.specularColor, flatten(specularColor));
	gl.uniform4fv(uniforms.diffuseColor, flatten(diffuseColor));
	gl.uniform4fv(uniforms.ambientColor, flatten(ambientColor));

	gl.uniform1f(uniforms.specular_coef, specular_coef);//;flatten(specular_coef /100));
	gl.uniform1f(uniforms.diffuse_coef, diffuse_coef);
	gl.uniform1f(uniforms.ambient_coef, ambient_coef );


	{// draw coordinat system
		trsMatrix = mat4();
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		send_array_to_attribute_buffer("a_Position", coordinateSys.points, 3, gl, program);
	//	send_array_to_attribute_buffer("vColor", coordinateSys.colors, 4, gl, program);
		gl.drawArrays(coordinateSys.drawtype, 0, coordinateSys.drawCount);
	}

	{//The sphere
		trsMatrix = mat4();
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		gl.uniform1f(uniforms.shinyness, shinyness);
		send_array_to_attribute_buffer("a_Position", sphere1.Points, 4, gl, program);
		send_array_to_attribute_buffer("a_Normal", sphere1.Normals, 4, gl, program);
		gl.drawArrays(gl.TRIANGLES, 0, sphere1.Points.length);
	}

	requestAnimationFrame(render); 
}