/**
 * Global variables
 */
let cubeSpec; //Specification of the cube containing the vertices
let gl;		  //the GL context
let program;  // the compiled GL-program
let moveCube; //matrix for positioning the cube

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

/**
 * OBSOLETE
 * Gives a vec4-color specification of the color requested
 * In case the color is not found a random one is generated
 *
 * @param {string} color_name 
 * @returns vec4 color
 */
function get_color(color_name)
{
	let color_str_lower = color_name.toLowerCase();
	switch (color_str_lower)
	{
		case "red":    return vec4(1.0, 0.0, 0.0, 1.0);
		case "green":  return vec4(0.0, 1.0, 0.0, 1.0);
		case "blue":   return vec4(0.0, 0.0, 1.0, 1.0);
		case "yellow": return vec4(1.0, 1.0, 0.0, 1.0);
		case "pink":   return vec4(1.0, 0.0, 0.5, 1.0);
		case "magenta": return vec4(1.0, 0.0, 1.0, 1.0);
		case "orange": return vec4(1.0, 0.62, 1.0, 1.0);
		case "lime": return vec4(.84, 0.99, 0.0, 1.0);
		case "brown": return vec4(0.7, 0.25, .06, 1.0);
	}

	return vec4(0.2 + 0.6 * Math.random(), 0.2 + 0.6 * Math.random(), 0.2 + 0.6 * Math.random(), 1.0)

}
const CommonColors = {
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
/**
 * Set the clearing color using color specified in vec4 input argument
 * @param {gl-context} gl
 * @param {vec4} clearing_color
 */
function set_clear_color(gl,color)
{
	gl.clearColor(color.r, color.g, color.b, color.a);
}
function random_color() { return vec4(0.2 + 0.6 * Math.random(), 0.2 + 0.6 * Math.random(), 0.2 + 0.6 * Math.random(), 1.0);}

/**
 * Creates points for a cube
 * positioned at origo, with a size of 1 unit on all sides
 * @param {GL_context} gl
 */
function cube(gl, drawtype)
{
	if ((drawtype != gl_drawtype.LINES) && (drawtype != gl_drawtype.TRIANGLES))
	{
		throw ("Unsupported type");
	}
	//a cube have 6x-surfaces/faces
	//hereby we should define 12 triangles or 

	let x = { "type": "cube" };

	const NEG = -.5;
	const POS =  .5;
	x.vertices = [
		//                  5-------6
		//                 /|      /|
		//                / |     / |
		//               1--|----2  |
		//               |  4----|--7
		//               | /     | /
		//               0-------3
		vec3(NEG, NEG, POS),//0
		vec3(NEG, POS, POS),//1
		vec3(POS, POS, POS),//2
		vec3(POS, NEG, POS),//3
		vec3(NEG, NEG, NEG),//4
		vec3(NEG, POS, NEG),//5
		vec3(POS, POS, NEG),//6
		vec3(POS, NEG, NEG),//7
	];
	x.col_vertices = [
		CommonColors.red,//0
		CommonColors.blue,//1
		CommonColors.green,//2
		CommonColors.yellow,//3
		CommonColors.pink,//4
		CommonColors.magenta, //5
		CommonColors.brown, //6
		CommonColors.lime //7  ...or call random_color()
	];

	x.face_indicies  =
	[
		quad_to_indicies(drawtype, 1, 0, 3, 2),//front
		quad_to_indicies(drawtype, 2, 3, 7, 6),//right
		quad_to_indicies(drawtype, 3, 0, 4, 7),//bottom
		quad_to_indicies(drawtype, 6, 5, 1, 2),//top
		quad_to_indicies(drawtype, 4, 5, 6, 7),//back
		quad_to_indicies(drawtype, 5, 4, 0, 1)//right
	];
	x.points = []
	x.colors = []
	for (let k = 0; k < x.face_indicies.length ; k++)
	{
		let current_face = x.face_indicies[k];
		for (let j = 0; j < current_face.length; j++) {
			x.points.push(x.vertices[current_face[j]]);
			x.colors.push(x.col_vertices[current_face[j]]);
		}
	}
	x.drawtype = (gl_drawtype.LINES == drawtype) ? gl.LINES : gl.TRIANGLES;
	x.drawCount = x.points.length;
	return x;
}


function setup_stuff() {
	console.trace("Started");

	//general boiler plate stuff
	var canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);
	program = initShaders(gl, "vert1", "frag1");
	gl.useProgram(program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);


	cubeSpec = cube(gl, gl_drawtype.LINES); //Hereby we have created a unit-size cube positioned in 
	moveCube = translate(0.5, 0.5, 0.5); // used for moving from current center of 0,0,0 to corner being at 0 and diagonal at 1.0

	let eye = vec3(0.5, 0.5, 1.5); //in order to center the camera in front of the cube 
	let upVec = vec3(0.0, 1.0, 0.0);
	let cameraTarget = vec3(0.5, 0.5, -1.0);// and we look on to the front surface of the cube
	cameraMatrix = lookAt(eye, cameraTarget, upVec);
	//cameraMatrix = mat4(1);
	//gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order

	let locMoveMat = gl.getUniformLocation(program, "moveMatrix");
	gl.uniformMatrix4fv(locMoveMat,false, flatten(moveCube));

	let locCamMat = gl.getUniformLocation(program, "camMatrix");
	gl.uniformMatrix4fv(locCamMat, false, flatten(cameraMatrix));

	var point_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, point_buffer); // make it the current buffer assigned in WebGL
	gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeSpec.points), gl.STATIC_DRAW);//link the JS-points and the 
	let vPos = gl.getAttribLocation(program, "vPosition"); // setup a pointer to match the 
	gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPos);

	var color_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer); // make it the current buffer assigned in WebGL
	gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeSpec.colors), gl.STATIC_DRAW);//link the JS-points and the 
	let vCol = gl.getAttribLocation(program, "vColor"); // setup a pointer to match the 
	gl.vertexAttribPointer(vCol, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vCol);

	requestAnimationFrame(render); 
}
setup_stuff();

function render()
{
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(cubeSpec.drawtype, 0, cubeSpec.drawCount);
	//requestAnimationFrame(render); 
}