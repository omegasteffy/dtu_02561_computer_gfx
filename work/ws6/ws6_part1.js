
/**
 * Create 
 * @param {any} w
 * @param {any} h
 */
function quad(gl) {
	var x = { "type": "quad" };
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
var quadSpec;
var gl;
var program;
var uniforms;

function setup_stuff() {
	console.trace("Started");
	var canvas = document.getElementById('draw_area');

	gl = WebGLUtils.setupWebGL(canvas);

	 program = initShaders(gl, "vert1", "frag1");

	
	gl.useProgram(program);
	uniforms=cacheUniformLocations(gl, program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);


	 //The desired rectangle stretched in 
	 //	 - x axis - 4, 4, i.e. 8 long, zero offset
	//	 - y axis -1, -1, i.e. 0, -1 offset
	//	 - z axis -21, -1, i.e. 20 long, -10 offset

	

	let eyePos = vec3();
	
	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.0, 0.0, 0.0);// for isometric we should look at origo

	let cameraMatrix = lookAt(eyePos, cameraTarget, upVec);

	//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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


	var vertice_colors = new Float32Array(
		[1.0, 0.0, 0.0, 1.0, //Red
			0.0, 1.0, 0.0, 1.0, //Green
			0.0, 0.0, 1.0, 1.0, //Blue
			0.0, 1.0, 1.0, 1.0] //Blue
	);

	quadSpec = quad(gl);

	gl.clear(gl.COLOR_BUFFER_BIT);
	

	let coordinates = coordinateSystem(gl);
	send_array_to_attribute_buffer("a_Position", coordinates.points, 3, gl, program);
	send_array_to_attribute_buffer("a_Color", coordinates.colors, 4, gl, program);
	gl.drawArrays(coordinates.drawtype, 0, coordinates.drawCount);

	let texSize = 64;
	let numRows = 8;
	let numCols = 8;
	let index = 0;
	let image_checker = new Uint8Array(4 /*RGBA*/ * texSize * texSize);
	for (let i = 0; i < texSize; ++i ) // why not i++; ???
	{
		for (let j = 0; j < texSize; ++j)
		{
			const patchY = Math.floor(i / (texSize / numRows));
			const patchX = Math.floor(j / (texSize / numCols));
			const is_white = (patchX % 2 !== patchY % 2);
			const color_intensity = is_white ? 255 : 0;
			
			image_checker[index++] = color_intensity;
			image_checker[index++] = color_intensity;
			image_checker[index++] = color_intensity;
			image_checker[index++] = 255; //alpha value
		}
	}

	//let myTexel = new Image();
	//myTexel.src = "logo.gif"
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, myTexel);

	send_floats_to_attribute_buffer("a_Position", quadSpec.vertices, 3, gl, program);
	send_floats_to_attribute_buffer("a_Color", vertice_colors, 4, gl, program);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, quadSpec.drawCount);
	//requestAnimationFrame(render); 
}
var y_offset = 0.1;
setup_stuff();

function render()
{
	//var y_offest_Loc = gl.getUniformLocation(program, "y_offset");
	//gl.uniform1f(y_offest_Loc, y_offset);
	//y_offset += 0.1;
	
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(quadSpec.drawtype, 0, quadSpec.drawCount);
	requestAnimationFrame(render); 
}