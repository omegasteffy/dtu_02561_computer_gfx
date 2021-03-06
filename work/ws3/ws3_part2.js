/**
 * Global variables
 */
let cubeSpec; //Specification of the cube containing the vertices
let coordinateSys;
let gl;		  //the GL context
let program;  // the compiled GL-program
let trsMatrix; //matrix for positioning the cube

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

function setup_stuff() {
	console.trace("Started");

	//general boiler plate stuff
	let canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);
	program = initShaders(gl, "vert", "frag");
	gl.useProgram(program);
	uniforms = cacheUniformLocations(gl, program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);


	cubeSpec = cube(gl, gl_drawtype.LINES); //Hereby we have created a unit-size cube positioned in 
	trsMatrix = mat4(); translate(0.5, .50, .50); // used for moving from current center of 0,0,0 to corner being at 0 and diagonal at 1.0
	coordinateSys = coordinateSystem(gl);

	let eye = vec3(0.0, 0.0, 8.0); //We put camera in corner in order to make the isometric view
	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.0, 0.0, 0.0);// for isometric we should look at origo

	cameraMatrix = lookAt(eye, cameraTarget, upVec);

	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 2.0;
	let far = 200.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
	gl.uniformMatrix4fv(uniforms.cameraMatrix, false, flatten(cameraMatrix));
	gl.uniformMatrix4fv(uniforms.projMatrix, false, flatten(perMatrix));

	gl.clear(gl.COLOR_BUFFER_BIT);

	{
		trsMatrix = mat4(); //no translate applied 
		send_array_to_attribute_buffer("a_Position", coordinateSys.points, 3, gl, program);
		send_array_to_attribute_buffer("a_Color", coordinateSys.colors, 4, gl, program);
		gl.drawArrays(coordinateSys.drawtype, 0, coordinateSys.drawCount);
	}

	{// 1 point perspective have to be centered
		trsMatrix = translate(0.0, 0.0, .00);
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		send_array_to_attribute_buffer("a_Position", cubeSpec.points, 3, gl, program);
		send_array_to_attribute_buffer("a_Color", cubeSpec.colors, 4, gl, program);
		gl.drawArrays(cubeSpec.drawtype, 0, cubeSpec.drawCount);
	}
	{// 2 point perspective is just moved to the right
		trsMatrix = mult( translate(1.5, 0.0, .00),rotateY(55));
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		send_array_to_attribute_buffer("a_Position", cubeSpec.points, 3, gl, program);
		send_array_to_attribute_buffer("a_Color", cubeSpec.colors, 4, gl, program);
		gl.drawArrays(cubeSpec.drawtype, 0, cubeSpec.drawCount);
	}

	{// 3 point perspective is the general case, we get it by moving left + a bit of rotation
		trsMatrix = translate(-1.5, 0.0, .00);
		let rotateMat = mult(rotateX(-30), rotateY(30));
		trsMatrix = mult(trsMatrix, rotateMat );
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		send_array_to_attribute_buffer("a_Position", cubeSpec.points, 3, gl, program);
		send_array_to_attribute_buffer("a_Color", cubeSpec.colors, 4, gl, program);
		gl.drawArrays(cubeSpec.drawtype, 0, cubeSpec.drawCount);
	}

	requestAnimationFrame(render); 
}
setup_stuff();

function render()
{

 //for a static image
}