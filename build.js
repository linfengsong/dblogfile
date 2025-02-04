
function comparePosition( a, b ) { 
  if ( a.position.top < b.position.top ){
    return -1;
  }
  if ( a.position.left < b.position.left ){
    return 1;
  }
  return 0;
}

function getVariableName(str, index = 0) {
	const sindex = str.indexOf("$[", index);
	if(sindex < 0) {
		return null;
	}
	const eindex = str.indexOf("]", sindex);
	if(eindex < 0) {
		return null;
	}
	const key = str.substring(sindex+2, eindex);
	return {key: key, begin: sindex, end: eindex + 1};
}

function createVariableObject(variablesObj, newVariablesObj, repeatObj) {
	const rtnObj = new Object();
	const varsKeys = Object.keys(variablesObj);
	for(let i = 0; i < varsKeys.length; i++) {
		rtnObj[varsKeys[i]] = variablesObj[varsKeys[i]];
	}
	if(repeatObj != null) {
		const repeatVarsKeys = Object.keys(repeatObj);
		for(let i = 0; i < repeatVarsKeys.length; i++) {
			rtnObj[repeatVarsKeys[i]] = repeatObj[repeatVarsKeys[i]];
		}
	}
	const newVarsKeys = Object.keys(newVariablesObj);
	for(let i = 0; i < newVarsKeys.length; i++) {
		rtnObj[newVarsKeys[i]] = newVariablesObj[newVarsKeys[i]];
	}
	return rtnObj;
}

function elementExpressionReplace(exp, variablesObj) {
	var varObj = getVariableName(exp);
	while(varObj != null) {
		var val = variablesObj[varObj.key];
		var begin = varObj.begin + 1;
		if(val != null) {
			exp = exp.substring(0, varObj.begin) + val + exp.substring(varObj.end);
			begin = varObj.begin;
		} else {
			console.error("Fail to get variable: " + varObj.key + " from exp: " + exp);
		}
		varObj = getVariableName(exp, begin);
	}
	return exp;
}

function clonePosition(pos) {	  
	return {left: pos.left, 
		    top: pos.top,
		    width: pos.width,
		    height: pos.height,
		    angle: pos.angle,
		    parent: pos.parent};
}

function cloneElement(elem) {
	const obj = {id: "element-" + crypto.randomUUID(), name: elem.name, position: clonePosition(elem.position)};
	if(elem.icon != null) {
		obj.icon = elem.icon
	}
	if(elem.expression != null) {
		obj.expression = elem.expression
	}
	if(elem.displayName != null) {
		obj.displayName = elem.displayName
	}
	if(elem.type != null) {
		obj.type = elem.type
	}
	if(elem.help != null) {
		obj.help = elem.help
	}
	if(elem.filter != null) {
		obj.filter = elem.filter
	}
	if(elem.width != null) {
		obj.width = elem.width
	}
	if(elem.filter != null) {
		obj.height = elem.height
	}
	return obj;
}

function processPage(variablesObj, page) {
	var elementArray = new Array();
	var groupMap = new Map();
	const groups = page.groups;
	for(const group of groups) {
		const config = group['config'];
		delete group['config'];
		const groupElement =  {config: config, position: clonePosition(group.position), group: group, elements: new Array(), bAddParent: false}
		groupMap.set(group.id, groupElement)
		if(group.position.parent == null) {
		    elementArray.push(groupElement);
		}
	}

	const elements = page.elements;
	page.id = "page-" + crypto.randomUUID();
	for(i = elements.length - 1; i >= 0; i--) {
		const element = elements[i];
		if(element.position.parent != null) {
			const groupElement = groupMap.get(element.position.parent);
			if(groupElement != null) {
				elements.splice(i, 1);
				groupElement.elements.unshift(element);
				if(!groupElement.bAddParent && groupElement.group.position.parent != null) {
					const parentGroupElement = groupMap.get(groupElement.group.position.parent);
					parentGroupElement.elements.unshift(groupElement);
					groupElement.bAddParent = true;
				}
				continue;
			}
		}
		element.id = "element-" + crypto.randomUUID();
		elementArray.push(element);
	}

	elementArray.sort(comparePosition);
	let detlaHeight = 0;
	for(const groupElement of elementArray) {
		if(groupElement.elements != null) {
			detlaHeight = processGroupElement(variablesObj, elements, groupElement, detlaHeight)		
		} else {
			processElement(variablesObj, groupElement, detlaHeight);
		}
	}
	return detlaHeight;
}

