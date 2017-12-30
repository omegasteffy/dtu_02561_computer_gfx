//Globals
var rectSpec;
var gl;
var program_main;
let program_obj;
var uniforms_main;
var uniforms_obj;
let g_texture1;
let g_texture2;
let light_pos;
let time;
let g_camera_Matrix;
let g_camera_top_Matrix;
let camera_persMatrix;
let g_objLoader = null;
let g_drawingInfo = null;

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
//setup_stuff();

var image = document.createElement('img');
image.crossorigin = 'anonymous';
image.src = '../../code_and_data/xamp23.png';
image.onload = function () {
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
	var canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);

	program_main = initShaders(gl, "vert2", "frag2");
	program_obj = initShaders(gl, "vert_for_obj", "frag_for_obj");
	gl.useProgram(program_main);
	uniforms_main=cacheUniformLocations(gl, program_main);
	uniforms_obj=cacheUniformLocations(gl, program_obj);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	let eyePos = vec3(.1, .8, 4); // this is apparently what is meant by default
	
	let upVec = vec3(0.0, 10.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.0, 0.0, -10.0);// for isometric we should look at origo

	g_camera_Matrix = lookAt(eyePos, cameraTarget, upVec);
	
	let eyePos_top = vec3(0.0, 4.00 ,-3.0); // this is apparently what is meant by default
	cameraTarget = vec3(0.0001, -1.0, -3.0);
	upVec = vec3(0.0, 0.0, -1.0);
	g_camera_top_Matrix = lookAt(eyePos_top, cameraTarget, upVec);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 1.0;
	let far = 200.0;
	camera_persMatrix = perspective(FieldOfViewY, AspectRatio, near, far);

	gl.enable(gl.DEPTH_TEST);
	//I need to disable curl, otherwise the shadow will be absent when the projection flips it
	//gl.enable(gl.CULL_FACE); 

	trsMatrix = mat4();
	gl.uniformMatrix4fv(uniforms_main.proj_Matrix, false, flatten(camera_persMatrix));
	gl.uniformMatrix4fv(uniforms_main.camera_Matrix, false, flatten(g_camera_Matrix));
	gl.uniformMatrix4fv(uniforms_main.trsMatrix, false, flatten(trsMatrix));

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
	let should_teapot_move = document.getElementById("move_teapot").checked;
	let camera_above = document.getElementById("camera_above").checked;
	gl.useProgram(program_main);
	time++;
	const initial_light_pos = vec4(-2,2,2,1);
	const rot = rotateY(time);
	light_pos = mult(rotateY(time),initial_light_pos);
	light_pos= mult(translate(0,0,-2),light_pos)

	 gl.clear(gl.COLOR_BUFFER_BIT);

	 
	// model-view matrix for shadow then render
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
	trsMatrix = scalem(4, 1, 4);
	trsMatrix = mult(translate(-2, -1, -5), trsMatrix);
	gl.uniformMatrix4fv(uniforms_main.trsMatrix, false, flatten(trsMatrix));
	gl.depthFunc(gl.LESS);
	gl.bindTexture(gl.TEXTURE_2D, g_texture1); // make our new texture the current one
	gl.uniform1i(uniforms_main.is_a_shadow, false);
	gl.uniformMatrix4fv(uniforms_main.camera_Matrix, false, flatten(camera_view_matrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program_main);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);



	// -- quad-horzizontal --
	//must reach 
	// x = 0.25:0.75 , i.e. (0:1*.5) -0.25
	// y = -.5 fixed i.e. 0 -0.5
	// z = -1.75:-1.25, i.e (0:1*0.5) -1.75
	gl.bindTexture(gl.TEXTURE_2D, g_texture2); // make our new texture the current one
	trsMatrix = scalem(.5,1,.5);
	trsMatrix = mult(translate(.25, -.5, -1.75), trsMatrix);
	gl.uniformMatrix4fv(uniforms_main.trsMatrix, false, flatten(trsMatrix));
	//shadow
	gl.depthFunc(gl.GREATER); //only draw shadows if there already is something beneath
	gl.uniform1i(uniforms_main.is_a_shadow, true);
	gl.uniformMatrix4fv(uniforms_main.camera_Matrix, false, flatten(s_camera_Matrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program_main);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);
	//real rectangle
	gl.depthFunc(gl.LESS);
	gl.uniform1i(uniforms_main.is_a_shadow, false);
	gl.uniformMatrix4fv(uniforms_main.camera_Matrix, false, flatten(camera_view_matrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program_main);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);




	// -- quad-vertical -- 
	//must reach 
	// x = 0.25:0.75 , i.e. (0:1*.5) -0.25
	// y = -.5 fixed i.e. 0 -0.5
	// z = -1.75:-1.25, i.e (0:1*0.5) -1.75
	trsMatrix = mult(scalem(1.0,1.0,0.5),rotateZ(90));
	trsMatrix = mult(translate(-1.0, 0.0, -3.0), trsMatrix);
	gl.uniformMatrix4fv(uniforms_main.trsMatrix, false, flatten(trsMatrix));
	//shadow
	gl.depthFunc(gl.GREATER);
	gl.uniform1i(uniforms_main.is_a_shadow, true);
	gl.uniformMatrix4fv(uniforms_main.camera_Matrix, false, flatten(s_camera_Matrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program_main);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);
	//real rectangle	
	gl.depthFunc(gl.LESS);
	gl.uniform1i(uniforms_main.is_a_shadow, false);
	gl.uniformMatrix4fv(uniforms_main.camera_Matrix, false, flatten(camera_view_matrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program_main);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);
	


	// indicate the light source shadow
	// this is not specified in excercise but helps to understand what is going on
	gl.depthFunc(gl.LESS);
	gl.uniform1i(uniforms_main.is_a_shadow, false);
	trsMatrix = mat4()
	gl.uniformMatrix4fv(uniforms_main.camera_Matrix, false, flatten(camera_view_matrix));
	gl.uniformMatrix4fv(uniforms_main.trsMatrix, false, flatten(trsMatrix));
	send_floats_to_attribute_buffer("a_Position", flatten(light_pos), 3, gl, program_main);
	gl.drawArrays(gl.POINTS, 0, 1);

	gl.useProgram(program_obj);
	trsMatrix = mult(rotateY(-time),scalem(0.25,0.25,0.25));
	if(should_teapot_move)
	{
		trsMatrix = mult(translate(0.0,-0.75 + 0.25*Math.sin(.2*time),-3.0),trsMatrix);
	}else
	{
		trsMatrix = mult(translate(0.0,-1.00 ,-3.0),trsMatrix);
	}

	gl.uniformMatrix4fv(uniforms_obj.trsMatrix, false, flatten(trsMatrix));
	
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


	requestAnimationFrame(render);

}