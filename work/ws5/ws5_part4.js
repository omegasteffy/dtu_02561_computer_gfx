console.trace("Started");
let canvas = document.getElementById('draw_area');
var obj_stuff;
var g_objDoc; // The information of OBJ file
var g_drawingInfo; // The information for drawing 3D model
var uniforms;
var time;//... well sort of time ... monotonic thing
init_stuff();

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

	obj_stuff = beginReadObj('../models/shark.obj', gl, 1.0, true);
	time = 0.0;
	console.trace("Finished Init");
	render();
}

function sphere(subDivision) {
	function tetrahedron(a, b, c, d, n, dest) {
		divideTriangle(a, b, c, n, dest);
		divideTriangle(d, c, b, n, dest);
		divideTriangle(a, d, b, n, dest);
		divideTriangle(a, c, d, n, dest);
	}

	function divideTriangle(a, b, c, count, dest) {
		if (count > 0) {
			let ab = normalize(mix(a, b, 0.5), true);
			let ac = normalize(mix(a, c, 0.5), true);
			let bc = normalize(mix(b, c, 0.5), true);
			divideTriangle(a, ab, ac, count - 1, dest);
			divideTriangle(ab, b, bc, count - 1, dest);
			divideTriangle(bc, c, ac, count - 1, dest);
			divideTriangle(ab, bc, ac, count - 1, dest);
		} else {
			//triangle(a, b, c, dest) ... inlined
			dest.push(a);
			dest.push(b);
			dest.push(c);
		}
	}

	let x = {};
	x.Points = [];
	x.Normals = [];
	x.Colors = [];
	let va = vec4(0.0, 0.0, 1.0, 1.0);
	let vb = vec4(0.0, 0.942809, -0.33, 1.0);
	let vc = vec4(-0.816497, -0.471405, -0.33, 1.0);
	let vd = vec4(0.816497, -0.471405, -0.33, 1.0);

	tetrahedron(va, vb, vc, vd, subDivision, x.Points);
	for (let n = 0; x.Points.length > n; n++) {
		//color = 0.5*p + 0.3
		x.Colors[n] = vec4(0.3 + x.Points[n][0], 0.3 + x.Points[n][1], 0.3 + x.Points[n][2], 1.0);
		x.Normals[n] = x.Points[n];
	}
	return x;

}


// Read a file, wih async request
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
				handleFinishedObjFile(request.responseText, fileName, scale, reverse);
			}
		}
	}

	request.open('GET', fileName, true); // Create a request to get file
	request.send(); // Send the request
}


// OBJ file has been read; now parse it
function handleFinishedObjFile(fileString, fileName, scale, reverse)
{
	var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
	var result = objDoc.parse(fileString, scale, reverse);
	if (!result)
	{
		g_objDoc = null; g_drawingInfo = null;
		console.log("OBJ file parsing error.");
		return;
	}
	console.log("Successfully loaded OBJ file.");
	g_objDoc = objDoc;
}

function render() {

	if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
		// OBJ and all MTLs are available
		g_drawingInfo = g_objDoc.getDrawingInfo();
	}
	if (!g_drawingInfo) {
		//since we have not yet retrieved data we make sure the callback repeat it self
		window.requestAnimationFrame(render);
		return;
	}
	console.log("Rendering OBJ file.");
	let eyePos = vec4(10.0, 3.0, 5.90, 1.0); 
	time += 1.0;
	eyePos = mult(rotateY(time * 2.0), eyePos);
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

	let lightDirection = vec4(1.0, 0.0, 0.0, 0); // simulate the light come along the x-axis
	let diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
	let specularColor = vec4(0.5, 0.5, 0.5, 1.0);
	let ambientColor = vec4(0.10, 0.10, 0.10, 1.0);

	gl.uniform1f(uniforms.shinyness,40.0);
	gl.uniform4fv(uniforms.lightDirection, flatten(lightDirection));
	gl.uniform4fv(uniforms.specularColor, flatten(specularColor));
	gl.uniform4fv(uniforms.diffuseColor, flatten(diffuseColor));
	gl.uniform4fv(uniforms.ambientColor, flatten(ambientColor));
	
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

	trsMatrix = mat4(); // no transformations just yet
	gl.uniformMatrix4fv(uniforms.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(cameraMatrix));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.uniform1i(uniforms.use_fixed_color, 1);

	coordinateSys = coordinateSystem(gl);
	{
		send_floats_to_buffer("a_Position",flatten( coordinateSys.points ), 3, gl, program);
		send_floats_to_buffer("a_Color", flatten( coordinateSys.colors ), 4, gl, program);
		gl.drawArrays(coordinateSys.drawtype, 0, coordinateSys.drawCount);
	}
	gl.uniform1i(uniforms.use_fixed_color, 0);
	let sphere2Render = sphere(3);

	send_floats_to_buffer("a_Position", g_drawingInfo.vertices, 3, gl, program);
	send_floats_to_buffer("a_Normal", g_drawingInfo.normals, 3, gl, program);
	send_floats_to_buffer("a_Color", g_drawingInfo.colors, 4, gl, program);

	//send_floats_to_buffer("a_Position", flatten(sphere2Render.Points), 4, gl, program);
	//send_floats_to_buffer("a_Normal", flatten(sphere2Render.Normals), 4, gl, program);
	//send_floats_to_buffer("a_Color", flatten(sphere2Render.Colors), 4, gl, program);
	
	gl.drawArrays(gl.TRIANGLES, 0, sphere2Render.Points.length);
	// Create an empty buffer object to store Index buffer
	let index_buffer = gl.createBuffer();

	//// Bind appropriate array buffer to it
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

	//// Pass the vertex data to the buffer
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(g_drawingInfo.indices), gl.STATIC_DRAW);

	//// Draw the triangle
	gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
	window.requestAnimationFrame(render);
}
