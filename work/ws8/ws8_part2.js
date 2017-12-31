//Globals
let rectSpec;
let gl;
let program_ground;
let program_obj;
let program_lightdepth;
let uniforms_ground;
let uniforms_obj;
let uniforms_ligthdepth;
let g_texture1;
let g_texture2;
let light_pos;
let time;
let g_camera_Matrix;
let g_camera_top_Matrix;
let camera_persMatrix;
let g_objLoader = null;
let g_drawingInfo = null;
let fbo;
let canvas;



let OFFSCREEN_WIDTH = 2048, OFFSCREEN_HEIGHT = 2048; //these defines are needed for the FBO-init
function initFramebufferObject(gl) { //stolen from shadow.js in the examples folder
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

/**
 * Create coordinates for a rectangle
 */
function rectangle(gl) {
	let x = { "type": "rectangle" };
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

let image = document.createElement('img');
image.crossorigin = 'anonymous';
image.src = '../../code_and_data/xamp23.png';
image.onload = function ()
{
	// Insert WebGL texture initialization here
	g_objLoader = new OBJLoadingHelper();
	g_objLoader.beginReadingObjFromUrl('../models/teapot.obj', 1.0, true);
	setup_stuff();
}; 

function setup_stuff()
{
	if (!g_drawingInfo && g_objLoader.isFinishedLoading()) {
		// OBJ and all MTLs are available
		g_drawingInfo = g_objLoader.objectDoc.getDrawingInfo();
	}
	if (!g_drawingInfo) {
		//since we have not yet retrieved data we make sure the callback repeat it self
		window.requestAnimationFrame(setup_stuff);
		return;
	}
	console.trace("Setup started");	
	canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);

	program_ground = initShaders(gl, "vert_for_ground", "frag_for_ground");
	program_obj = initShaders(gl, "vert_for_obj", "frag_for_obj");
	program_lightdepth = initShaders(gl, "vert_for_lightdepth", "frag_for_lightdepth");
	fbo = initFramebufferObject(gl);

	uniforms_ground = cacheUniformLocations(gl, program_ground);
	uniforms_obj = cacheUniformLocations(gl, program_obj);
	uniforms_ligthdepth = cacheUniformLocations(gl, program_lightdepth);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	//setup the default camera view
	let eyePos = vec3(.1, .8, 4); // this is apparently what is meant by default
	let upVec = vec3(0.0, 10.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.0, 0.0, -10.0);// for isometric we should look at origo
	g_camera_Matrix = lookAt(eyePos, cameraTarget, upVec);

	//Setup a from above camera view
	let eyePos_top = vec3(0.0, 7.50 ,-3.0); // this is apparently what is meant by default
	cameraTarget = vec3(0.0001, -1.0, -3.0);
	upVec = vec3(0.0, 0.0, -1.0);
	g_camera_top_Matrix = lookAt(eyePos_top, cameraTarget, upVec);


	//setup perspetive
	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 1.0;
	let far = 200.0;
	camera_persMatrix = perspective(FieldOfViewY, AspectRatio, near, far);

	gl.enable(gl.DEPTH_TEST);
	//I need to disable curl, otherwise the shadow will be absent when the projection flips it
	// and for the tea-pot the wierd hole at the cover will appear
	//gl.enable(gl.CULL_FACE); 

	rect = rectangle(gl);


	gl.useProgram(program_ground);
	gl.uniformMatrix4fv(uniforms_ground.proj_Matrix, false, flatten(camera_persMatrix));
	g_texture1 = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, g_texture1); // make our new texture the current one
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

   time=0.0;
   render();
}
function render()
{
	let should_teapot_move = document.getElementById("move_teapot").checked;
	let camera_above = document.getElementById("camera_above").checked;
	let should_rotate_teapot = document.getElementById("rotate_teapot").checked;
	let should_rotate_light = document.getElementById("rotate_light").checked;
	use_framebuffer();
	gl.useProgram(program_ground);
	
	time++;
	const initial_light_pos = vec4(-2,2,2,1);
	const rot = rotateY( should_rotate_light ? time: 0);
	light_pos = mult( rot , initial_light_pos );
	light_pos= mult( translate(0,0,-2.00001) , light_pos ); //i have experienced some exceptions/crashes in MV, when calculating dot-product and length if i use -2.0
	//Uncaught normalize: vector -0.9688915258909286,2.956082375889767,2.9819414985431227 has zero length


	// model-view matrix for projection-shadow... must be updated since the light move around
	let m = mat4();
	m[3][3] = 0;
	m[3][1] = -1 / (light_pos[1] -  (-1.001)); // a small offset from -1.0 to avoid z-fighting... we actually draw it a bit beneath the ground, but have toggled the z-depth test when we draw it
	let camera_view_matrix = camera_above   ? g_camera_top_Matrix :  g_camera_Matrix;
	let s_camera_Matrix = mult(camera_view_matrix, translate(light_pos[0], light_pos[1], light_pos[2]));
	s_camera_Matrix = mult(s_camera_Matrix, m);
	s_camera_Matrix = mult(s_camera_Matrix, translate(-light_pos[0], -light_pos[1], -light_pos[2]));

	gl.enable(gl.DEPTH_TEST);
	//--quad ground --
	//must reach 
	// x = -2:2 , i.e. (0:1*4) -2
	// y = -1 fixed i.e. 0 -1
	// z = -5:-1, i.e (0:1*4) -5
	let trsMatrix_ground = scalem(4, 1, 4);
	trsMatrix_ground = mult(translate(-2, -1, -5), trsMatrix_ground);
	gl.uniformMatrix4fv(uniforms_ground.trsMatrix, false, flatten(trsMatrix_ground));
	gl.depthFunc(gl.LESS);
	gl.bindTexture(gl.TEXTURE_2D, g_texture1); // make our new texture the current one
	gl.uniform1i(uniforms_ground.is_a_shadow, false);
	gl.uniformMatrix4fv(uniforms_ground.camera_Matrix, false, flatten(camera_view_matrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program_ground);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);


	// indicate the light source shadow
	// this is not specified in excercise but helps to understand what is going on
	gl.depthFunc(gl.LESS);
	gl.uniform1i(uniforms_ground.is_a_shadow, false);
	trsMatrix = mat4()
	gl.uniformMatrix4fv(uniforms_ground.camera_Matrix, false, flatten(camera_view_matrix));
	gl.uniformMatrix4fv(uniforms_ground.trsMatrix, false, flatten(trsMatrix));
	send_floats_to_attribute_buffer("a_Position", flatten(light_pos), 3, gl, program_ground);
	gl.drawArrays(gl.POINTS, 0, 1);

	//start drawing teapot
	gl.useProgram(program_obj);
	gl.uniform4fv(uniforms_obj.lightPos, flatten(light_pos));
	let trsMatrix_teapot = mat4();
	if (should_rotate_teapot)
	{
		trsMatrix_teapot = mult(rotateY(-time),scalem(0.25,0.25,0.25));
	}else
	{
		trsMatrix_teapot = scalem(0.25,0.25,0.25);
	}

	if(should_teapot_move)
	{
		trsMatrix_teapot = mult(translate(0.0,-0.75 + 0.25*Math.sin(.2*time),-3.0),trsMatrix_teapot);
	}else
	{
		trsMatrix_teapot = mult(translate(0.0,-1.00 ,-3.0),trsMatrix_teapot);
	}

	gl.uniformMatrix4fv(uniforms_obj.trsMatrix, false, flatten(trsMatrix_teapot));
	
	//shadow
	gl.depthFunc(gl.GREATER);
	gl.uniform1i(uniforms_obj.is_a_shadow, true);
	gl.uniformMatrix4fv(uniforms_obj.proj_Matrix, false, flatten(camera_persMatrix));
	gl.uniformMatrix4fv(uniforms_obj.camera_Matrix, false, flatten(s_camera_Matrix));
	send_floats_to_attribute_buffer("a_Position", g_drawingInfo.vertices, 3, gl, program_obj);
	send_floats_to_attribute_buffer("a_Normal", g_drawingInfo.normals, 3, gl, program_obj);
	send_floats_to_attribute_buffer("a_Color", g_drawingInfo.colors, 4, gl, program_obj);
	let index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(g_drawingInfo.indices), gl.STATIC_DRAW);
	gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

	//real object
	gl.depthFunc(gl.LESS);
	gl.uniform1i(uniforms_obj.is_a_shadow, false);
	gl.uniformMatrix4fv(uniforms_obj.camera_Matrix, false, flatten(camera_view_matrix));
	send_floats_to_attribute_buffer("a_Position", g_drawingInfo.vertices, 3, gl, program_obj);
	send_floats_to_attribute_buffer("a_Normal", g_drawingInfo.normals, 3, gl, program_obj);
	send_floats_to_attribute_buffer("a_Color", g_drawingInfo.colors, 4, gl, program_obj);
	index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(g_drawingInfo.indices), gl.STATIC_DRAW);
	gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.deleteBuffer(index_buffer);
	gl.useProgram(program_lightdepth);
	
	//calculate depthmap... must be updated for each frame to compensate for changed direction of light
	use_depthbuffer();

	
	let FieldOfViewY = 70; //deg
	let lightProjRatio = OFFSCREEN_WIDTH / OFFSCREEN_HEIGHT; // should be 1:1
	let near = 1.0;
	let far = 100.0;
	let light_perMatrix = perspective(FieldOfViewY, lightProjRatio, near, far);
	let upVec = vec3(0.0, 10.0, 0.0);//we just need the orientation... it will adjust itself
	let lightTarget = vec3(0.0, -1.0, -2.0);// The point it rotate around
	let light_pos3dim = vec3(light_pos[0], light_pos[1], light_pos[2]);
	let light_camera_matrix = lookAt(light_pos3dim, lightTarget, upVec);
	
	//real object
	gl.depthFunc(gl.LESS);
	gl.uniformMatrix4fv(uniforms_ligthdepth.camera_Matrix, false, flatten(light_camera_matrix));
	gl.uniformMatrix4fv(uniforms_ligthdepth.proj_Matrix, false, flatten(light_perMatrix));
	gl.uniformMatrix4fv(uniforms_ligthdepth.trsMatrix, false, flatten(trsMatrix_teapot));
	send_floats_to_attribute_buffer("a_Position", g_drawingInfo.vertices, 3, gl, program_lightdepth);	
	index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(g_drawingInfo.indices), gl.STATIC_DRAW);
	gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.deleteBuffer(index_buffer);

	gl.uniformMatrix4fv(uniforms_ligthdepth.trsMatrix, false, flatten(trsMatrix_ground));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program_lightdepth);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);
	

	requestAnimationFrame(render);

}
function use_depthbuffer()
{ 	
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);               // Change the drawing destination to FBO
	gl.viewport(0, 0, OFFSCREEN_HEIGHT, OFFSCREEN_HEIGHT); // Set view port for FBO
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   // Clear FBO    
}

function use_framebuffer()
{
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);               // Change the drawing destination to color buffer
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    // Clear color and depth buffer
}