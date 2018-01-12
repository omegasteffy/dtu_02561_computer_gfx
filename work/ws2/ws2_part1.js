console.trace("Started");
let canvas;
let gl;
let program;
let initial_points;
let extra_points=[];

init_stuff();
function setup_initial_points()
{	
	let x = {};
	x.vertices = new Float32Array(
	[0.0, 0.0, //middle
		1.0, 0.0, // right
		1.0, 1.0]); //top right

	x.colors = [
		CommonColors.red, //Red
		CommonColors.green,//Green
		CommonColors.blue]; //Blue

	return x;

}

function init_stuff()
{
	canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);

	program = initShaders(gl, "vert", "frag");

	gl.useProgram(program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	initial_points= setup_initial_points();



	//render();
	console.trace("Ended");
	render();
}

function render() {
	send_floats_to_attribute_buffer("a_Position",initial_points.vertices,2,gl,program);
	send_floats_to_attribute_buffer("a_Color",flatten(initial_points.colors),4,gl,program);

	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.drawArrays(gl.POINTS, 0, initial_points.vertices.length/2);
	for(let n=0; n<extra_points.length; n++)
	{
		send_floats_to_attribute_buffer("a_Position",extra_points[n].points,2,gl,program);
		send_floats_to_attribute_buffer("a_Color",flatten(extra_points[n].color),4,gl,program);
		gl.drawArrays(gl.POINTS, 0,1);
	}

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
		console.log("x=" + (click_pos.x) + " y=" + (click_pos.y) + " or x=" + view_port_pos.x + "y=" + view_port_pos.y);
		draw_request = {};
		draw_request.points = new Float32Array([view_port_pos.x, view_port_pos.y]);
		draw_request.color = CommonColors.green;
		extra_points.push(draw_request);
	}

);