var utils = require('utils');

// soilder cost: 1680
var soilderParts = [ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE, ATTACK, ATTACK, MOVE];

// looker cost: 1300
var lookerParts = [ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE];

function createSoilder(type, name) {
	var spawn = Game.spawns['Spawn1'];
	if(type == 'soilder') {
		spawn.spawnCreep(soilderParts, name);
	} else if (type == 'looker') {
		spawn.spawnCreep(lookerParts, name);
	}
}

function creepMoveTo(creepName, x, y, roomName) {
	var creep = Game.creeps[creepName];
	var pos = new RoomPosition(x, y, roomName);
	if(!Memory.ExtraWork) {
		Memory.ExtraWork = [];
	}
	Memory.ExtraWork.push({type: 'walk', id: creep.id, target: pos,});
}

function creepAttack(creepName, did) {
	var creep = Game.creeps[creepName];
	if(!Memory.ExtraWork) {
		Memory.ExtraWork = [];
	}
	Memory.ExtraWork.push({type: 'attack', id: creep.id, target: did,});
}

module.exports = {
    createSoilder,
    creepMoveTo,
    creepAttack,
};

// require('role_looker').creepMoveTo('jg', 7, 5, 'E35N37');