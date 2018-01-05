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

function gen_reflection_matrix(  v_normal,pos)
{
	let normal_valid =  ( Array.isArray(pos) && pos.length == 3 );
	let pos_valid = ( Array.isArray(v_normal) && v_normal.length == 3 );
	if(!(normal_valid && pos_valid))
	{
		throw( "Invalid inputs");
	}
	let R = mat4();
	pos_dot_norm = dot(pos,v_normal);

	R[0][0] = 1 - 2*(v_normal[0]*v_normal[0]);
	R[1][0] = -2*(v_normal[0]*v_normal[1]);
	R[2][0] = -2*(v_normal[0]*v_normal[2]);
	R[3][0] = 0;
	R[0][1] = -2*(v_normal[1]*v_normal[0]);
	R[1][1] = 1-2*(v_normal[1]*v_normal[1]);
	R[2][1] = -2*(v_normal[1]*v_normal[2]);
	R[3][1] = 0;
	R[0][2] = -2*(v_normal[2]*v_normal[0]);
	R[1][2] = -2*(v_normal[2]*v_normal[1]);
	R[2][2] = 1-2*(v_normal[2]*v_normal[2]);
	R[3][2] = 0;
	R[0][2] = -2*(v_normal[2]*v_normal[0]);
	R[1][2] = -2*(v_normal[2]*v_normal[1]);
	R[2][2] = 1-2*(v_normal[2]*v_normal[2]);
	R[3][2] = 0;
	R[0][3] = 2*(pos_dot_norm*v_normal[0]);
	R[1][3] = 2*(pos_dot_norm*v_normal[1]);
	R[2][3] = 2*(pos_dot_norm*v_normal[2]);
	R[3][3] = 1;
	return R;
}
function modifyProjectionMatrix(clipplane, projection_matrix) //copied directly from worksheet
{
	if(!Array.isArray(clipplane))
	{
		throw ("bad argument, expect array");
	}
	if( 4 != clipplane.length )
	{
		throw ("bad argument, expect array of length 4");
	}
	if(projection_matrix.matrix !== true)
	{
		throw ("bad argument, expect matrix");
	}
	// MV.js has no copy-constructor for matrices'
	let oblique = mult(mat4(), projection_matrix);
	let q = vec4( 	
			(Math.sign(clipplane[0]) + projection_matrix[0][2])/projection_matrix[0][0],
			(Math.sign(clipplane[1]) + projection_matrix[1][2])/projection_matrix[1][1],
			-1.0,
			(1.0 + projection_matrix[2][2])/projection_matrix[2][3]
		);
		let  s = 2.0/dot(clipplane, q);
		oblique[2] = vec4(clipplane[0]*s, clipplane[1]*s, clipplane[2]*s + 1.0, clipplane[3]*s);    
	 return oblique;
} 


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
	gl = WebGLUtils.setupWebGL(canvas, { alpha: false, stencil: true });

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
	let eyePos = vec3(0.1, 0.1, 1); // this is apparently what is meant by default
	let upVec = vec3(0.0, 10.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.0, 0.0, -3.0);// for isometric we should look at origo
	g_camera_Matrix = lookAt(eyePos, cameraTarget, upVec);

	//Setup a from above camera view
	let eyePos_top = vec3(0.0, 7.50 ,-3.0); // this is apparently what is meant by default
	cameraTarget = vec3(0.0001, -1.0, -3.0);
	upVec = vec3(0.0, 0.0, -1.0);
	g_camera_top_Matrix = lookAt(eyePos_top, cameraTarget, upVec);


	//setup perspetive
	let FieldOfViewY = 65; //deg
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
	let view_light_depth = document.getElementById("view_light_depth").checked;
	let disable_teapot_shadowmapping = document.getElementById("disable_teapot_shadowmapping").checked;
	let show_ground =  document.getElementById("show_ground").checked;

	
	time++;
	const initial_light_pos = vec4(-2,2,2,1);
	const rot = rotateY( should_rotate_light ? time: 0);
	light_pos = mult( rot , initial_light_pos );
	light_pos= mult( translate(0,0,-2.00001) , light_pos ); //i have experienced some exceptions/crashes in MV, when calculating dot-product and length if i use -2.0
	//Uncaught normalize: vector -0.9688915258909286,2.956082375889767,2.9819414985431227 has zero length


	let reflection_matrix = gen_reflection_matrix(vec3(0, -1, 0), vec3(0,-1, -3));

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
		trsMatrix_teapot = mult(translate(0.0,-.9 + 0.9*Math.sin(.05*time),-3.0),trsMatrix_teapot);
	}else
	{
		trsMatrix_teapot = mult(translate(0.0,-1.00 ,-3.0),trsMatrix_teapot);
	}
		//--quad ground --
	//must reach 
	// x = -2:2 , i.e. (0:1*4) -2
	// y = -1 fixed i.e. 0 -1
	// z = -5:-1, i.e (0:1*4) -5
	let trsMatrix_ground = scalem(4, 1, 4);
	trsMatrix_ground = mult(translate(-2, -1, -5), trsMatrix_ground);
	
	//calculate the plane vec4 describtion for the modified clip-plane
	//We use vec4, to make to avoid extra indexing afterward
	let ground_pos = vec4(0,-1,-3,0); //This is in the middle of the plane
	let ground_normal = vec4(0,1,0,0); // The normal point upward

	//This is the text book explanation of how the coordinate+normal
	//
	//   a(x -x_0) + b(y - y_0) + c(z - z_0) + d =0
	//   0 *(x - -0 ) + 1(y - -1) + 0 (z - -3  )  + d = 0
	//   0x + 1y +1  + 0z +d =0
	//  0x + 1y  + 0z +1 =0
    // This is the same as [normal.xyz, -dot(point,normal) ]


	//Put these vectors into eye-space by multiplying with the camera transformation
	let ground_pos_transformed =  mult(g_camera_Matrix,ground_pos); 
	let ground_normal_transformed  = mult(g_camera_Matrix,ground_normal);
	let plane_eqn = ground_normal_transformed;
	plane_eqn[3] = dot(ground_pos_transformed,ground_normal_transformed);

    //since i did not get it to work i attempted to play a bit with the number... 4x scaling and no transformation was the closest i got to a good looking result
	//... i also tried several other things including adding projection transform to the plane vectors and several other attempts, but no luck
	let alternative_ground_pos = vec4(0,-4,-3,0);
	let plane_eqn_alternative = alternative_ground_pos;
	plane_eqn_alternative[3] = -dot(alternative_ground_pos,ground_normal);
	
	//change to 'plane_eqn_alternative' to test the other plane
	let proj_matrix_planeclip = modifyProjectionMatrix(plane_eqn,camera_persMatrix) ;

	// model-view matrix for projection-shadow... must be updated since the light move around
	let m = mat4();
	m[3][3] = 0;
	m[3][1] = -1 / (light_pos[1] -  (-1.001)); // a small offset from -1.0 to avoid z-fighting... we actually draw it a bit beneath the ground, but have toggled the z-depth test when we draw it
	let camera_view_matrix = camera_above   ? g_camera_top_Matrix :  g_camera_Matrix;

	//camera matrix
	let FieldOfViewY = 100; //deg ... width off how the lightsource view the scene, to narrow cause wierd edge effects
	let lightProjRatio = OFFSCREEN_WIDTH / OFFSCREEN_HEIGHT; // should be 1:1
	let near = 1.0;
	let far = 100.0;
	let light_perMatrix = perspective(FieldOfViewY, lightProjRatio, near, far);
	let upVec = vec3(0.0, 10.0, 0.0);//we just need the orientation... it will adjust itself
	let lightTarget = vec3(0.0, -1.0, -2.0);// The point it rotate around
	let light_pos3dim = vec3(light_pos[0], light_pos[1], light_pos[2]);
	let light_camera_matrix = lookAt(light_pos3dim, lightTarget, upVec);

	//calculate depthmap... must be updated for each frame to compensate for changed direction of light
	if (! view_light_depth)
	{
		 use_depthbuffer(); //in case we are viewing the depth map we should stick to the normal framebuffer and not switch to depthbuffer
	}
	//real object
	gl.useProgram(program_lightdepth);
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
	if( view_light_depth)
	{
		requestAnimationFrame(render);
		return; // do not perform the remaining rendering in case we are inspecting the light distance map
	}

	use_framebuffer();
	
	 
	//fill out the stencil buffer by drawing the ground and disabling output
	gl.enable(gl.STENCIL_TEST);
	gl.clear(gl.STENCIL_BUFFER_BIT); // Clear what ever might be in the stencil buffer
	gl.stencilFunc(gl.ALWAYS, 1, 0xFF); // Set any stencil to 1
	gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE); // a) action when stencil test fails, b) action when the stencil test passes, depth fails. c) both depth and stencil pass
	gl.stencilMask(0xFF); // Write to stencil buffer FF equals allowing all bits to pass
	gl.depthMask(false); // Don't write to depth buffer
	gl.useProgram(program_lightdepth); //this program seems suitable since it is simple (we should not created more buffers)
	gl.uniformMatrix4fv(uniforms_ligthdepth.trsMatrix, false, flatten(trsMatrix_ground));
	gl.uniformMatrix4fv(uniforms_ligthdepth.proj_Matrix, false, flatten(camera_persMatrix));
	gl.uniformMatrix4fv(uniforms_ligthdepth.camera_Matrix, false, flatten(camera_view_matrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program_ground);
	gl.colorMask(false,false,false, false); //Avoid drawing .. just fill the stencil buffer
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);
	gl.colorMask(true,true,true,true); // after we have filled the stencil buffer we can enable drawing again
	gl.depthMask(true); //re-enable depth test

	//reflection drawing using the object program and apply the reflection matrix
	//We draw this first because the reflection is simulated by making the ground transparent
	gl.useProgram(program_obj);
	gl.stencilFunc(gl.EQUAL, 1, 0xFF); // this time we draw if a 1 is found in the stencil buffer (this would mean it was set in previous call)
	gl.stencilMask(0x00); //do not update the stencil buffer
	
	//apply all the uniforms and etc.
	gl.uniform4fv(uniforms_obj.lightPos, flatten(light_pos));
	gl.uniformMatrix4fv(uniforms_obj.trsMatrix, false, flatten(trsMatrix_teapot));
	//gl.uniformMatrix4fv(uniforms_obj.proj_Matrix, false, flatten(camera_persMatrix) ));
	gl.uniformMatrix4fv(uniforms_obj.proj_Matrix, false, flatten( proj_matrix_planeclip ));
	gl.uniformMatrix4fv(uniforms_obj.lightProjMatrix, false, flatten(light_perMatrix));
	gl.uniformMatrix4fv(uniforms_obj.lightCamMatrix, false, flatten(light_camera_matrix));
	gl.uniform1i(uniforms_obj.shadow_map, 1);  // assign the shadow to TEXTURE1
	gl.activeTexture(gl.TEXTURE1); // Set a texture object to the texture unit
	gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

	gl.depthFunc(gl.LESS);
	gl.uniform1i(uniforms_obj.is_a_shadow, false);
	gl.uniform1i(uniforms_obj.disable_shadow_map, disable_teapot_shadowmapping);
	gl.uniformMatrix4fv(uniforms_obj.camera_Matrix, false, flatten(camera_view_matrix));
	gl.uniformMatrix4fv(uniforms_obj.reflection_matrix, false, flatten(reflection_matrix));
	send_floats_to_attribute_buffer("a_Position", g_drawingInfo.vertices, 3, gl, program_obj);
	send_floats_to_attribute_buffer("a_Normal", g_drawingInfo.normals, 3, gl, program_obj);
	send_floats_to_attribute_buffer("a_Color", g_drawingInfo.colors, 4, gl, program_obj);
	index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(g_drawingInfo.indices), gl.STATIC_DRAW);
	gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.deleteBuffer(index_buffer);	
	
	//Now we no longer need to perfom any stencil tests
	gl.disable(gl.STENCIL_TEST);

	//ground
	if(show_ground)
	{
		gl.useProgram(program_ground);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); //this works well with our reflection

		
		gl.enable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);
		gl.uniformMatrix4fv(uniforms_ground.trsMatrix, false, flatten(trsMatrix_ground));
		gl.uniformMatrix4fv(uniforms_ground.lightProjMatrix, false, flatten(light_perMatrix));
		gl.uniformMatrix4fv(uniforms_ground.lightCamMatrix, false, flatten(light_camera_matrix));
		gl.depthFunc(gl.LESS);
		gl.uniform1i(uniforms_ground.shadow_map, 1);  // assign the shadow to TEXTURE1
		gl.activeTexture(gl.TEXTURE1); // Set a texture object to the texture unit
		gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

		gl.uniform1i(uniforms_ground.is_a_shadow, false);
		gl.uniformMatrix4fv(uniforms_ground.camera_Matrix, false, flatten(camera_view_matrix));
		send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program_ground);
		gl.drawArrays(rect.drawtype, 0, rect.drawCount);
		gl.disable(gl.BLEND);

	}
	
	// indicate the light source shadow
	// this is not specified in excercise but helps to understand what is going on
	gl.useProgram(program_ground);
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
	gl.uniformMatrix4fv(uniforms_obj.trsMatrix, false, flatten(trsMatrix_teapot));
	gl.uniformMatrix4fv(uniforms_obj.proj_Matrix, false, flatten(camera_persMatrix));
	gl.uniformMatrix4fv(uniforms_obj.lightProjMatrix, false, flatten(light_perMatrix));
	gl.uniformMatrix4fv(uniforms_obj.lightCamMatrix, false, flatten(light_camera_matrix));
	gl.uniform1i(uniforms_obj.shadow_map, 1);  // assign the shadow to TEXTURE1
	gl.activeTexture(gl.TEXTURE1); // Set a texture object to the texture unit
	gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

	//real object
	gl.depthFunc(gl.LESS);
	gl.uniform1i(uniforms_obj.is_a_shadow, false);
	gl.uniform1i(uniforms_obj.disable_shadow_map, disable_teapot_shadowmapping);
	gl.uniformMatrix4fv(uniforms_obj.camera_Matrix, false, flatten(camera_view_matrix));
	gl.uniformMatrix4fv(uniforms_obj.reflection_matrix, false, flatten(new mat4()));
	send_floats_to_attribute_buffer("a_Position", g_drawingInfo.vertices, 3, gl, program_obj);
	send_floats_to_attribute_buffer("a_Normal", g_drawingInfo.normals, 3, gl, program_obj);
	send_floats_to_attribute_buffer("a_Color", g_drawingInfo.colors, 4, gl, program_obj);
	index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(g_drawingInfo.indices), gl.STATIC_DRAW);
	gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.deleteBuffer(index_buffer);	


	requestAnimationFrame(render);

}
function use_depthbuffer()
{ 	
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);               // Change the drawing destination to FBO
	gl.clearColor(1.0, 1.0, 1.0, 1.0); //It looks better when starting from a close distance
	gl.viewport(0, 0, OFFSCREEN_HEIGHT, OFFSCREEN_HEIGHT); // Set view port for FBO
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   // Clear FBO    
}

function use_framebuffer()
{
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);               // Change the drawing destination to color buffer
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    // Clear color and depth buffer
}