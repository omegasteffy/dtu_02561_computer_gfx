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


function GenerateCheckBoard()
{
	let texSize = 64;
	let numRows = 8;
	let numCols = 8;
	let index = 0;

	let image_checker = new Uint8Array(4 /*RGBA*/ * texSize * texSize);
	for (let i = 0; i < texSize; i++) // why not i++; ???
	{
		for (let j = 0; j < texSize; j++) {
			const patchY = Math.floor(i / (texSize / numRows));
			const patchX = Math.floor(j / (texSize / numCols));
			const is_white = (patchX % 2 !== patchY % 2);
			const color_intensity = is_white ? 255 : 0;

			//Simpler way of indexing
			image_checker[index++] = color_intensity;
			image_checker[index++] = color_intensity;
			image_checker[index++] = color_intensity;
			image_checker[index++] = 255; //alpha value

			// //book version of indexing the checkerboard
			//const indexBase =4*i *texSize+4*j;
			//image_checker[indexBase] = color_intensity;
			//image_checker[indexBase+1] = color_intensity;
			//image_checker[indexBase+2] = color_intensity;
			//image_checker[indexBase+3] = 255; //alpha value
		}
	}
	return image_checker;
}
//setup_stuff();

var image = document.createElement('img');
image.crossorigin = 'anonymous';
image.src = '../../code_and_data/xamp23.png';
image.onload = function () {    // Insert WebGL texture initialization here 
setup_stuff();
}; 

function setup_stuff()
{
	console.trace("Started");	
	var canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);

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

	
	 let image_checker = GenerateCheckBoard();
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