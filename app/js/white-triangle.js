(function () {

	var verts = [
			-1.0,  -1.0,   0.0,

			-0.75,  1.0,   0.0,
			-0.5,   1.0,   0.0,
			-0.25,  1.0,   0.0,
			 0.0,   1.0,   0.0,
			 0.25,  1.0,   0.0,
			 0.5,   1.0,   0.0,
			 0.75,  1.0,   0.0,

			 1.0,   1.0,   0.0,

			 1.0,   0.75,  0.0,
			 1.0,   0.5,   0.0,
			 1.0,   0.25,  0.0,
			 1.0,  -0.25,  0.0,
			 1.0,   0.0,   0.0,
			 1.0,  -0.5,   0.0,
			 1.0,  -0.75,  0.0
		];

	var idx = [
		0, 1,
		0, 2,
		0, 3,
		0, 4,
		0, 5,
		0, 6,
		0, 7,
		0, 8,
		0, 9,
		0, 10,
		0, 11,
		0, 12,
		0, 13,
		0, 14,
		0, 15
	];

	var shaderBoilerPlate = '\n\
#ifdef GL_ES  \n\
precision mediump float;  \n\
#endif \n\
';

	var srcVertexShader = shaderBoilerPlate + '\n\
attribute vec3 aVertexPosition;  \n\
\n\
void main(void) {  \n\
	gl_Position = vec4(aVertexPosition, 1.0);  \n\
}  \n\
';

	var srcFragmentShader = shaderBoilerPlate + '\n\
void main(void) {  \n\
	gl_FragColor = vec4(1.0);  \n\
}  \n\
';



	function loadShader(src, type) {
		var shader = gl.createShader(type);

		gl.shaderSource(shader, src);

		gl.compileShader(shader);

		if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
			console.error('Error compiling shader\n', 'Type: ' + type + '\n' , gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	function initShaders(gl, vSrc, fSrc) {
		var vs = loadShader(vSrc, gl.VERTEX_SHADER);		
		var fs = loadShader(fSrc, gl.FRAGMENT_SHADER);		

		var shaderProgram = gl.createProgram();
		
		gl.attachShader(shaderProgram, vs);
		gl.attachShader(shaderProgram, fs);


		gl.linkProgram(shaderProgram);

		if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) && !gl.isContextLost()) {
			console.error('Error linking shader program\n', gl.getProgramInfoLog(shaderProgram));
			gl.deleteProgram(shaderProgram);
			return null;
		}


		gl.validateProgram(shaderProgram);

		if(!gl.getProgramParameter(shaderProgram, gl.VALIDATE_STATUS) && !gl.isContextLost()) {
			console.error('Error validating shader program\n', gl.getProgramInfoLog(shaderProgram));
			gl.deleteProgram(shaderProgram);
			return null;
		}

		return shaderProgram;
	}


	function init() {
		var canvasWidth = 512;
		var canvasHeight = 512;
		document.write('<canvas width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas>')

		var canv = document.getElementsByTagName('canvas')[0];

		var requestedContextAttributes = {
			antialias: false
		};

		try {
			var gl = canv.getContext('webgl', requestedContextAttributes);
		} catch (e) {
			console.error('WebGL is not supported');
		}

		if(gl) {
			console.log('WebGL context created', gl.getContextAttributes());

			var contextAttributes = gl.getContextAttributes();

			// GLboolean alpha = true;
			console.log('alpha: ', contextAttributes.alpha);
			// GLboolean depth = true;
			console.log('depth: ', contextAttributes.depth);
			// GLboolean stencil = false;
			console.log('stencil: ', contextAttributes.stencil);
			// GLboolean antialias = true;
			console.log('antialias: ', contextAttributes.antialias);
			// GLboolean premultipliedAlpha = true;
			console.log('premultipliedAlpha: ', contextAttributes.premultipliedAlpha);
			// GLboolean preserveDrawingBuffer = false;
			console.log('preserveDrawingBuffer: ', contextAttributes.preserveDrawingBuffer);
			// GLboolean preferLowPowerToHighPerformance = false;
			console.log('preferLowPowerToHighPerformance: ', contextAttributes.preferLowPowerToHighPerformance);
			// GLboolean failIfMajorPerformanceCaveat = false;
			console.log('failIfMajorPerformanceCaveat: ', contextAttributes.failIfMajorPerformanceCaveat);

			gl._createBuffer = gl.createBuffer;
			gl.createBuffer = function() {
				var ret = this._createBuffer();
				console.log('gl.createBuffer() ->', ret);
				return ret;
			}

			return gl;
		}

		return null;
	}


	var red = 0;
	var time = 0;
	function update(tpf) {
		time = time + tpf;

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.uniform1f(shaderProgram.uTime, time);

		document.getElementById('tpf').innerHTML = Math.floor(tpf);
	}


	function draw(tpf) {
		gl.drawElements(gl.LINES, idx.length, gl.UNSIGNED_SHORT, 0);
	}

	


	var gl = init();
	

	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);


	var shaderProgram = initShaders(gl, srcVertexShader, srcFragmentShader);
	gl.useProgram(shaderProgram);

	shaderProgram.uTime = gl.getUniformLocation(shaderProgram, 'uTime');
	gl.uniform1f(shaderProgram.uTime, 0.0);

	shaderProgram.aVertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
	gl.enableVertexAttribArray(shaderProgram.aVertexPosition);
	gl.vertexAttribPointer(
							shaderProgram.aVertexPosition,
							3,
							gl.FLOAT,
							false,
							0,
							0
						);

	var iBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(idx), gl.STATIC_DRAW);

// 	void vertexAttribPointer(uint index, int size, enum type, bool normalized, long stride, long offset)
// index: [0, MAX_VERTEX_ATTRIBS - 1]
// type: BYTE, SHORT, UNSIGNED_{BYTE, SHORT}, FIXED, FLOAT
// stride: [0, 255]
// offset, stride: must be a multiple of the type size in WebGL



	var lastTime = 0;
	var tpf = 0;
	document.write('<div id="tpf"></div>');
	(function loop(time) {
		window.requestAnimationFrame(loop);
		tpf = time - lastTime || 0;
		lastTime = time;
		
		update(tpf);
		draw();
	})();

}).call(this)