console.trace("Started");
const canvas = document.getElementById('draw_area');
const     gl = WebGLUtils.setupWebGL(canvas);
const program = initShaders(gl,"vert","frag");

gl.useProgram(program);
gl.viewport( 0.0 ,0.0, canvas.width,canvas.height)
gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

const vertices = new Float32Array(
    [0.0,0.0, //middle
    1.0,0.0, // right
    1.0,1.0,] //top right
)

const colors = [
        CommonColors.red,
        CommonColors.blue,
        CommonColors.green];

send_floats_to_attribute_buffer("a_Position",vertices,2,gl,program);
send_floats_to_attribute_buffer("a_Color",flatten(colors),4,gl,program);
gl.clear(gl.COLOR_BUFFER_BIT); 
gl.drawArrays(gl.TRIANGLES,0,3);
console.trace("Ended");