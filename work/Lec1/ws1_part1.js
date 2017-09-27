console.trace("Started");
function start_code_behind()
{
	var canvas = document.getElementById('draw_area');
	var gl = WebGLUtils.setupWebGL(canvas); //found in
	
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	console.trace("Ended");
}