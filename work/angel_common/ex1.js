function stuff()
{
	console.trace("Started");
	alert("hello");
	var canvas = document.getElementById('draw_area');
	var gl = canvas.getContext("webgl2");
	gl.clearColor(.3,.1,0.4 ,0.2);
	gl.clear(gl.COLOR_BUFFER_BIT);
	var hat =2;
}