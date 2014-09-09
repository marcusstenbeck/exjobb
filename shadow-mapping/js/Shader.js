'use strict';
(function() {	
	function Shader() {
		
		this.uniform = {};
		this.attribute = {};

		this._boilerplate = [
			'#ifdef GL_ES',
			'precision mediump float;',
			'#endif',
		].join('\n');


		// Vertex shader
		this._vertSrc = [
			'uniform mat4 uP;',
			'uniform mat4 uM;',
			'uniform mat4 uV;',

			'attribute vec3 aVertexPosition;',

			'varying vec4 vPos;',

			'//begin(front)',
			'//end(front)',

			'void main(void) {',
			'	vec4 worldVertexPosition = uM * vec4(aVertexPosition, 1.0);',
			'	vPos = uV * worldVertexPosition;',

			'	//begin(main)',
			'	//end(main)',

			'	gl_Position = uP * vPos;',
			'}'
		].join('\n');


		// Fragment shader
		this._fragSrc = [
			'varying vec4 vPos;',

			'//begin(front)',
			'//end(front)',

			'void main(void) {',

			'	vec4 ambient = vec4(0.0, 0.0, 0.0, 1.0);',
			'	vec4 diffuse = vec4(0.0, 0.0, 0.0, 1.0);',
			'	vec4 specular = vec4(0.0, 0.0, 0.0, 1.0);',
			
			'	//begin(main)',
			'	//end(main)',

			'	gl_FragColor = ambient + diffuse + specular;',
			'}',
		].join('\n');
	}

	Shader.prototype.getVertSource = function() {
		return [this._boilerplate, this._vertSrc].join('\n');
	};

	Shader.prototype.getFragSource = function() {
		return [this._boilerplate, this._fragSrc].join('\n');
	};

	Shader.prototype.setBit = function(shaderType, bit, src) {
		return _getSetBit.apply(this, arguments);
	};

	Shader.prototype.getBit = function(shaderType, bit) {
		return _getSetBit.apply(this, arguments);
	};

	function _getSetBit(shaderType, bit, src) {
		var _shaderSrc = null;
		shaderType = shaderType.toLowerCase();
		if(shaderType === 'fs') _shaderSrc = '_fragSrc';
		if(shaderType === 'vs') _shaderSrc = '_vertSrc';
		if(!_shaderSrc) return;

		
		var strBegin = '//begin(' + bit + ')';
		var strEnd = '//end(' + bit + ')';

		var beginPoint = this[_shaderSrc].indexOf(strBegin);
		var endPoint = this[_shaderSrc].indexOf(strEnd);

		// The opening bit doesn't exist
		if(beginPoint < 0) {
			console.warn('Opening bit not found:', strBegin);
			return;
		}
		// The closing bit doesn't exist
		if(endPoint < 0) {
			console.warn('Closing bit not found:', strBegin);
			return;
		}

		// The insertion point is after the opening bit
		var insertionPoint = beginPoint + strBegin.length;


		// If src is a string we're doing a set, otherwise a get
		if(src) {
			// Pull out the code located before and after the
			// insertion point
			var srcPre = this[_shaderSrc].substring(0, insertionPoint);
			var srcPost = this[_shaderSrc].substring(endPoint, this[_shaderSrc].length);

			// Inject the bit into the shader source
			this[_shaderSrc] = [srcPre, src, srcPost].join('\n');

			return true;
		} else {
			return this[_shaderSrc].substring(beginPoint + strBegin.length, endPoint); 
		}
	}


	function _loadShader(gl, src, type) {
		var shader = gl.createShader(type);

		gl.shaderSource(shader, src);

		gl.compileShader(shader);

		if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
			console.error('Error compiling shader\n', 'Type: ' + type + '\n' , gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return;
		}

		return shader;
	}

	Shader.prototype.compileProgram = function(gl) {


		if(this.program) {
			
		}


		var vs = _loadShader(gl, this.getVertSource(), gl.VERTEX_SHADER);		
		var fs = _loadShader(gl, this.getFragSource(), gl.FRAGMENT_SHADER);		

		var shaderProgram = gl.createProgram();
		
		gl.attachShader(shaderProgram, vs);
		gl.attachShader(shaderProgram, fs);


		gl.linkProgram(shaderProgram);

		if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) && !gl.isContextLost()) {
			console.error('Error linking shader program\n', gl.getProgramInfoLog(shaderProgram));
			gl.deleteProgram(shaderProgram);
			return;
		}


		gl.validateProgram(shaderProgram);

		if(!gl.getProgramParameter(shaderProgram, gl.VALIDATE_STATUS) && !gl.isContextLost()) {
			console.error('Error validating shader program\n', gl.getProgramInfoLog(shaderProgram));
			gl.deleteProgram(shaderProgram);
			return;
		}

		// Program is all good and compiled
		this.program = shaderProgram;

		
		// Update uniform locations
		this.uniform = {};
		var count = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
		for (var i = count - 1; i >= 0; i--) {
			var uniform = gl.getActiveUniform(this.program, i);
			name = uniform.name.replace('[0]', '');
			this.uniform[name] = gl.getUniformLocation(this.program, name);
		};

		// Update attribute locations
		this.attribute = {};
		count = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
		for (var i = count - 1; i >= 0; i--) {
			var attrib = gl.getActiveAttrib(this.program, i);
			this.attribute[attrib.name] = gl.getAttribLocation(this.program, attrib.name);
		};

		return true;
	}

	window.Shader = Shader;
})();