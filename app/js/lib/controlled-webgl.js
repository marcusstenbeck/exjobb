'use strict';

var strBoilerplate = [
		'',
		'################################',
		'##  CONTROLLED WEBGL CONTEXT  ##',
		'###################### 0.0.1 ###',
		''
	].join('\n');


// Create a map of stuff that we're gonna choke
var choke = (typeof webglProfile !== 'undefined') ? (webglProfile) : ({});

// Array where we'll store all log events
var log = [];

var loggingFn = console.log;
var warningFn = console.warn || console.log;
var errorFn = console.error || console.log;

function wrapLog(fn, str) {
	return function() {
		var line = str ? [str] : [];
		for (var i = 0; i < arguments.length; i++) {
			line.push(arguments[i]);
		};
		if(line.length > 0) log.push(line);

		// Chrome already prints WebGL warnings automatically
		if(typeof arguments[0] === 'string' && arguments[0].slice(0, 6) === 'WebGL:') return;

		if(log.length >= 15) throw 'Max 15 log entries allowed.';

		fn.apply(this, arguments);
	};
};

console.log = wrapLog(loggingFn);
console.warn = wrapLog(warningFn, 'WARNING: ');
console.error = wrapLog(errorFn, 'ERROR: ');

function convertArrayToString(arr) {
	return Array.prototype.join.call(arr);
}

function convertObjectToString(obj) {
	var str = '';
	
	var key;
	var value;
	for(key in obj) {

		switch(typeof obj[key]) {
			case 'string':
			case 'number':
			case 'function':
			case 'undefined':
				value = obj[key];
				break;
			case 'object':
				if(obj[key] === null)
					value = 'null';
				else if(obj[key] instanceof Array
					|| obj[key] instanceof Uint8Array
					|| obj[key] instanceof Uint8ClampedArray
					|| obj[key] instanceof Uint16Array
					|| obj[key] instanceof Uint32Array
					|| obj[key] instanceof Int8Array
					|| obj[key] instanceof Int16Array
					|| obj[key] instanceof Int32Array
					|| obj[key] instanceof Float32Array
					|| obj[key] instanceof Float64Array) value = convertArrayToString(obj[key]);
				else value = '{' + convertObjectToString(obj[key]) + '}';
				break;
		}
		
		str += key + ':' + value + ',';
	}

	return str;
}

function getImplementationValues(gl) {
	return {
		devicePixelRatio: devicePixelRatio,
		screen: screen,
		userAgent: navigator.userAgent,
		glValues: {
			SUBPIXEL_BITS:						gl.getParameter(gl.SUBPIXEL_BITS),
			MAX_TEXTURE_SIZE:					gl.getParameter(gl.MAX_TEXTURE_SIZE),
			MAX_CUBE_MAP_TEXTURE_SIZE:			gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
			SAMPLE_BUFFERS:						gl.getParameter(gl.SAMPLE_BUFFERS),
			SAMPLES:							gl.getParameter(gl.SAMPLES),
			RENDERER:							gl.getParameter(gl.RENDERER),
			SHADING_LANGUAGE_VERSION:			gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
			VENDOR:								gl.getParameter(gl.VENDOR),
			VERSION:							gl.getParameter(gl.VERSION),
			MAX_VERTEX_ATTRIBS:					gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
			MAX_VERTEX_UNIFORM_VECTORS:			gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
			MAX_VARYING_VECTORS:				gl.getParameter(gl.MAX_VARYING_VECTORS),
			MAX_COMBINED_TEXTURE_IMAGE_UNITS:	gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
			MAX_VERTEX_TEXTURE_IMAGE_UNITS:		gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
			MAX_TEXTURE_IMAGE_UNITS:			gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
			MAX_FRAGMENT_UNIFORM_VECTORS:		gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
			MAX_RENDERBUFFER_SIZE:				gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
			RED_BITS:							gl.getParameter(gl.RED_BITS),
			GREEN_BITS:							gl.getParameter(gl.GREEN_BITS),
			BLUE_BITS:							gl.getParameter(gl.BLUE_BITS),
			ALPHA_BITS:							gl.getParameter(gl.ALPHA_BITS),
			DEPTH_BITS:							gl.getParameter(gl.DEPTH_BITS),
			STENCIL_BITS:						gl.getParameter(gl.STENCIL_BITS),
			// IMPLEMENTATION_COLOR_READ_TYPE:		gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE),
			// IMPLEMENTATION_COLOR_READ_FORMAT:	gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT),
			
			// These return typed arrays, so stringify
			MAX_VIEWPORT_DIMS:			convertArrayToString(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
			ALIASED_POINT_SIZE_RANGE:	convertArrayToString(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)),
			ALIASED_LINE_WIDTH_RANGE:	convertArrayToString(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)),
			COMPRESSED_TEXTURE_FORMATS:	convertArrayToString(gl.getParameter(gl.COMPRESSED_TEXTURE_FORMATS)),

			// Get shader precision formats
			VERTEX_SHADER_PRECISION_FORMAT_LOW_FLOAT:		shaderPrecisionFormat(gl.VERTEX_SHADER, gl.LOW_FLOAT),
			VERTEX_SHADER_PRECISION_FORMAT_MEDIUM_FLOAT:	shaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_FLOAT),
			VERTEX_SHADER_PRECISION_FORMAT_HIGH_FLOAT:		shaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT),
			VERTEX_SHADER_PRECISION_FORMAT_LOW_INT:			shaderPrecisionFormat(gl.VERTEX_SHADER, gl.LOW_INT),
			VERTEX_SHADER_PRECISION_FORMAT_MEDIUM_INT:		shaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_INT),
			VERTEX_SHADER_PRECISION_FORMAT_HIGH_INT:		shaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_INT),
			FRAGMENT_SHADER_PRECISION_FORMAT_LOW_FLOAT:		shaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_FLOAT),
			FRAGMENT_SHADER_PRECISION_FORMAT_MEDIUM_FLOAT:	shaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT),
			FRAGMENT_SHADER_PRECISION_FORMAT_HIGH_FLOAT:	shaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT),
			FRAGMENT_SHADER_PRECISION_FORMAT_LOW_INT:		shaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_INT),
			FRAGMENT_SHADER_PRECISION_FORMAT_MEDIUM_INT:	shaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_INT),
			FRAGMENT_SHADER_PRECISION_FORMAT_HIGH_INT:		shaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_INT),
		},
		glSupportedExtensions: gl.getSupportedExtensions(),
		glContextName: gl.contextName
	};
}


