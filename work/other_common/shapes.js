/**
 * Creates the points for a rectangle of unit size 1x1
 * @param {any} gl th gl context is needed ... to fetch enum-value
 */
function rectangle_2d(gl) {
	w = .5;
	h = .5;
	var x = { "type": "quad" };
	x.drawtype = gl.TRIANGLE_STRIP;
	x.vertices = new Float32Array([-w, -h, //lower left
	-w, h
		, w, -h, //lower right
		w, h, //upper right
	]);//upper left
    x.drawCount = 4;
    x.perDrawing = 2; //since it is 2D
	return x;
}
/**
 * Creates points for a 2D circle
 * @param {gl-context} gl 
 * @param {int > 5} no_points  How many stops along the cicle we should have (more => smoother shape, but more ressources required)
 */
function circle_2d(gl,no_points)
{
	if( 5 > no_points)
	{
		throw("At least 5 points are required!");
	}
	let x = {};
	x.vertices = new Float32Array(2*(no_points+2));
	const angle_per_point = 2*Math.PI/no_points;
	// draw the center
	x.vertices[0] =0;
	x.vertices[1] =0;
	for (let n = 1; n < no_points+2; n++)
	{
		x.vertices[2*n] = 0.5* Math.cos(angle_per_point * n );
		x.vertices[2*n +1 ] = 0.5* Math.sin(angle_per_point * n );
	}
	x.perDrawing = 2;
	x.drawCount = no_points+2;
	x.drawtype = gl.TRIANGLE_FAN;
	return x;
}
function sphere_3d(subDivision)
{
	let x = {};
	x.Points = [];
	x.Normals = [];
	x.Colors = [];
	x.drawCount=0;
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
			x.drawCount=x.drawCount+3;
		}
	}


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