

function getVariableName(str, index = 0) {
	const sindex = str.indexOf("$<", index);
	if(sindex < 0) {
		return null;
	}
	const eindex = str.indexOf(">", sindex);
	if(eindex < 0) {
		return null;
	}
	const key = str.substring(sindex+2, eindex);
	return {key: key, begin: sindex, end: eindex + 1};
}

function getVariableValue(variablesObj, key, repeatObj) {
	if(key.startsWith("_.")) {
		if(repeatObj == null) {
			return null;
		}
		const val = repeatObj[key.substring(2, key.length)];
		return val;
	}
	var val = variablesObj[key];
	if(val != null)
		return val;
	var index = key.indexOf(".");
	if(index > 0) {
		var prefix = key.substring(0, index);
		val = variablesObj[prefix];
		if(val == null)
			return null;
		return getVariableValue(val, key.substring(index + 1), repeatObj);
	}
	return null;
}

function variablesReplace(str, variablesObj, repeatObj) {
	var varObj = getVariableName(str);
	while(varObj != null) {
		var val = getVariableValue(variablesObj, varObj.key, repeatObj);
		var begin = varObj.begin + 1;
		if(val != null) {
			str = str.substring(0, varObj.begin) + val + str.substring(varObj.end);
			begin = varObj.begin;
		} else {
			console.error("Fail to get variable: " + varObj.key + " from str: " + str);
		}
		varObj = getVariableName(str, begin);
	}
	return str;
}

function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]"
}

function cloneObj(obj) {
	if(obj == null) {
		return null;
	} else if(isString(obj)) {
		return obj;
	} else if(Array.isArray(obj)) {
		const array = new Array();
		for(let i = 0; i < obj.length; i++) {
			array.push(cloneObj(obj[i]));
		}
		return array;
	} else {
		const newObj = new Object();
	    for(const [key, value] of Object.entries(obj)) {
			newObj[key] = cloneObj(value);
	    }
		return newObj;
	}
}

function buildRepeatArray(variablesObj, repeatPath) {
	const array = new Array();
		
	var index = repeatPath.indexOf(".");
	if(index > 0) {	
		const prefix = repeatPath.substring(0, index);
		const postfix = repeatPath.substring(index + 1);
		const varObj = variablesObj[prefix];
		if(Array.isArray(varObj)) {
			for(let i = 0; i < varObj.length; i++) {
				const childArray = buildRepeatArray(varObj[i], postfix);
				if(childArray != null) {
					for(let j = 0; j < childArray.length; j++) {
						array.push(childArray[j]);
					}
				}
			}
		} else {
			return buildRepeatArray(varObj, postfix);
		}
	} else {	
	    const varObj = variablesObj[repeatPath];
	    if(Array.isArray(varObj)) {
		    for(let i = 0; i < varObj.length; i++) {
			    array.push(varObj[i]);
		    }
	    } else {
		    for(const [key, value] of Object.entries(varObj)) {
			    const repeatObj = new Object();
				repeatObj[key] = value;
			    repeatObj["key"] = key;
			    repeatObj["value"] = value;
			    array.push(repeatObj);
		    }
	    }
	}
	return array;
}

function processRepeat(variablesObj, obj, repeatPath, dataDir, repeatObj = null) {
	const array = new Array();
	if(repeatObj == null) {
		repeatObj = new Object();
	}
	const varArray = buildRepeatArray(variablesObj, repeatPath)
	for(let i = 0; i < varArray.length; i++) {
		repeatObj = varArray[i];
		var elemObj = cloneObj(obj);
		elemObj = processObj(variablesObj, elemObj, dataDir, repeatObj);
		array.push(elemObj);
	}
	return array;
}

function processArray(variablesObj, array, dataDir, repeatObj) {
	for(let i = 0; i < array.length; i++) {
		const child = array[i];
		//console.log("child: " + child);
		array[i] = processObj(variablesObj, child, dataDir, repeatObj);
	}
	return array;
}

function processObj(variablesObj, obj, dataDir, repeatObj = null) {
	if(obj == null) {
		return null;
	} else if(isString(obj)) {
		//console.log("string: " + obj);
		return variablesReplace(obj, variablesObj, repeatObj);
	} else if(Array.isArray(obj)) {
		return processArray(variablesObj, obj, dataDir, repeatObj);
	} else if("_Repeat" in obj) {
		return processRepeat(variablesObj, obj["_Element"], obj["_Repeat"], dataDir, repeatObj)
	} else {
	    for(const [key, value] of Object.entries(obj)) {
		    //console.log("key: " + key + ", value: " + value);
			obj[key] = processObj(variablesObj, value, dataDir, repeatObj);
	    }
		return obj;
	}
}

console.log("argv: " + process.argv);
if (process.argv.length != 5) {
	console.error("arguments input: <template json file> <data json file> <output canvas json file>");
	process.exit(1);
}
const inputTemplate = process.argv[2];
const inputMetaData = process.argv[3];
const output = process.argv[4];
console.log("start process file, template: " + inputTemplate + ", metadata: " + inputMetaData + ", output: " + output);

const path = require('path');
const fs = require('fs');
const crypto = require("crypto");

const templateDir = path.dirname(inputTemplate);
const metadataDir = path.dirname(inputMetaData);

const jsonMetaData = fs.readFileSync(inputMetaData);
const metadata = JSON.parse(jsonMetaData);

const jsonTemplate = fs.readFileSync(inputTemplate);
const template = JSON.parse(jsonTemplate);

processObj(metadata, template, templateDir);

const jsonOutput = JSON.stringify(template);
fs.writeFile(output, jsonOutput, function(err) {
	if(err) throw err;
});

console.log("end process canvas: " + output);