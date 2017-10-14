/**
 * Global variables
 */
let cubeSpec; //Specification of the cube containing the vertices
let coordinateSys;
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

	const NEG = 0;
	const POS =  1;
	x.vertices = [
		// To make it easier to grasp the placement, we have some beautyful 3D-ascii
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


function setup_stuff() {
	console.trace("Started");

	//general boiler plate stuff
	let canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);
	program = initShaders(gl, "vert1", "frag1");
	gl.useProgram(program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);


	cubeSpec = cube(gl, gl_drawtype.LINES); //Hereby we have created a unit-size cube positioned in 
	moveCube = mat4();translate(0.5,.50, .50); // used for moving from current center of 0,0,0 to corner being at 0 and diagonal at 1.0
	coordinateSys = coordinateSystem(gl);
	//moveCube = mult(rotCube);

	let eye = vec3(1.2, 3.2, 3.0); //We put camera in corner in order to make the isometric view
	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.0, 0.0, -1.0);// for isometric we should look at origo

	cameraMatrix = lookAt(eye, cameraTarget, upVec);

	let near = 2.0;//vec3(1.0, 1.0, 1.0);
	let far = 200.0;//vec3(1.0, 1.0, 1.0);
	let perMatrix = perspective(45, 1.0, near, far);
	let cameraMatrix2 = mult(perMatrix ,cameraMatrix);
	//	gl.enable(gl.DEPTH_TEST);
	//gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

	let locMoveMat = gl.getUniformLocation(program, "moveMatrix");
	gl.uniformMatrix4fv(locMoveMat,false, flatten(moveCube));

	let locCamMat = gl.getUniformLocation(program, "camMatrix");
	gl.uniformMatrix4fv(locCamMat, false, flatten(cameraMatrix));


	let locPerMat = gl.getUniformLocation(program, "pMatrix");
	gl.uniformMatrix4fv(locPerMat, false, flatten(perMatrix));
	let allpoints = coordinateSys.points.concat(cubeSpec.points);
	let allColors = coordinateSys.colors.concat(cubeSpec.colors);

	let point_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, point_buffer); // make it the current buffer assigned in WebGL
	gl.bufferData(gl.ARRAY_BUFFER, flatten(allpoints), gl.STATIC_DRAW);//link the JS-points and the 
	let vPos = gl.getAttribLocation(program, "vPosition"); // setup a pointer to match the 
	gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPos);

	var color_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer); // make it the current buffer assigned in WebGL
	gl.bufferData(gl.ARRAY_BUFFER, flatten(allColors), gl.STATIC_DRAW);//link the JS-points and the 
	let vCol = gl.getAttribLocation(program, "vColor"); // setup a pointer to match the 
	gl.vertexAttribPointer(vCol, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vCol);

	requestAnimationFrame(render); 
}
setup_stuff();

function render()
{
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(coordinateSys.drawtype, 0, coordinateSys.drawCount + cubeSpec.drawCount);
	//requestAnimationFrame(render); 
}