function shaderPrecisionFormat(shader_enum, format_enum) {
	var fmt = undefined;

	try {
		JSON.stringify(gl.getShaderPrecisionFormat(shader_enum, format_enum))
	} catch(e) {}

	if(!fmt) fmt = undefined;

	return fmt;
}

// Shim the canvas
var getContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(name) {
	if(name.indexOf('webgl') !== -1) {
		
		var gl = getContext.apply(this, arguments);

		// Get the device capabilities
		gl.deviceImplementationValues = getImplementationValues(gl);

		gl = makeControlledWebGLContext(gl);

		gl.contextName = arguments[0];

		if(gl) {
			console.log(strBoilerplate);
			//console.log('Implementation Limits\n', choke);
		}

		return gl;
	}
	return getContext.apply(this, arguments);
}

function logSupportedExtensions(gl) {
	console.log(gl.getSupportedExtensions());
}

function logContextAttributes(gl) {
	var contextAttributes = gl.getContextAttributes();

	var strAttrs = [
		'',
		'Context Attributes',
		'',

		// GLboolean alpha = true;
		'alpha: ' + contextAttributes.alpha,

		// GLboolean depth = true;
		'depth: ' + contextAttributes.depth,

		// GLboolean stencil = false;
		'stencil: ' + contextAttributes.stencil,

		// GLboolean antialias = true;
		'antialias: ' + contextAttributes.antialias,

		// GLboolean premultipliedAlpha = true;
		'premultipliedAlpha: ' + contextAttributes.premultipliedAlpha,

		// GLboolean preserveDrawingBuffer = false;
		'preserveDrawingBuffer: ' + contextAttributes.preserveDrawingBuffer,

		// GLboolean preferLowPowerToHighPerformance = false;
		'preferLowPowerToHighPerformance: ' + contextAttributes.preferLowPowerToHighPerformance,

		// GLboolean failIfMajorPerformanceCaveat = false;
		'failIfMajorPerformanceCaveat: ' + contextAttributes.failIfMajorPerformanceCaveat,

	].join('\n');

	console.log(strAttrs);
}

