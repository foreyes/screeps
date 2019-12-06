var TerminalConfig = require('terminal_config');

function fetchTerminalNeed(terminal) {
	terminal.need = {};
	terminal.priority = {};
	var roomName = terminal.room.name;
	if(TerminalConfig[roomName] == undefined) {
		return 0;
	}
	if(TerminalConfig[roomName].need != undefined) {
		terminal.need = TerminalConfig[roomName].need;
	}
	if(TerminalConfig[roomName].priority != undefined) {
		terminal.priority = TerminalConfig[roomName].priority;
	}
	return 0;
}

function try2SendResource(gCtx, terminal, resourceType, amount) {
	var maxPriority = -1e12, targetIdx = -1; 
	for(var i in gCtx.needList) {
		var item = gCtx.needList[i];
		if(item.roomName == terminal.roomName) continue;
		if(item.resourceType != resourceType) continue;
		if(item.needAmount <= 0) continue;
		if(item.sendFlag) continue;
		if(item.priority > maxPriority) {
			maxPriority = item.priority;
			targetIdx = i;
		}
	}
	if(targetIdx != -1) {
		var targetRoomName = gCtx.needList[targetIdx].roomName;
		var freeCapacity = Game.rooms[targetRoomName].terminal.store.getFreeCapacity();
		var sendAmount = Math.min(freeCapacity, gCtx.needList[targetIdx].needAmount, amount);
		var err = terminal.send(resourceType, sendAmount, targetRoomName);
		if(err == 0) {
			console.log('room ' + terminal.room.name + ' send ' + sendAmount + ' ' + resourceType + ' to room ' + targetRoomName);
			gCtx.needList[targetIdx].sendFlag = true;
			return 0;
		}
	}
	return -1;
}

function updateNeedInfo(gCtx, terminal) {
	fetchTerminalNeed(terminal);
	for(var resourceType in terminal.need) {
		if(terminal.store[resourceType] < terminal.need[resourceType]) {
			var priority = 1;
			if(terminal.priority[resourceType] != undefined) {
				priority = terminal.priority[resourceType];
			}
			gCtx.needList.push({
				roomName: terminal.room.name,
				resourceType: resourceType,
				priority: -terminal.store[resourceType] * priority,
				needAmount: terminal.need[resourceType] - terminal.store[resourceType],
				sendFlag: false,
			});
		}
	}
}

function runTerminal(gCtx, terminal) {
	if(terminal.cooldown != 0) return false;
	for(var resourceType in terminal.store) {
		var amount = terminal.store[resourceType];
		if(!terminal.need[resourceType] || amount > terminal.need[resourceType]*1.1) {
			var sendLimit = amount;
			if(terminal.need[resourceType]) {
				sendLimit = amount - terminal.need[resourceType];
			}
			var err = try2SendResource(gCtx, terminal, resourceType, sendLimit);
			if(err == 0) return true;
		}
	}
}

function Run(gCtx) {
	gCtx.needList = [];
	// fetch terminal needs
	var terminalList = [];
	for(var roomName in Game.rooms) {
		var room = Game.rooms[roomName];
		if(room.ctx.my && room.terminal) {
			updateNeedInfo(gCtx, room.terminal);
			terminalList.push(room.terminal);
		}
	}
	// run terminal scheduler
	for(var terminal of terminalList) {
		runTerminal(gCtx, terminal);
	}
}

module.exports = {
    Run
};