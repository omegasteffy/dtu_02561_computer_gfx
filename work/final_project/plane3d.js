
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
				x.indecies[idx++] = b + 1
				x.indecies[idx++] = b;
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