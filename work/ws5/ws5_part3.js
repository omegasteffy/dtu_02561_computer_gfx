console.trace("Started");
let canvas = document.getElementById('draw_area');
var g_objLoader = null;
var g_drawingInfo = null;
var uniforms;


init_stuff();


function init_stuff() {
	canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);

	program = initShaders(gl, "vert1", "frag1");
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.useProgram(program);
	uniforms = cacheUniformLocations(gl,program);
	program.a_Position = uniforms.a_Position;
	program.a_Normal = uniforms.a_Normal;
	program.a_Position = uniforms.a_Position;
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	g_objLoader = new OBJLoadingHelper();
	g_objLoader.beginReadingObjFromUrl('../models/Shark.obj',1.0, true);

	console.trace("Finished Init");
	render();
}


function render() {

	if (!g_drawingInfo && g_objLoader.isFinishedLoading()) {
		// OBJ and all MTLs are available
		g_drawingInfo = g_objLoader.objectDoc.getDrawingInfo();
	}
	if (!g_drawingInfo) {
		//since we have not yet retrieved data we make sure the callback repeat it self
		window.requestAnimationFrame(render);
		return;
	}
	console.log("Rendering OBJ file.");
	let eyePos = vec4(10.0, 5.0, 2.90, 1.0); //We put camera in corner in order to make the isometric view
	//eyePos = mult(rotateY(time * 2), eyePos);
	eyePos = vec3(eyePos[0], eyePos[1], eyePos[2]);

	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.0, 0.0, 0.0);// for isometric we should look at origo

	let cameraMatrix = lookAt(eyePos, cameraTarget, upVec);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	let canvas = document.getElementById('draw_area');
	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 1.0;
	let far = 100.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

	trsMatrix = mat4(); // no transformations just yet
	gl.uniformMatrix4fv(uniforms.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(cameraMatrix));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	coordinateSys = coordinateSystem(gl);
	{
		send_floats_to_attribute_buffer("a_Position",flatten( coordinateSys.points ), 3, gl, program);
		send_floats_to_attribute_buffer("a_Color", flatten( coordinateSys.colors ), 4, gl, program);
		gl.drawArrays(coordinateSys.drawtype, 0, coordinateSys.drawCount);
	}

	send_floats_to_attribute_buffer("a_Position", g_drawingInfo.vertices, 3, gl, program);
	send_floats_to_attribute_buffer("a_Normal", g_drawingInfo.normals, 3, gl, program);
	send_floats_to_attribute_buffer("a_Color", g_drawingInfo.colors, 4, gl, program);

	// Create an empty buffer object to store Index buffer
	let index_buffer = gl.createBuffer();

	// Bind appropriate array buffer to it
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

	// Pass the vertex data to the buffer
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(g_drawingInfo.indices), gl.STATIC_DRAW);

	// Draw the triangle
	gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}
