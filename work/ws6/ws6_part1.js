//Globals
var rectSpec;
var gl;
var program;
var uniforms;


/**
 * Create coordinates for a rectangle
 */
function rectangle(gl) {
	var x = { "type": "rectangle" };
	x.drawtype = gl.TRIANGLE_STRIP;
	x.vertices = new Float32Array([
		-4, -1, -1,
		4, -1, -1,
		-4, -1, -21,
		4, -1, -21
		]);
	x.drawCount = 4;
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
setup_stuff();

function setup_stuff()
{
	console.trace("Started");	
	var canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);

	program = initShaders(gl, "vert1", "frag1");
	gl.useProgram(program);
	uniforms=cacheUniformLocations(gl, program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	let eyePos = vec3(); // this is apparently what is meant by default
	
	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.0, 0.0, 0.0);// for isometric we should look at origo

	let cameraMatrix = lookAt(eyePos, cameraTarget, upVec);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 1.0;
	let far = 200.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

	trsMatrix = mat4(); // no transformations just yet
	gl.uniformMatrix4fv(uniforms.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(cameraMatrix));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	//My layout of coordinates is not accordingly to the book... texture looked really odd before i rotate the points
	const texCoords = [
		vec2(-1.5, 0),   //vec2(0,0),
		vec2(2.5, 0),	//vec2(1,0),
		vec2(-1.5, 10), //vec2(0,1),
		vec2(2.5, 10) 	//vec2(1,1)
	];

	rectSpec = rectangle(gl);

	gl.clear(gl.COLOR_BUFFER_BIT);

	let image_checker = GenerateCheckBoard();
	let texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture); // make our new texture the current one
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 64, 64, 0, gl.RGBA, gl.UNSIGNED_BYTE,
		image_checker, 0);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

	//It seems that the defaut MIN/MAG-filter setting is to use NEAREST_MIPMAP_LINEAR
	//gl.generateMipmap(gl.TEXTURE_2D); //MipMap do not work if not enabled, ... and MipMap was default
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST_MIPMAP_LINEAR);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);

	
	send_floats_to_attribute_buffer("a_Position", rectSpec.vertices, 3, gl, program);
	send_floats_to_attribute_buffer("a_texCoordinate", flatten(texCoords), 2, gl, program);

	//Link to the default texture.... however it do not seem to be needed
	const textureLocation = gl.getUniformLocation(program, "tex");
	gl.uniform1i(textureLocation, 0);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectSpec.drawCount);
	//render(); // no need for since we only have a static image
}


function render()
{	
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(rectSpec.drawtype, 0, rectSpec.drawCount);
	requestAnimationFrame(render); 
}