function makeControlledWebGLContext(gl) {

	// Make a function that calls a WebGL function and
	// then calls getError()
	function makeFunctionWrapper(gl, functionName) {
		gl['_'+functionName] = gl[functionName];
		return function() {
			var result = gl['_'+functionName].apply(gl, arguments);
			var err = gl.getError();
			if(err != 0) {
				console.warn('WebGL:', getGlEnumName(err) + ':', functionName + ':');
			}
			return result;
		}
	}

	
	var wrapper = {};
	for(var propertyName in gl) {
		if(typeof gl[propertyName] === 'function') {
			if(propertyName !== 'getError') {
				wrapper[propertyName] = makeFunctionWrapper(gl, propertyName);
			}
		} else {
			wrapper[propertyName] = gl[propertyName];
		}
	}

	// ###  ONLY USE `wrapper` (not `gl`) AFTER THIS POINT  ###

	/**
	 *  Override max vertex attribs
	 */

	// Replace the getParameter function
	var getParameter = wrapper.getParameter;
	wrapper.getParameter = (function() {
		return function() {
			var parameterEnum = arguments[0];

			var enumName = getGlEnumName(parameterEnum).toUpperCase();

			// Is it a choke parameter?
			if(choke[enumName]) {
				return choke[enumName];
			}
			
			// Not handled in any other way?
			// Pass to original function
			return getParameter.apply(wrapper, arguments);
		}
	})();


	// Enforce limit when trying to exceed it
	var linkProgram = wrapper.linkProgram;
	wrapper.linkProgram = (function() {
		return function() {
			// Start by linking program so we can check it
			var rtn = linkProgram.apply(wrapper, arguments);
			
			// First argument shall be a WebGLProgram
			var program = arguments[0];
			if(program.constructor !== WebGLProgram) {
				// The first argument is not a WebGLProgram
				// so there should already be webgl errors
				// from trying to link it
				return rtn;
			}

			// Get the number of active attributes
			var activeAttributes = wrapper.getProgramParameter(program, wrapper.ACTIVE_ATTRIBUTES);

			// Be angry when active attribs exceed choke
			if(activeAttributes > choke['MAX_VERTEX_ATTRIBS']) {
				throw createError([
					'[IN USE: ' + activeAttributes + ', VIRTUAL LIMIT: ' + choke['MAX_VERTEX_ATTRIBS'] + ']',
					' ERROR: Implementation limit of ' + choke[wrapper.MAX_VERTEX_ATTRIBS] + ' MAX_VERTEX_ATTRIBS (e.g., number of generic plus conventional active vec4 attributes) exceeded, shader uses up to vec4 attribute ' + (activeAttributes-1) + '.',
				].join('\n'));
			}

			return rtn;
		}
	})();


	/**
	 *  Override getExtension()
	 */
	var getExtension = wrapper.getExtension;
	wrapper.getExtension = (function() {
		return function() {
			var extensionName = arguments[0].toUpperCase();

			// Is the extension blocked?
			if(typeof choke[extensionName] !== 'undefined' && !choke[extensionName]) {
				console.warn('Blocked request to activate extension', extensionName);
				return null;
			}
			
			// Not blocked?
			// Pass to original function
			console.log('Allowed request to activate extension', extensionName);
			return getExtension.apply(wrapper, arguments);
		}
	})();


	// /**
	//  *  Override getSupportedExtensions()
	//  */
	// var getSupportedExtensions = wrapper.getSupportedExtensions;
	// wrapper.getSupportedExtensions = (function() {
	// 	return function() {
	// 		var extensionName = arguments[0].toUpperCase();

	// 		// Is the extension blocked?
	// 		if(typeof choke[extensionName] !== 'undefined' && !choke[extensionName]) {
	// 			console.warn('Blocked request to activate extension', extensionName);
	// 			return null;
	// 		}
			
	// 		// Not blocked?
	// 		// Pass to original function
	// 		console.log('Allowed request to activate extension', extensionName);
	// 		return getSupportedExtensions.apply(wrapper, arguments);
	// 	}
	// })();



	/**
	 *  Implementation limits
	 */
	wrapper.getImplementationValues = function() {
		return getImplementationValues(wrapper);
	};

	/**
	 *  Implementation limits
	 */
	// wrapper.getImplementationLimits = function() {
	// 	return {
	// 		MAX_VERTEX_ATTRIBS: wrapper.getParameter(wrapper.MAX_VERTEX_ATTRIBS),
	// 	}
	// };

	return wrapper;
}

function createError(str) {
	var e = new Error(str);
	log.push(e);
	return e;
}


var glEnumNames = {
	34921: 'MAX_VERTEX_ATTRIBS',
	0: 'NO_ERROR',
    0x0500: 'INVALID_ENUM',
    0x0501: 'INVALID_VALUE',
    0x0502: 'INVALID_OPERATION',
    0x0505: 'OUT_OF_MEMORY',
    0x0506: 'INVALID_FRAMEBUFFER_OPERATION',
};

function getGlEnumName(value) {
	if(value === undefined || typeof value !== 'number') return 'UNDEFINED';
	var name = glEnumNames[value];
	return (name !== undefined) ? (name) : ("/*UNKNOWN WebGL ENUM*/ 0x" + value.toString(16) + "");
}