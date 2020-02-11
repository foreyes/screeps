var utils = require('utils');

function getRunningPicker(pickerInMemory) {
    var picker = Game.getObjectById(pickerInMemory.id);
    var roomName = pickerInMemory.roomName;
    if(!picker) return null;
    return {picker: picker, roomName: roomName};
}

function runPicker(pickerInfo) {
	console.log('Running invader picker: ' + Game.time);
	var picker = pickerInfo.picker;
	var roomName = pickerInfo.roomName;
	if(picker.memory.state == undefined) {
		picker.memory.state = 'goWork';
	}

	require('cache');
    picker.fetchCache();

	// heal self
	picker.heal(picker);

	switch(picker.memory.state) {
	case 'goWork': {
		if(picker.room.name == roomName) {
			picker.memory.state = 'work';
		}
		utils.DefaultMoveTo(picker, new RoomPosition(25, 25, roomName));
	}
	case 'work': {
		if(picker.memory.state != 'work') break;
		if(picker.store.getFreeCapacity() == 0) {
			picker.memory.state = 'back';
			break;
		}
		var targets = picker.room.find(FIND_RUINS);
		targets = targets.filter((s) => {
			return s.structure.structureType == STRUCTURE_INVADER_CORE &&
					s.store && s.store.getUsedCapacity() > 0;
		})

		if(targets.length == 0) {
			picker.memory.state = 'back';
			break;
		}
		var target = picker.pos.findClosestByPath(targets);
		if(!picker.pos.isNearTo(target)) {
			utils.DefaultMoveTo(picker, target);
			return;
		}
		for(var resourceType in target.store) {
			if(target.store[resourceType] > 0) {
				picker.withdraw(target, resourceType);
				return;
			}
		}
		break;
	}
	case 'back': {
		var terminal = Game.rooms[picker.memory.ctrlRoom].terminal;
		if(picker.room.name != terminal.room.name || !picker.pos.isNearTo(terminal)) {
			utils.DefaultMoveTo(picker, terminal);
			return;
		}
		for(var resourceType in picker.store) {
			if(picker.store[resourceType] > 0) {
				picker.transfer(terminal, resourceType);
				return;
			}
		}
		if(!picker.memory.timeUsed) {
			picker.memory.timeUsed = 1500 - picker.ticksToLive;
		}
		if(picker.ticksToLive >= picker.memory.timeUsed + 50) {
			picker.memory.state = 'goWork';
		} else {
			picker.memory.state = 'idle';
		}
		break;
		//picker.say('suicide!');
		// picker.suicide();
	}
	case 'idle': {

	}
	}
}

function Run() {
    if(Memory.invaderPickers == undefined) {
        Memory.invaderPickers = [];
    }
    var nxtInvaderPickers = [];
    for(var picker of Memory.invaderPickers) {
        var runningPicker = getRunningPicker(picker);
        if(runningPicker) {
            nxtInvaderPickers.push(picker);
            runPicker(runningPicker);
        }
    }
    Memory.invaderPickers = nxtInvaderPickers;
}

function AddPicker(picker, roomName) {
    picker.room.cache.boostPrepare = false;
    if(Memory.invaderPickers == undefined) {
    	Memory.invaderPickers = [];
    }
    Memory.invaderPickers.push({id: picker.id, roomName: roomName});
}

module.exports = {
    Run,
    AddPicker,
};