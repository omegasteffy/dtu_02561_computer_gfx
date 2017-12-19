/**
*
*
*
**/

/**
 * Will send an array of floats to the target-buffer within the gl-program
 * @param {any} buffername Name of the attribute-buffer within the gl-program
 * @param {any} input_data Data to forward
 * @param {any} data_dimension How many dimensions is the data in the gl-program?, e.g. 3 for a vec3
 * @param {any} gl				GL-object.
 * @param {any} program			The compiled gl-program
 */
function send_floats_to_attribute_buffer(buffername, input_data, data_dimension, gl, program) {
	let buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer); // make it the current buffer assigned in WebGL
	gl.bufferData(gl.ARRAY_BUFFER, input_data, gl.STATIC_DRAW);//link the JS-points and the 
	let attribLocation = gl.getAttribLocation(program, buffername); // setup a pointer to match the 
	gl.vertexAttribPointer(attribLocation, data_dimension, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attribLocation);
}

/**
 * Will send an array of js-arrays into the target-buffer within the gl-program
 * @param {any} buffername Name of the attribute-buffer within the gl-program
 * @param {any} input_data Data to forward
 * @param {any} data_dimension How many dimensions is the data in the gl-program?, e.g. 3 for a vec3
 * @param {any} gl				GL-object.
 * @param {any} program			The compiled gl-program
 */
function send_array_to_attribute_buffer(buffername, input_data, data_dimension, gl, program) {
	return send_floats_to_attribute_buffer(buffername, flatten(input_data), data_dimension, gl, program)
}

/**
 * Definitions of some common colors
 */
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

/**
 * Retrieves all the attribute location of the GL-program for easy access
 * This snipet of code is retrieved from Anders Hellerup Madsen ( look for ToxicSyntax at pouet.net )
 * @param {any} gl
 * @param {any} program
 */
function cacheUniformLocations(gl, program) {
	const activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	const uniformLocations = {};
	for (let i = 0; i < activeUniforms; i++) {
		const info = gl.getActiveUniform(program, i);
		uniformLocations[info.name] = gl.getUniformLocation(program, info.name);
	}
	return uniformLocations;
}

/**
 * Coordinate system to give you an idea about your position in the 3D-world
 *	Red along positive x-axis
 *	Blue along positive y-axis
 *	Green along positive z-axis
 * @param {any} gl
 */
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