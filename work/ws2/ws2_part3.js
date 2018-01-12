console.trace("Started");
let canvas;
let gl;
let program;
let initial_points;
let shapes_finished_list= Array();
let shape_being_drawn={};
let current_drawmode='';


let shape_point = function(point,color)
{
	this.points = flatten(point);
	this.colors = flatten(color);
	this.drawCount = 1;
	this.shapeType = 'point';
	this.drawType = gl.POINTS;
}
let shape_triangle = function(point,color)
{
	this.points = flatten(point);
	this.colors = flatten(color);
	this.drawCount = 3;
	this.shapeType = 'triangle';
	this.drawType = gl.TRIANGLES;
}
 
var ShapePreliminary = function(dest){
	this.points = []
	this.colors = [];
	this.drawCount = 0;
	this.shapeType = 'point';
	this.drawType = gl.POINTS;
	this.destination_list = dest; // add to here once completed
	return this;
 }
  
 ShapePreliminary.prototype.hasPoints = function ()
 {
	return this.drawCount > 0;
 }
 ShapePreliminary.prototype.set_type = function (new_Shape)
 {
	if (this.shapeType != new_Shape)
	{
		this.shapeType = new_Shape;
		this.clear();	
	}
 }

 ShapePreliminary.prototype.clear = function()
 {
	this.drawCount =0;
	this.points = [];	 
	this.colors = [];
 }
 ShapePreliminary.prototype.add_point= function(point,color)
 {
	 switch(this.shapeType)
	 {
		case 'point': 
		 	//For points we can directly create a new object
			this.destination_list.push( new shape_point(point,color));
			this.clear();
			break;

		case 'triangle':
		 	//for triangles we must already have two points before we have a complete shape
			 this.points.push(point);
			 this.colors.push(color);
			 this.drawCount++;

			if(this.drawCount==3)
			{
				this.destination_list.push( new shape_triangle(this.points,this.colors));
				this.clear();
			}
			break;

		default:
				throw("unknown draw mode "+this.shapeType);

	 }
 }

function set_draw_mode(new_mode)
{
	document.getElementById("draw_mode_indicator").innerText = new_mode;
	shape_being_drawn.set_type(new_mode);
}
function init_stuff()
{
	canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);

	program = initShaders(gl, "vert", "frag");

	gl.useProgram(program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);



	shape_being_drawn = new Shape(shapes_finished_list);
	set_draw_mode("point");
	document.getElementById("clear_button").onclick = handleClearButton;
	document.getElementById("drawmode_select").onchange = handleChangedDrawMode

	//render();
	console.trace("Ended");
	render();
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT);

	for(let n=0; n < shapes_finished_list.length; n++)
	{
		send_floats_to_attribute_buffer("a_Position",shapes_finished_list[n].points,2,gl,program);
		send_floats_to_attribute_buffer("a_Color",shapes_finished_list[n].colors,4,gl,program);
		gl.drawArrays(shapes_finished_list[n].drawType, 0,shapes_finished_list[n].drawCount);
	}
	if( shape_being_drawn.hasPoints() )
	{
		send_floats_to_attribute_buffer("a_Position",flatten(shape_being_drawn.points),2,gl,program);
		send_floats_to_attribute_buffer("a_Color",flatten(shape_being_drawn.colors),4,gl,program);
		gl.drawArrays(shape_being_drawn.drawType, 0,shape_being_drawn.drawCount);
	}

	window.requestAnimationFrame(render);
}
function handleClearButton()
{
	while( shapes_finished_list.length>0)
	{
		shapes_finished_list.pop(); // did not find a clear method
	}
	shape_being_drawn.clear();
}
function handleChangedDrawMode()
{
	let found_mode = false;
	let selected_mode;
	let possible_modes = document.getElementById("drawmode_select");
	for( let n=0; n<possible_modes.length; n++ )
	{
		if(possible_modes[n].selected)
		{
			selected_mode =possible_modes[n].value;
			found_mode=true;
			break;
		}
	}
	if(!found_mode)
	{
		console.log("unable to determine selected drawmode");
		return;
	}
	console.log("Selected drawmode "+selected_mode);
	set_draw_mode(selected_mode);
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
init_stuff();
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
		let point =vec2(view_port_pos.x, view_port_pos.y)
		let color = getSelectedColor();
		shape_being_drawn.add_point(point,color);
	}

);

