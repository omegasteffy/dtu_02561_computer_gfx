//Globals
let gl;
let program;
let uniforms;
let stuff;


/**
 * Create coordinates for a rectangle
 */
function rectangle(gl) {
	var x = { "type": "rectangle" };
	x.drawtype = gl.TRIANGLE_STRIP;
	x.vertices = new Float32Array([
		-4, -1, -1,
		4, -1, -1,
		-4, -1, -21,
		4, -1, -21
		]);
	x.drawCount = 4;
	return x;
}

function plane_3d(gl,no_rows,no_columns)
{
	if ( (no_rows<2) || (no_columns < 2) )
	{
		throw ("Plane must have at least 2x2 points");
	}
	let x = {};

	//fill out points
	const row_step = 1/(no_rows-1);
	const col_step = 1/(no_columns-1);
	x.points = new Float32Array(no_rows*no_columns*2);
	x.points2 = new Array();
	{	
		let idx=0;
		for(let r = 0; r <  no_rows; r++)
		{
			const row_index_offset = r * no_columns;
			for(let c = 0; c < no_columns; c++)
			{
				x.points2[row_index_offset+c] = vec2(c*col_step,r*row_step);
				x.points[idx++]= c*col_step;
				x.points[idx++]= r*row_step;

			}
		}
	}
	x.countTriangles = (no_rows -1) * (no_columns-1) * 2 ; //two triangles per square
	x.indecies = new Uint16Array(3*x.countTriangles);
	x.line_indecies = new Uint16Array(6*x.countTriangles);
	x.indecies2 = new Array();

	{
		let idx=0;
		let idx_lines=0;
		for ( let r=0; r < (no_rows-1) ; r++ )
		{
			const row_index_offset = r * no_columns;
			for(let c=0 ; c < (no_columns-1); c++)
			{
				const b =row_index_offset+c ;
				x.indecies2.push (vec3( b , b+1 , b+no_columns ));
				
				// b---b+1
				// |  /
				// |/b+row
				x.indecies[idx++] = b;
				x.indecies[idx++] = b+1;
				x.indecies[idx++] = b+no_columns;
				
				// b+1     / |
				//        /  |
				// b+row /---| b+row +1 
				x.indecies2.push (vec3( b+1 , b+no_columns+1 , b+no_columns ));
				x.indecies[idx++] = b+1;
				x.indecies[idx++] = b+no_columns;
				x.indecies[idx++] = b+no_columns+1;

				// b --> b+1
				x.line_indecies[idx_lines++] = b;
				x.line_indecies[idx_lines++] = b+1
				
				//    b+1
				//  /
				// b+row
				x.line_indecies[idx_lines++] = b+1;
				x.line_indecies[idx_lines++] = b+no_columns;
				// b1
				// |
				// b+row
				x.line_indecies[idx_lines++] = b+no_columns;
				x.line_indecies[idx_lines++] = b;

				const last_col = ( r == no_rows-2);
				if(last_col)
				{	
					// b+row  <-- b+1+row
					x.line_indecies[idx_lines++] = b+no_columns+1;
					x.line_indecies[idx_lines++] = b+no_columns;
				}
				const last_in_row = (c == no_columns-2);
				if(last_in_row)
				{
					// b+1 
					// |
					// b+1+row
					x.line_indecies[idx_lines++] = b+1;
					x.line_indecies[idx_lines++] = b+no_columns+1;
				}

			}


		}
	}
	return x;
}

setup_stuff();

function setup_stuff()
{
	console.trace("Started");	
	const canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas, { alpha: false });

	program = initShaders(gl, "vert", "frag");
	program_coord = initShaders(gl, "simple_vert", "simple_frag");
	gl.useProgram(program);
	uniforms=cacheUniformLocations(gl, program);
	let uniforms_coord=cacheUniformLocations(gl, program_coord);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	let eyePos = vec3(.5,.3,-0.6); // this is apparently what is meant by default
	
	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.5, 0.3, 0.0);// for isometric we should look at origo

	let cameraMatrix = lookAt(eyePos, cameraTarget, upVec);

	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 0.1;
	let far = 200.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);

//	gl.enable(gl.DEPTH_TEST);
//	gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

	trsMatrix = mat4(); // no transformations just yet
	let coord = coordinateSystem(gl);
	gl.useProgram(program_coord);
	gl.uniformMatrix4fv(uniforms_coord.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms_coord.camera_Matrix, false, flatten(cameraMatrix));
	gl.uniformMatrix4fv(uniforms_coord.trsMatrix, false, flatten(trsMatrix));

	gl.clear(gl.COLOR_BUFFER_BIT );
	send_array_to_attribute_buffer("a_Position", coord.points, 3, gl, program);
	gl.drawArrays(gl.LINES, 0, coord.drawCount);
	gl.useProgram(program);
	trsMatrix=scalem(1.0,1.0,5);
	gl.uniformMatrix4fv(uniforms.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(cameraMatrix));
	gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));

	stuff = plane_3d(gl,50,10);
	send_floats_to_attribute_buffer("a_Position", stuff.points, 2, gl, program);

	//  //gl.drawArrays(gl.LINE_STRIP, 0,6);
	// //return;
	// // Create an empty buffer object to store Index buffer
	// let index_buffer = gl.createBuffer();

	// //// Bind appropriate array buffer to it
	// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

	// //// Pass the vertex data to the buffer
	// gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, stuff.indecies, gl.STATIC_DRAW);

	// //// Draw the triangle
	// gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);

	send_floats_to_attribute_buffer("a_Position", stuff.points, 2, gl, program);
	let index_buffer2 = gl.createBuffer();

	//// Bind appropriate array buffer to it
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer2);

	//// Pass the vertex data to the buffer
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, stuff.line_indecies, gl.STATIC_DRAW);

	//// Draw the triangle
	gl.drawElements(gl.LINES, stuff.line_indecies.length, gl.UNSIGNED_SHORT, 0);

//	gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectSpec.drawCount);
//	render(); // no need for since we only have a static image
}


function render()
{	

	gl.clear(gl.COLOR_BUFFER_BIT);
//	gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectSpec.drawCount);
gl.drawElements(gl.TRIANGLES, stuff.indecies.length/3, gl.UNSIGNED_SHORT, 0);
	requestAnimationFrame(render); 
}