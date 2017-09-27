console.trace("Started");
var canvas = document.getElementById('draw_area');

var     gl = WebGLUtils.setupWebGL(canvas);

var program = initShaders(gl,"vert1","frag1");

gl.useProgram(program);
gl.viewport( 0.0 ,0.0, canvas.width,canvas.height)
gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

var vertices = new Float32Array(
    [0.0,0.0, //middle
    1.0,0.0, // right
    1.0,1.0,] //top right
)

var vertice_colors = new Float32Array(
	[1.0, 0.0, 0.0, 1.0, //Red
		0.0, 0.0, 1.0, 1.0, //Green
		0.0, 1.0, 0.0, 1.0] //Blue
);


var point_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, point_buffer); // make it the current buffer assigned in WebGL
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);//link the JS-points and the 
var vPos = gl.getAttribLocation(program, "vPosition"); // setup a pointer to match the 
gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vPos);


var color_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer); // make it the current buffer assigned in WebGL
gl.bufferData(gl.ARRAY_BUFFER, vertice_colors, gl.STATIC_DRAW);//link the JS-points and the 
var vColor = gl.getAttribLocation(program, "vColor"); // setup a pointer to match the 
gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vColor);

gl.clear(gl.COLOR_BUFFER_BIT); 
gl.drawArrays(gl.TRIANGLES,0,3);
//render();
console.trace("Ended");