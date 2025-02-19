

function getVariableName(str, index = -1) {
	var sindex = -1;
	if(index == -1)
		sindex = str.lastIndexOf("$<");
	else
	    sindex = str.lastIndexOf("$<", index);
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

function getValue(variablesObj, key) {
	if(variablesObj == null) {
		return null;
	} else if(Array.isArray(variablesObj)) {
		const array = new Array();
		for(let i = 0; i < variablesObj.length; i++) {
			const varObj = variablesObj[i];
			if(varObj == null) {
				continue;
			}
			const val = getValue(varObj, key);
			if(val != null) {
				if(Array.isArray(val)) {
					for(let j = 0; j < val.length; j++) {
						if(val[j] != null) {
							array.push(val[j]);
						}
					}
				} else {
					array.push(val);
				}
			} else {
				console.log("getValue: key: " + key + ", varObj: " + JSON.stringify(varObj));
			}
		}
		if(array.length == 0) {
			return null;
		}
		return array;
	} else {
		return variablesObj[key];
	}
}

function getVariableValue2(variablesObj, key) {
	var index = key.indexOf(".");
	if(index > 0) {
		var prefix = key.substring(0, index);
		val = getValue(variablesObj, prefix);
		if(val == null) {
			console.log("getVariableValue: key: " + key + " prefix: " + prefix + ", variablesObj: " + JSON.stringify(variablesObj));
			return null;
		}
		return getVariableValue2(val, key.substring(index + 1));
	} else {
		return getValue(variablesObj, key);
	}	
}

function getVariableValue(variablesObj, key, repeatObj) {
	if(key.startsWith("_.")) {
		if(repeatObj == null) {
			return null;
		}
		key = key.substring(2, key.length);
		const val = getVariableValue(repeatObj, key);
		if(val == null) {
			console.log("getVariableValue: key: " + key + ", repeatObj: " + JSON.stringify(repeatObj));
		}
		return val;
	} else {
		return getVariableValue2(variablesObj, key);
	}
}

function variablesReplace(str, variablesObj, repeatObj) {
	var varObj = getVariableName(str);
	if(varObj == null) {
		return str;
	}
	var val = getVariableValue(variablesObj, varObj.key, repeatObj);
	var end = varObj.end - 1;
	if(val == null) {
		console.error("Fail to get variable: " + varObj.key + " from str: " + str);
		return str;
	}
	const prefix = str.substring(0, varObj.begin);
	const surfix = str.substring(varObj.end);
	const str2 = str.substring(0, varObj.begin) + "########" + str.substring(varObj.end);
	end = varObj.end;
	varObj = getVariableName(str2, end);
	if(varObj == null) {
		return prefix + val + surfix;
	}
	if(!varObj.key.includes("########") || !Array.isArray(val)) {
		return	variablesReplace(prefix + val + surfix, variablesObj, repeatObj);
	}
	const array = new Array();
	for(let i = 0; i < val.length; i++) {
		const itemKey = varObj.key.replace("########", val[i])
		const itemVal = getVariableValue(variablesObj, itemKey, repeatObj);
		array.push(itemVal);
	}
	return str2.substring(0, varObj.begin) + array + str2.substring(varObj.end);
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
