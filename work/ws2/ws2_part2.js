console.trace("Started");
let canvas;
let gl;
let program;
let extra_points=[];

init_stuff();


function init_stuff()
{
	canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);

	program = initShaders(gl, "vert", "frag");

	gl.useProgram(program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	document.getElementById("clear_button").onclick = handleClearButton;
	console.trace("Ended");
	render();
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT);


	for(let n=0; n<extra_points.length; n++)
	{
		send_floats_to_attribute_buffer("a_Position",extra_points[n].points,2,gl,program);
		send_floats_to_attribute_buffer("a_Color",flatten(extra_points[n].color),4,gl,program);
		gl.drawArrays(gl.POINTS, 0,1);
	}

	window.requestAnimationFrame(render);
}
function handleClearButton()
{
	extra_points=[];//i was unable to find a clear method
}
function getSelectedColor()
{
	let selected_color = 'undefined';
	let possible_colors = document.getElementById("colorselect");
	for( let n=0; n<possible_colors.length; n++ )
	{
		if(possible_colors[n].selected)
		{
			selected_color =possible_colors[n].value;
		}
	}
	switch(selected_color)
	{
		case "black": return CommonColors.red;
		case "red": return CommonColors.red;
		case "green":return CommonColors.green;
		case "blue" : return CommonColors.blue;
		case "yellow" : return CommonColors.yellow;
		case "pink" : return CommonColors.pink;
		case "magenta" :return CommonColors.magenta;
		case "orange": return CommonColors.orange;
		case "lime" : return CommonColors.lime;
		case "brown" : return CommonColors.brown;
		case "light_blue_clearing_color": return CommonColors.light_blue_clearing_color;
		default: console("the selected color is unrecognized "+ selected_color)
		return CommonColors.red;
	};
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
		//Correct toward pointing part of cursor
		let view_port_pos =
		{
				x: -1 + (click_pos.x / event.target.height)*2 ,
			y: 1 - (click_pos.y / event.target.width) *2
		};
		console.log("x=" + (click_pos.x) + " y=" + (click_pos.y) + " or x=" + view_port_pos.x + "y=" + view_port_pos.y);

		draw_request = {};
		draw_request.points = new Float32Array([view_port_pos.x, view_port_pos.y]);
		draw_request.color = getSelectedColor();
		extra_points.push(draw_request);
		let color = getSelectedColor();
	}

);