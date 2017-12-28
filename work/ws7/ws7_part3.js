//Globals
var rectSpec;
var gl;
var program;
var uniforms;
var uniforms_shadow;
let g_texture1;
let g_texture2;
let light_pos;
let time;
let g_camera_Matrix;
let g_fbo;
let programShadow;
let OFFSCREEN_WIDTH = 2048, OFFSCREEN_HEIGHT = 2048;

/**
 * Create coordinates for a rectangle
 */
function rectangle(gl) {
	var x = { "type": "rectangle" };
	x.drawtype = gl.TRIANGLE_STRIP;
	x.vertices = new Float32Array([
		0, 0, 1,
		1, 0, 1,
		0, 0, 0,
		1, 0, 0
		]);
	x.drawCount = 4;
	return x;
}

/**
 * draw x,y,z direction
 */
function coordinateSystem(gl)
{
	let x = {};
	x.points = []
	x.colors = []

	x.points = [vec3(0, 0, 0), vec3(100, 0, 0),
		vec3(0, 0, 0), vec3( 0, 100, 0),
		vec3(0, 0, 0),vec3(0,0,100)
	]
	x.colors = [mix(CommonColors.black, CommonColors.red, 0.6), mix(CommonColors.black, CommonColors.red, 0.6),
		mix(CommonColors.black, CommonColors.green, 0.6), mix(CommonColors.black, CommonColors.green, 0.6),
		mix(CommonColors.black, CommonColors.blue, 0.6),mix(CommonColors.black, CommonColors.blue, 0.6)
	]

	x.drawtype = gl.LINES;
	x.drawCount = x.points.length;
	return x;
}

var image = document.createElement('img');
image.crossorigin = 'anonymous';
image.src = '../../code_and_data/xamp23.png';
image.onload = function () {    // Insert WebGL texture initialization here 
setup_stuff();
}; 

function initFramebufferObject(gl) { //stolen from shadow.js 
	var framebuffer, texture, depthBuffer;

	// Define the error handling function
	var error = function () {
		if (framebuffer) gl.deleteFramebuffer(framebuffer);
		if (texture) gl.deleteTexture(texture);
		if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
		return null;
	}

	// Create a framebuffer object (FBO)
	framebuffer = gl.createFramebuffer();
	if (!framebuffer) {
		console.log('Failed to create frame buffer object');
		return error();
	}

	// Create a texture object and set its size and parameters
	texture = gl.createTexture(); // Create a texture object
	if (!texture) {
		console.log('Failed to create texture object');
		return error();
	}
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	// Create a renderbuffer object and Set its size and parameters
	depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
	if (!depthBuffer) {
		console.log('Failed to create renderbuffer object');
		return error();
	}
	gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

	// Attach the texture and the renderbuffer object to the FBO
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

	// Check if FBO is configured correctly
	var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
	if (gl.FRAMEBUFFER_COMPLETE !== e) {
		console.log('Frame buffer object is incomplete: ' + e.toString());
		return error();
	}

	framebuffer.texture = texture; // keep the required object

	// Unbind the buffer object
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	return framebuffer;
}


