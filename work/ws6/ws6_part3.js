/**
 * Global variables
 */
let coordinateSys;
let gl;		  //the GL context
let program;  // the compiled GL-program
let moveCube; //matrix for positioning the cube
let sphere1;
let time = 0;
let min_filter_value = null;
let max_filter_value = null;
let wrap_s_value = null;
let wrap_t_value = null;

const gl_drawtype = { "LINES": 0, "TRIANGLES": 1 };
/**
 * Will give triangle indecies from the input corner indecies
 * @param {any} a
 * @param {any} b
 * @param {any} c
 * @param {any} d
 */
function quad_to_triangle_indicies(a, b, c, d)
{
	return [a,b,c,a,c,d];
}
/**
 * Will give triangle indecies from the input corner indecies
 * @param {any} a
 * @param {any} b
 * @param {any} c
 * @param {any} d
 */
function quad_to_line_indicies(a, b, c, d) {
	return [a, b, b, c, c, d,d,a];
}

function quad_to_indicies(drawtype, a, b, c, d)
{
	switch (drawtype)
	{
		case gl_drawtype.LINES: return quad_to_line_indicies(a, b, c, d);
		case gl_drawtype.TRIANGLES: return quad_to_triangle_indicies(a, b, c, d);
		default: throw ("Not supported");
	}
}

const CommonColors = {
	"black": vec4(0.0, 0.0, 0.0, 1.0),
	"red": vec4(1.0, 0.0, 0.0, 1.0),
	"green": vec4(0.0, 1.0, 0.0, 1.0),
	"blue":  vec4(0.0, 0.0, 1.0, 1.0),
	"yellow":vec4(1.0, 1.0, 0.0, 1.0),
	"pink":  vec4(1.0, 0.0, 0.5, 1.0),
	"magenta": vec4(1.0, 0.0, 1.0, 1.0),
	"orange": vec4(1.0, 0.62, 1.0, 1.0),
	"lime":  vec4(.84, 0.99, 0.0, 1.0),
	"brown": vec4(0.7, 0.25, .06, 1.0),
	"light_blue_clearing_color": vec4(0.3921, 0.5843, 0.9294, .10)
};

function random_color() { return vec4(0.4 + 0.5 * Math.random(), 0.2 + 0.6 * Math.random(), 0.2 + 0.6 * Math.random(), 1.0); }

var image = document.createElement('img');
image.crossorigin = 'anonymous';
image.src = '../../code_and_data/earth.jpg';
image.onload = function () {    // Insert WebGL texture initialization here 
setup_stuff();
}; 


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
function send_array_to_buffer(buffername, input_data, data_dimension, gl, program) {
	let buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer); // make it the current buffer assigned in WebGL
	gl.bufferData(gl.ARRAY_BUFFER, flatten(input_data), gl.STATIC_DRAW);//link the JS-points and the 
	let attribLocation = gl.getAttribLocation(program, buffername); // setup a pointer to match the 
	gl.vertexAttribPointer(attribLocation, data_dimension, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attribLocation);
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

function sphere(subDivision)
{
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

function setup_stuff()
{
	console.trace("Started");

	//general boiler plate stuff
	let canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);
	program = initShaders(gl, "vert1", "frag1");
	gl.useProgram(program);
	uniforms = cacheUniformLocations(gl, program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	
	coordinateSys = coordinateSystem(gl);

	let texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture); // make our new texture the current one
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	
	
	render();

}

function decode_radiobutton_selection()
{
	let changed_settings = false;
	let min_filter_boxes = document.getElementsByName('MinimizeFilter');
	for(let k = 0; k< min_filter_boxes.length; k++ )
	{
		if (min_filter_boxes[k].checked && (min_filter_value != min_filter_boxes[k].value))
		{
			min_filter_value = min_filter_boxes[k].value;
			changed_settings = true;
		}
	}
	let max_filter_boxes = document.getElementsByName('MaximizeFilter');
	for(let k = 0; k< max_filter_boxes.length; k++ )
	{
		if (max_filter_boxes[k].checked && (max_filter_value != max_filter_boxes[k].value))
		{
			max_filter_value = max_filter_boxes[k].value;
			changed_settings = true;
		}
	}	
	return changed_settings;
}

