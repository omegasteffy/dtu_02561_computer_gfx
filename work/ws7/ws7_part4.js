//Globals
var rectSpec;
var gl;
var program;
var uniforms;
let g_texture1;
let g_texture2;
let light_pos;
let time;
let g_camera_Matrix;


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


var image = document.createElement('img');
image.crossorigin = 'anonymous';
image.src = '../../code_and_data/xamp23.png';
image.onload = function () {
	// start the actual code once loaded
	setup_stuff();
}; 

function setup_stuff()
{
	console.trace("Started");	
	var canvas = document.getElementById('draw_area');

	//gl = WebGLUtils.setupWebGL(canvas);
	gl = WebGLUtils.setupWebGL(canvas, { alpha: true });

	program = initShaders(gl, "vert2", "frag2");
	gl.useProgram(program);
	uniforms=cacheUniformLocations(gl, program);
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
	light_pos= mult(translate(0,0,-2),light_pos)

	 gl.clear(gl.COLOR_BUFFER_BIT);

	 
	// model-view matrix for shadow then render
	let m = mat4();
	m[3][3] = 0;
	m[3][1] = -1 / (light_pos[1] -  (-1.001)); // a small offset from -1.0 to avoid z-fighting... we actually draw it a bit beneath the ground, but have toggled the z-depth test when we draw it

	let s_camera_Matrix = mult(g_camera_Matrix, translate(light_pos[0], light_pos[1], light_pos[2]));
	s_camera_Matrix = mult(s_camera_Matrix, m);
	s_camera_Matrix = mult(s_camera_Matrix, translate(-light_pos[0], -light_pos[1], -light_pos[2]));

	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); //https://stackoverflow.com/a/4578208/2986991
	gl.enable(gl.BLEND); // i considered toggling it on/off but there is no need for. The opaque-surfaces will covere anyway
	gl.enable(gl.DEPTH_TEST); //needed to determine if there is something the shadow can project onto
	//--quad ground --
	//must reach 
	// x = -2:2 , i.e. (0:1*4) -2
	// y = -1 fixed i.e. 0 -1
	// z = -5:-1, i.e (0:1*4) -5
	trsMatrix = scalem(4, 1, 4);
	trsMatrix = mult(translate(-2, -1, -5), trsMatrix);
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));

	gl.depthFunc(gl.LESS);
	gl.bindTexture(gl.TEXTURE_2D, g_texture1); // make the loaded texture the current one
	gl.uniform1i(uniforms.is_a_shadow, false);
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(g_camera_Matrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);



	// -- quad-horzizontal --
	//must reach 
	// x = 0.25:0.75 , i.e. (0:1*.5) -0.25
	// y = -.5 fixed i.e. 0 -0.5
	// z = -1.75:-1.25, i.e (0:1*0.5) -1.75
	trsMatrix = scalem(.5,1,.5);
	trsMatrix = mult(translate(.25, -.5, -1.75), trsMatrix);
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
	gl.bindTexture(gl.TEXTURE_2D, g_texture2); // make the simple color the current one
	//shadow
	gl.depthFunc(gl.GREATER); //only draw shadows if there already is something beneath
	gl.uniform1i(uniforms.is_a_shadow, true);
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(s_camera_Matrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);
	//real rectangle
	gl.depthFunc(gl.LESS);
	gl.uniform1i(uniforms.is_a_shadow, false);
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(g_camera_Matrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);



	// -- quad-vertical -- 
	//must reach 
	// x = 0.25:0.75 , i.e. (0:1*.5) -0.25
	// y = -.5 fixed i.e. 0 -0.5
	// z = -1.75:-1.25, i.e (0:1*0.5) -1.75
	trsMatrix = mult(scalem(1.0,1.0,0.5),rotateZ(90));
	trsMatrix = mult(translate(-1.0, 0.0, -3.0), trsMatrix);
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
	gl.bindTexture(gl.TEXTURE_2D, g_texture2); // make the simple color the current one
	//shadow
	gl.depthFunc(gl.GREATER);
	gl.uniform1i(uniforms.is_a_shadow, true);
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(s_camera_Matrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);
	//real rectangle	
	gl.depthFunc(gl.LESS);
	gl.uniform1i(uniforms.is_a_shadow, false);
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(g_camera_Matrix));
	send_floats_to_attribute_buffer("a_Position", rect.vertices, 3, gl, program);
	gl.drawArrays(rect.drawtype, 0, rect.drawCount);

	// indicate the light source shadow
	// this is not specified in excercise but helps to understand what is going on
	gl.uniform1i(uniforms.is_a_shadow, false);
	trsMatrix = mat4()
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(g_camera_Matrix));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
	send_floats_to_attribute_buffer("a_Position", flatten(light_pos), 3, gl, program);
	gl.drawArrays(gl.POINTS, 0, 1);

	requestAnimationFrame(render);

}