function setup_stuff()
{
	console.trace("Started");	
	var canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);
	programShadow = initShaders(gl, "vert_shadow", "frag_shadow");
	gl.useProgram(programShadow);
	uniforms_shadow = cacheUniformLocations(gl, programShadow);

	//setup a frameBuffer object using some stolen code from the interactice WebGl tutorial
	g_fbo = initFramebufferObject(gl);
	if (!g_fbo) {
		console.log('Failed to initialize frame buffer object');
		return;
	}
	
	//gl.activeTexture(gl.TEXTURE0); // Set a texture object to the texture unit
	//gl.bindTexture(gl.TEXTURE_2D, g_fbo.texture);

	//gl.bindFramebuffer(gl.FRAMEBUFFER, g_fbo);               // Change the drawing destination to FBO
	//gl.viewport(0, 0, OFFSCREEN_HEIGHT, OFFSCREEN_HEIGHT); // Set view port for FBO
	//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   // Clear FBO    
	//gl.useProgram(programShadow); // Set shaders for generating a shadow map

	//// Set the clear color and enable the depth test
	//gl.clearColor(0, 0, 0, 1);
	//gl.enable(gl.DEPTH_TEST);

	////Set back the normal view port for normal rendering
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);               // Change the drawing destination to color buffer
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    // Clear color and depth buffer

	program = initShaders(gl, "vert2", "frag2");
	gl.useProgram(program);
	uniforms = cacheUniformLocations(gl, program);

	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	let eyePos = vec3(.1, .8, 4); // this is apparently what is meant by default
	
	let upVec = vec3(0.0, 10.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.0, 0.0, -10.0);// for isometric we should look at origo

	g_camera_Matrix = lookAt(eyePos, cameraTarget, upVec);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 1.0;
	let far = 200.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);


	gl.enable(gl.DEPTH_TEST);
	//I need to disable curl, otherwise the shadow will be absent when the projection flips it
	//gl.enable(gl.CULL_FACE); 

	trsMatrix = mat4();
	gl.uniformMatrix4fv(uniforms.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(g_camera_Matrix));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	//My layout of coordinates is not accordingly to the book... texture looked really odd before i rotate the points
	const texCoords = [
		vec2(-1.5, 0),   //vec2(0,0),
		vec2(2.5, 0),	//vec2(1,0),
		vec2(-1.5, 10), //vec2(0,1),
		vec2(2.5, 10) 	//vec2(1,1)
	];

	rect = rectangle(gl);
	rect.colors=[]
	for( let k=0; k< rect.vertices.length/3; k++ )
	{
		rect.colors[k] = CommonColors.orange;
	}	

	gl.clear(gl.COLOR_BUFFER_BIT);

	
	 g_texture1 = gl.createTexture();
	 gl.bindTexture(gl.TEXTURE_2D, g_texture1); // make our new texture the current one
	 //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 64, 64, 0, gl.RGBA, gl.UNSIGNED_BYTE,	image_checker, 0);
	 gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
	 gl.generateMipmap(gl.TEXTURE_2D);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	g_texture2 = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, g_texture2); // make our new texture the current one
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1,1, 0, gl.RGBA, gl.UNSIGNED_BYTE,	new Uint8Array([255,0,0,255]), 0);
	gl.generateMipmap(gl.TEXTURE_2D);	

   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   time=0.0;
   render();
}
function render()
{
	time++;
	const initial_light_pos = vec4(-2,2,2,1);
	const rot = rotateY(time);
	light_pos = mult(rotateY(time),initial_light_pos);
	light_pos = mult(translate(0, 0, -2), light_pos)


	//re calculate light for each frame
	let FieldOfViewY = 70; //deg
	let lightProjRatio = OFFSCREEN_WIDTH / OFFSCREEN_HEIGHT; // should be 1:1
	let near = 1.0;
	let far = 100.0;
	let light_perMatrix = perspective(FieldOfViewY, lightProjRatio, near, far);
	let upVec = vec3(0.0, 10.0, 0.0);//we just need the orientation... it will adjust itself
	let lightTarget = vec3(0.0, -1.0, -2.0);// The point it rotate around
	let light_pos3dim = vec3(light_pos[0], light_pos[1], light_pos[2]);
	let light_camera_matrix = lookAt(light_pos3dim, lightTarget, upVec);

	gl.useProgram(programShadow);
	gl.clear(gl.COLOR_BUFFER_BIT);
	//g_camera_Matrix = light_camera_matrix;
	gl.uniformMatrix4fv(uniforms_shadow.proj_Matrix, false, flatten(light_perMatrix));
	gl.uniformMatrix4fv(uniforms_shadow.camera_Matrix, false, flatten(light_camera_matrix));

	trsMatrix = mat4();
	trsMatrix = scalem(4, 1, 4);
	trsMatrix = mult(translate(-2, -1, -5), trsMatrix);


	gl.uniformMatrix4fv(uniforms_shadow.trsMatrix, false, flatten(trsMatrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, programShadow);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);
	requestAnimationFrame(render);
	return;

	 gl.uniform1i(uniforms.is_a_shadow, false);
	 gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(g_camera_Matrix));
	 
	// model-view matrix for shadow then render
	let m = mat4();
	m[3][3] = 0;
	m[3][1] = -1 / (light_pos[1] -  (-0.9999));

	let s_camera_Matrix = mult(g_camera_Matrix, translate(light_pos[0], light_pos[1], light_pos[2]));
	s_camera_Matrix = mult(s_camera_Matrix, m);
	s_camera_Matrix = mult(s_camera_Matrix, translate(-light_pos[0], -light_pos[1], -light_pos[2]));

	//--quad ground --
	//must reach 
	// x = -2:2 , i.e. (0:1*4) -2
	// y = -1 fixed i.e. 0 -1
	// z = -5:-1, i.e (0:1*4) -5
	gl.bindTexture(gl.TEXTURE_2D, g_texture1); // make our new texture the current one
	gl.uniform1i(uniforms.is_a_shadow, false);
	trsMatrix = scalem(4, 1, 4);
	trsMatrix = mult(translate(-2, -1, -5), trsMatrix);
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);



	// -- quad-horzizontal --
	//must reach 
	// x = 0.25:0.75 , i.e. (0:1*.5) -0.25
	// y = -.5 fixed i.e. 0 -0.5
	// z = -1.75:-1.25, i.e (0:1*0.5) -1.75
	gl.bindTexture(gl.TEXTURE_2D, g_texture2); // make our new texture the current one
	trsMatrix = scalem(.5,1,.5);
	trsMatrix = mult(translate(.25, -.5, -1.75), trsMatrix);
	//real rectangle
	gl.uniform1i(uniforms.is_a_shadow, false);
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);
	//shadow
	gl.uniform1i(uniforms.is_a_shadow, true);
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(s_camera_Matrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);

	// -- quad-vertical -- 
	//must reach 
	// x = 0.25:0.75 , i.e. (0:1*.5) -0.25
	// y = -.5 fixed i.e. 0 -0.5
	// z = -1.75:-1.25, i.e (0:1*0.5) -1.75
	trsMatrix = mult(scalem(1.0,1.0,0.5),rotateZ(90));
	trsMatrix = mult(translate(-1.0, 0.0, -3.0), trsMatrix);
	//real rectangle
	gl.uniform1i(uniforms.is_a_shadow, false);
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(g_camera_Matrix));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);
	//shadow
	gl.uniform1i(uniforms.is_a_shadow, true);
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(s_camera_Matrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);

	// indicate the light source shadow
	// this is not specified in excercise but helps to understand what is going on
	gl.uniform1i(uniforms.is_a_shadow, true);
	trsMatrix = mat4()
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(g_camera_Matrix));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
	send_floats_to_attribute_buffer("a_Position", flatten(light_pos), 3, gl, program);
	gl.drawArrays(gl.POINTS, 0, 1);

	requestAnimationFrame(render);

}