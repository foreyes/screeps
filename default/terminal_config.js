var utils = require('utils');

var terminalConfigArray = {
	'E33N36': {
		needArray: [
			[RESOURCE_ENERGY, 40000],
			[RESOURCE_KEANIUM, 2000],
			[RESOURCE_KEANIUM_BAR, 400],
			[RESOURCE_MIST, 2000],
		],
	},
	'E35N38': {
		needArray: [
			[RESOURCE_ENERGY, 40000],
			[RESOURCE_CATALYST, 100000],
		],
	},
	'E29N34': {
		needArray: [
			[RESOURCE_ENERGY, 150000],
		],
		priorityArray: [
			[RESOURCE_ENERGY, 2],
		],
	},
	'E29N33': {
		needArray: [
			[RESOURCE_ENERGY, 40000],
		],
	},
};

function warp() {
	var tc = {};
	for(var roomName in terminalConfigArray) {
		var item = terminalConfigArray[roomName];
		var tcRoom = {};
		if(item.needArray != undefined) {
			tcRoom.need = utils.GetObjByArray(item.needArray);
		}
		if(item.priorityArray != undefined) {
			tcRoom.priority = utils.GetObjByArray(item.priorityArray);
		}
		tc[roomName] = tcRoom;
	}
	return tc;
}

module.exports = warp();