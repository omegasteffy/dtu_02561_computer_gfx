console.trace("Started");
let canvas = document.getElementById('draw_area');
init_stuff();
var obj_stuff;
var g_objDoc; // The information of OBJ file
var g_drawingInfo; // The information for drawing 3D model
var model;
var uniforms;


const CommonColors = {
	"black": vec4(0.0, 0.0, 0.0, 1.0),
	"red": vec4(1.0, 0.0, 0.0, 1.0),
	"green": vec4(0.0, 1.0, 0.0, 1.0),
	"blue": vec4(0.0, 0.0, 1.0, 1.0),
	"yellow": vec4(1.0, 1.0, 0.0, 1.0),
	"pink": vec4(1.0, 0.0, 0.5, 1.0),
	"magenta": vec4(1.0, 0.0, 1.0, 1.0),
	"orange": vec4(1.0, 0.62, 1.0, 1.0),
	"lime": vec4(.84, 0.99, 0.0, 1.0),
	"brown": vec4(0.7, 0.25, .06, 1.0),
	"light_blue_clearing_color": vec4(0.3921, 0.5843, 0.9294, .10)
};
function send_array_to_buffer(buffername, input_data, data_dimension, gl, program) {
	let buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer); // make it the current buffer assigned in WebGL
	gl.bufferData(gl.ARRAY_BUFFER, flatten(input_data), gl.STATIC_DRAW);//link the JS-points and the 
	let attribLocation = gl.getAttribLocation(program, buffername); // setup a pointer to match the 
	gl.vertexAttribPointer(attribLocation, data_dimension, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attribLocation);
}

function send_floats_to_buffer(buffername, input_data, data_dimension, gl, program) {
	let buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer); // make it the current buffer assigned in WebGL
	gl.bufferData(gl.ARRAY_BUFFER, input_data, gl.STATIC_DRAW);//link the JS-points and the 
	let attribLocation = gl.getAttribLocation(program, buffername); // setup a pointer to match the 
	gl.vertexAttribPointer(attribLocation, data_dimension, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attribLocation);
}

function coordinateSystem(gl) {
	let x = {};
	x.points = []
	x.colors = []

	x.points = [vec3(0, 0, 0), vec3(100, 0, 0),
	vec3(0, 0, 0), vec3(0, 100, 0),
		vec3(0, 0, 0), vec3(0, 0, 100)
	];
	x.colors = [mix(CommonColors.black, CommonColors.red, 0.6), mix(CommonColors.black, CommonColors.red, 0.6),
	mix(CommonColors.black, CommonColors.green, 0.6), mix(CommonColors.black, CommonColors.green, 0.6),
	mix(CommonColors.black, CommonColors.blue, 0.6), mix(CommonColors.black, CommonColors.blue, 0.6)
	]

	x.drawtype = gl.LINES;
	x.drawCount = x.points.length;
	return x;
}

function cacheUniformLocations(gl, program) {
	const activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	const uniformLocations = {};
	for (let i = 0; i < activeUniforms; i++) {
		const info = gl.getActiveUniform(program, i);
		uniformLocations[info.name] = gl.getUniformLocation(program, info.name);
	}
	return uniformLocations;
}

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
//	gl.enable(gl.DEPTH_TEST);
	//gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

	//model = initVertexBuffers(gl, program);
	obj_stuff = beginReadObj('../models/shark.obj', gl, 1.0, true);
	

	//render();
	console.trace("Ended");
	render();
}

// Read a file
function beginReadObj(fileName, gl, scale, reverse)
{
	var request = new XMLHttpRequest();
	request.onreadystatechange = function ()
	{
		if (request.readyState === 4)
		{
			if (request.status === 404)
			{
				console.log("Unable to download " + request.responseURL)
			}
			else {
				onReadOBJFile(request.responseText, fileName, gl, scale, reverse);
			}
		}
	}

	request.open('GET', fileName, true); // Create a request to get file
	request.send(); // Send the request
}


// OBJ file has been read
function onReadOBJFile(fileString, fileName, gl, scale, reverse)
{
	var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
	var result = objDoc.parse(fileString, scale, reverse);
	if (!result)
	{
		g_objDoc = null; g_drawingInfo = null;
		console.log("OBJ file parsing error.");
		return;
	}
	g_objDoc = objDoc;
}

function render() {

	if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
		// OBJ and all MTLs are available
		g_drawingInfo = g_objDoc.getDrawingInfo();
	}
	if (!g_drawingInfo) {
		window.requestAnimationFrame(render);
		return;
	}

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

	trsMatrix = mat4();
	gl.uniformMatrix4fv(uniforms.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(cameraMatrix));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	coordinateSys = coordinateSystem(gl);
	{
		send_array_to_buffer("a_Position", coordinateSys.points, 3, gl, program);
		send_array_to_buffer("a_Color", coordinateSys.colors, 4, gl, program);
		gl.drawArrays(coordinateSys.drawtype, 0, coordinateSys.drawCount);
	}



	send_floats_to_buffer("a_Position", g_drawingInfo.vertices, 3, gl, program);
	send_floats_to_buffer("a_Normal", g_drawingInfo.normals, 3, gl, program);
	send_floats_to_buffer("a_Color", g_drawingInfo.colors, 4, gl, program);
	// Create an empty buffer object to store Index buffer
	let Index_Buffer = gl.createBuffer();

	// Bind appropriate array buffer to it
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);

	// Pass the vertex data to the buffer
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(g_drawingInfo.indices), gl.STATIC_DRAW);

	// Draw the triangle
	gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}
