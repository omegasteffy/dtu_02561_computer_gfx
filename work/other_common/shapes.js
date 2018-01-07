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