console.trace("Started");
let canvas;
let gl;
let program;
let vertices =
	[0.0, 0.0, //middle
		1.0, 0.0, // right
		1.0, 1.0,]; //top right

let vertice_colors = [1.0, 0.0, 0.0, 1.0, //Red
	0.0, 0.0, 1.0, 1.0, //Green
	0.0, 1.0, 0.0, 1.0]; //Blue
vertice_colors.push(0.0, 1.0, 1.0, 1.0);
vertices.push(0.5, 0.2);

init_stuff();

function init_stuff()
{
	canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);

	program = initShaders(gl, "vert1", "frag1");

	gl.useProgram(program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);





	//render();
	console.trace("Ended");
	render();
}

function render() {
	var point_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, point_buffer); // make it the current buffer assigned in WebGL
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);//link the JS-points and the 
	var vPos = gl.getAttribLocation(program, "vPosition"); // setup a pointer to match the 
	gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPos);


	var color_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer); // make it the current buffer assigned in WebGL
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertice_colors), gl.STATIC_DRAW);//link the JS-points and the 
	var vColor = gl.getAttribLocation(program, "vColor"); // setup a pointer to match the 
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);


	gl.clear(gl.COLOR_BUFFER_BIT);
	//alert("point count" + vertices.length / 2 + "colour count" + vertice_colors.length / 4);
	gl.drawArrays(gl.POINTS, 0, (vertices.length / 2));
	window.requestAnimationFrame(render);
}
canvas.addEventListener("click",
	function () {
		let curser_offset = {};
		curser_offset.x = event.target.getBoundingClientRect().left;
		curser_offset.y = event.target.getBoundingClientRect().top;
		let click_pos =
			{
				x: event.clientX - curser_offset.x,
				y: event.clientY - curser_offset.y
			};
		let view_port_pos =
		{
				x: -1 + (click_pos.x / event.target.height)*2 ,
			y: 1 - (click_pos.y / event.target.width) *2
		};
		alert("x=" + (click_pos.x) + " y=" + (click_pos.y) + " or x=" + view_port_pos.x + "y=" + view_port_pos.y);
		vertices.push(view_port_pos.x, view_port_pos.y);
		vertice_colors.push(1.0, 0.3, 0.2, 1.0);
	}

);