function processGroupElement(variablesObj, elements, groupElement, detlaHeight, detlaWidth = 0) {
	const config = groupElement.config;
	const group = groupElement.group;
	const groupWidth = groupElement.position.width;
	const groupHeight = groupElement.position.height;
	
	var name = null;
	if(config != null)  {
		name = groupElement.config.name;
	}
	if(name == null) {
		for(const groupElem of groupElement.elements) {
			const elem = cloneElement(groupElem);
			group.position.top = group.position.top + detlaHeight;
			processElement(variablesObj, elem, detlaHeight, detlaWidth);
			elements.push(elem); 
		    return detlaHeight;
		}
	} 
	
	const list = variablesObj[name];
	if(list == null || list.length == 0) {
		return detlaHeight - groupHeight;
	}
	
	const repeatItem = variablesObj[name + "+"];
	const horizonal = groupElement.config.x;
	const orgDetlaHeight = detlaHeight;
		
	var hIndex = -1;
	var deltaHeightChanging = 0;
	for(let i = 0; i < list.length; i++) {
	    const item = list[i];
		const itemVariablesObj = createVariableObject(variablesObj, item, repeatItem);
		if(hIndex >= horizonal - 1) {
			hIndex = -1;
			detlaHeight = detlaHeight + groupHeight + deltaHeightChanging;
		}
		hIndex++;
		const elemArray = [];
		var currentDeltaHeight = detlaHeight;
		for(const groupElem of groupElement.elements) {
			if(groupElem.elements == null) {
			    const elem = cloneElement(groupElem);
				processElement(itemVariablesObj,  elem, currentDeltaHeight, detlaWidth + hIndex * groupWidth);
			    elemArray.push(elem);
			} else {
				const childrenDetailHeight = processGroupElement(itemVariablesObj, elemArray, groupElem, currentDeltaHeight, detlaWidth + hIndex * groupWidth);
				if(childrenDetailHeight != detlaHeight) {
					for(const elem of elemArray) {
					    if(elem.position.top + elem.position.height > groupElem.position.top + currentDeltaHeight){
							elem.position.height = elem.position.height + childrenDetailHeight - currentDeltaHeight;
						}
					}
					currentDeltaHeight = childrenDetailHeight;
					deltaHeightChanging = childrenDetailHeight - detlaHeight;
				}
			}
		}
		for(const elem of elemArray) {
		    elements.push(elem);
        }
	}
	
	detlaHeight = detlaHeight + deltaHeightChanging;
	
	group.position.width = groupWidth * horizonal;
	group.position.top = group.position.top + orgDetlaHeight;
	group.position.height = group.position.height + detlaHeight - orgDetlaHeight;

	return detlaHeight;
}

function processElement(variablesObj, element, detlaHeight, deltaWidth = 0) {
	element.position.left = element.position.left + deltaWidth;
	element.position.top = element.position.top + detlaHeight;
	if(element.expression != null) {
		element.expression = elementExpressionReplace(element.expression, variablesObj);
	}	
}

function processAssets(assetsVars, canvas, templateDir, dataDir) {
	const assets = canvas.assets;
	if(assets == null) {
		return;
	}
	const assetKeys = Object.keys(assets);
	for(let i = 0; i < assetKeys.length; i++) {
		const asset = assets[assetKeys[i]];
		const varObj = getVariableName(asset.value);
		if(varObj == null) {
			continue;
		}
		assetValue = assetsVars[varObj.key.trim()];
		var buffer = null;
		if(assetValue != null) {
			if (fs.existsSync(dataDir + "/" + assetValue)) {
				buffer = fs.readFileSync(dataDir + "/" + assetValue);
			} else if(fs.existsSync(templateDir + "/" + "canvas.png")) {
				buffer = fs.readFileSync(templateDir + "/" + "canvas.png");
			}
		}
		if(buffer == null) {
			continue;
		}
		const base64 = buffer.toString("base64");
		asset.value = "data:image/" + assetValue.split('.').pop() + ";base64," + base64;
	}
}

if (process.argv.length != 5) {
	console.error("arguments input: <template json file> <data json file> <output canvas json file>");
	process.exit(1);
}
const inputTemplate = process.argv[2];
const inputData = process.argv[3];
const outputCanvas = process.argv[4];
console.log("start process file, template: " + inputTemplate + ", data: " + inputData + ", canvas: " + outputCanvas);

const path = require('path');
const fs = require('fs');
const crypto = require("crypto");

const templateDir = path.dirname(inputTemplate);
const dataDir = path.dirname(inputData);

const jsonData = fs.readFileSync(inputData);
const data = JSON.parse(jsonData);
const canvasName = data["CanvasName"]
const expressionVariables = data["Expression"];
const assetsVariables = data["Assets"];

const jsonTemplate = fs.readFileSync(inputTemplate);
const canvas = JSON.parse(jsonTemplate);

processAssets(assetsVariables, canvas, templateDir, dataDir);
const detlaHeight = processPage(expressionVariables, canvas.pages[0]);

if(canvasName != null) {
    canvas.name = canvasName;
}
canvas.id = "'workpad-" + crypto.randomUUID();
canvas.height = canvas.height + detlaHeight;

const jsonOutput = JSON.stringify(canvas);
fs.writeFile(outputCanvas, jsonOutput, function(err) {
	if(err) throw err;
});

console.log("end process canvas: " + outputCanvas);
