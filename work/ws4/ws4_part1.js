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


function random_color() { return vec4(0.4 + 0.5 * Math.random(), 0.2 + 0.6 * Math.random(), 0.2 + 0.6 * Math.random(), 1.0); }

function tetrahedron(a, b, c, d, n, dest)
{
	divideTriangle(a, b, c, n, dest);
	divideTriangle(d, c, b, n, dest);
	divideTriangle(a, d, b, n, dest);
	divideTriangle(a, c, d, n, dest);
}

function divideTriangle( a , b , c , count ,dest)
{
	if (count > 0)
	{
		let ab = normalize( mix(a, b, 0.5), true);
		let ac = normalize( mix(a, c, 0.5), true);
		let bc = normalize( mix(b, c, 0.5), true);
		divideTriangle(a, ab, ac, count - 1, dest);
		divideTriangle(ab, b, bc, count - 1, dest);
		divideTriangle(bc, c, ac, count - 1, dest);
		divideTriangle(ab, bc, ac, count - 1, dest);
	}else{
		//triangle(a, b, c, dest) ... inlined

		dest.push(a);
		dest.push(b);
		dest.push(c);
	}
}

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
	program = initShaders(gl, "vert1", "frag1");
	gl.useProgram(program);
	uniforms = cacheUniformLocations(gl, program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	cubeSpec = cube(gl, gl_drawtype.TRIANGLES); //Hereby we have created a unit-size cube positioned in 
	moveCube = mat4(); 
	coordinateSys = coordinateSystem(gl);

	let eye = vec3(1.0, 3.0, 5.0); //We put camera in corner in order to make the isometric view
	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.0, 0.0, 0.0);// for isometric we should look at origo

	cameraMatrix = lookAt(eye, cameraTarget, upVec);

	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 1.0;
	let far = 100.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

	let proj_transform_Matrix = mult(perMatrix, cameraMatrix);
	gl.uniformMatrix4fv(uniforms.proj_transform_Matrix, false, flatten(proj_transform_Matrix));
	

	let tetraPoints = [];
	let tetraColors = [];
	let va = vec4( 0.0, 0.0, 1.0, 1.0);
	let vb = vec4(0.0, 0.942809, -0.33,  1.0);
	let vc = vec4(-0.816497, -0.471405, -0.33, 1.0);
	let vd = vec4(0.816497, -0.471405, -0.33, 1.0);

	tetrahedron(va, vb, vc, vd, 3, tetraPoints);
	for (let n = 0; tetraPoints.length > n; n++)
	{
		//color = 0.5*p + 0.3
		tetraColors[n] = vec4(0.3+ tetraPoints[n][0], 0.3 + tetraPoints[n][1], 0.3 + tetraPoints[n][2], 1.0);
	}

	{// draw coordinat system
		trsMatrix = mat4();
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		send_array_to_attribute_buffer("vPosition", coordinateSys.points, 3, gl, program);
		send_array_to_attribute_buffer("vColor", coordinateSys.colors, 4, gl, program);
		gl.drawArrays(coordinateSys.drawtype, 0, coordinateSys.drawCount);
	}

	{//draw the cube
		trsMatrix = translate(2.25,.5,1.0);// rotateY(45);
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		send_array_to_attribute_buffer("vPosition", cubeSpec.points, 3, gl, program);
		send_array_to_attribute_buffer("vColor", cubeSpec.colors, 4, gl, program);
		gl.drawArrays(cubeSpec.drawtype, 0, cubeSpec.drawCount);
	}
	{//The Circle
		trsMatrix = mat4();//rotateX(Math.random() * 45);
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		send_array_to_attribute_buffer("vPosition", tetraPoints, 4, gl, program);
		send_array_to_attribute_buffer("vColor", tetraColors, 4, gl, program);
		console.log("count =" + tetraPoints.length);
		gl.drawArrays(gl.TRIANGLES, 0, tetraPoints.length);
	}

	requestAnimationFrame(render); 
}
setup_stuff();

function render()
{


	//requestAnimationFrame(render); 
}