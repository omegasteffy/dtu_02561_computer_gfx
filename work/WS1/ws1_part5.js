
/**
 * Create 
 * @param {any} w
 * @param {any} h
 */
function quad(gl, w, h) {
	w = w / 2;
	h = h / 2;
	var x = { "type": "quad" };
	x.drawtype = gl.TRIANGLE_STRIP;
	x.vertices = new Float32Array([-w, -h, //lower left
	-w, h
		, w, -h, //lower right
		w, h, //upper right
	]);//upper left
	x.drawCount = 4;
	return x;
}
var rectSpec;
var gl;
var program;

function setup_stuff() {
	console.trace("Started");
	var canvas = document.getElementById('draw_area');

	gl = WebGLUtils.setupWebGL(canvas);

	 program = initShaders(gl, "vert1", "frag1");

	gl.useProgram(program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	var vertices = new Float32Array(
		[0.0, 0.0, //middle
			1.0, 0.0, // right
			1.0, 1.0,] //top right
	)

	var vertice_colors = new Float32Array(
		[1.0, 0.0, 0.0, 1.0, //Red
			0.0, 1.0, 0.0, 1.0, //Green
			0.0, 0.0, 1.0, 1.0, //Blue
			0.4, 0.1, 0.3, 1.0] //Blue
	);

	rectSpec = quad(gl, 0.5, 0.5);

	var point_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, point_buffer); // make it the current buffer assigned in WebGL
	gl.bufferData(gl.ARRAY_BUFFER, rectSpec.vertices, gl.STATIC_DRAW);//link the JS-points and the 
	var vPos = gl.getAttribLocation(program, "vPosition"); // setup a pointer to match the 
	gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPos);

	requestAnimationFrame(render); 
}
var y_offset = 0.1;
setup_stuff();

function render()
{
	var y_offest_Loc = gl.getUniformLocation(program, "y_offset");
	gl.uniform1f(y_offest_Loc, y_offset);
	y_offset += 0.1;
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(rectSpec.drawtype, 0, rectSpec.drawCount);
	requestAnimationFrame(render); 
}