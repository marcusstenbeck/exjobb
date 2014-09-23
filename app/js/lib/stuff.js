var UP_VECTOR = vec3.fromValues(0, 1, 0);

function bindScene(gl, shader, vData) {

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vData.vertices), gl.STATIC_DRAW);
	
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(vData.indices), gl.STATIC_DRAW);
	
	var FLOAT_WIDTH = 4;
	var theStride = (3+2+3) * FLOAT_WIDTH;
	
	shader.attribute.aVertexPosition = gl.getAttribLocation(shader.program, 'aVertexPosition');
	shader.attribute.aVertexTexCoord = gl.getAttribLocation(shader.program, 'aVertexTexCoord');
	shader.attribute.aVertexNormal = gl.getAttribLocation(shader.program, 'aVertexNormal');
	

	if(shader.attribute.aVertexPosition != -1) {
		gl.enableVertexAttribArray(shader.attribute.aVertexPosition);
		gl.vertexAttribPointer(
			shader.attribute.aVertexPosition,
			3,
			gl.FLOAT,
			false,
			theStride,
			0
		);
	}
	
	if(shader.attribute.aVertexTexCoord != -1) {
		gl.enableVertexAttribArray(shader.attribute.aVertexTexCoord);
		gl.vertexAttribPointer(
			shader.attribute.aVertexTexCoord,
			2,
			gl.FLOAT,
			false,
			theStride,
			3 * FLOAT_WIDTH
		);
	}

	
	if(shader.attribute.aVertexNormal != -1) {
		gl.enableVertexAttribArray(shader.attribute.aVertexNormal);
		gl.vertexAttribPointer(
			shader.attribute.aVertexNormal,
			3,
			gl.FLOAT,
			false,
			theStride,
			(2+3) * FLOAT_WIDTH
		);
	}
}