//setup_stuff();

function render()
{
	sphere1 = sphere(document.getElementById('subdivision_slider').value);
	time += 1;
	let eyePos = vec4(1.5, 1.5, 1.5, 1.0); //We put camera in corner in order to make the isometric view
	eyePos = mult(rotateY(time * .5), eyePos);
	eyePos = vec3(eyePos[0], eyePos[1], eyePos[2]);
	
	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.0, 0.0, 0.0);// for isometric we should look at origo

	cameraMatrix = lookAt(eyePos, cameraTarget, upVec);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	let canvas = document.getElementById('draw_area');
	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 1.0;
	let far = 100.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

	gl.uniformMatrix4fv(uniforms.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(cameraMatrix));

	let lightDirection = vec4(0, 0, 1, 0);
	//let lightPos = vec4(1, 1, 4, 0); // only used if we use directional coordinates
	//gl.uniform4fv(uniforms.lightPos, flatten(lightPos));
	let is_white_selected = document.getElementById("colorscheme_white").checked;
	gl.uniform4fv(uniforms.lightDirection, flatten(lightDirection));
	if (is_white_selected) {
		var diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
		var specularColor = vec4(0.8, 0.8, 0.8, 1.0);
	}
	else {
		var diffuseColor = vec4(0.1, 0.1, 0.8, 1.0);
		var specularColor = vec4(0.8, 0.1, 0.1, 1.0);
	}
	let ambientColor = vec4(0.25, 0.25, 0.25, 1.0); //always
	

	let ambient_coef = document.getElementById("ambientlight_slider").value*.01;
	let specular_coef = document.getElementById("specularlight_slider").value * .01;
	let diffuse_coef =document.getElementById("diffuselight_slider").value * .01;

	gl.uniform4fv(uniforms.specularColor, flatten(specularColor));
	gl.uniform4fv(uniforms.diffuseColor, flatten(diffuseColor));
	gl.uniform4fv(uniforms.ambientColor, flatten(ambientColor));

	let is_phong_selected = document.getElementById("lightmodel_phong").checked;
	if (is_phong_selected)
	{
		gl.uniform1i(uniforms.normalize_light_param, 1);
	}
	else
	{
		gl.uniform1i(uniforms.normalize_light_param, 0);
	}

	gl.uniform1f(uniforms.specular_coef, specular_coef);
	gl.uniform1f(uniforms.diffuse_coef, diffuse_coef);
	gl.uniform1f(uniforms.ambient_coef, ambient_coef );


	const changed_settings = decode_radiobutton_selection();

	if(changed_settings)
	{
		switch(min_filter_value)
		{
			case "Nearest" :
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				break;
			case "Linear":
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				break;
			case "NearestMipMap-Nearest" :
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
				break;
			case "NearestMipMap-Linear":
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
				break;
			case "LinearMipMap-Nearest" :
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
				break;
			case "LinearMipMap-Linear":
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
				break;
			default:
				alert("unrecognized value for minification filter");
		}
		switch(max_filter_value)
		{
			case "Nearest" :
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
				break;
			case "Linear":
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				break;
			//Not supported for magnification filter
			// case "MipMap-Nearest" :
			// 	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST_MIPMAP_NEAREST);
			// 	break;
			// case "MipMap-Linear":
			// 	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST_MIPMAP_LINEAR);
			// 	break;
			default:
				alert("unrecognized value for maxification filter");
		}
	}
	{// draw coordinat system
		trsMatrix = mat4();
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		send_array_to_buffer("vertexPos", coordinateSys.points, 3, gl, program);
		send_array_to_buffer("vColor", coordinateSys.colors, 4, gl, program);
		gl.drawArrays(coordinateSys.drawtype, 0, coordinateSys.drawCount);
	}
	let shinyness = document.getElementById('shine_slider').value;
	{//The sphere
		trsMatrix = mat4();
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		gl.uniform1f(uniforms.shinyness, shinyness);
		send_array_to_buffer("vertexPos", sphere1.Points, 4, gl, program);
		send_array_to_buffer("vColor", sphere1.Colors, 4, gl, program);
		gl.drawArrays(gl.TRIANGLES, 0, sphere1.Points.length);
	}

	requestAnimationFrame(render); 
}