var utils = require('utils');


var roleParts = {
	// 50
	looker: [MOVE],
	// 1560
	soilder: [ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE],
	// 1500
	healer: [HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE],
	// 1200
	crasher: [WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE],
	// 650
	claimer: [CLAIM, MOVE],
	// 1250
	outerWorker: [WORK, WORK, WORK, WORK, WORK,CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
	// 3200
	outerWorker2: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
	// 1080
	wdnmd: [ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, HEAL],
}

// require('role_looker').createLooker('soilder', 's1');
// require('role_looker').creepMoveTo('s1', 1, 1, 'E33N36');
// require('role_looker').creepHeal('h1', 's1');
// require('role_looker').creepAttack('s1', '5db816fd8f60bd0321056201');
// require('role_looker').creepDismantle('c1', '5db816fd8f60bd0321056201');
// Memory.ExtraWork = [];
function createLooker(type, name, spawnName = 'Spawn1') {
	// TODO
	var spawn = Game.spawns[spawnName];
	var parts = roleParts[type];
	return spawn.spawnCreep(parts, name);
}

function creepMoveTo(creepName, x, y, roomName) {
	var creep = Game.creeps[creepName];
	var pos = new RoomPosition(x, y, roomName);
	if(!creep || !pos) return;
	if(!Memory.ExtraWork) {
		Memory.ExtraWork = [];
	}
	Memory.ExtraWork.push({type: 'walk', id: creep.id, target: pos});
}

function creepHeal(creepName, targetName) {
	var creep = Game.creeps[creepName];
	var target = Game.creeps[targetName];
	if(!creep || !target) return;
	if(!Memory.ExtraWork) {
		Memory.ExtraWork = [];
	}
	Memory.ExtraWork.push({type: 'heal', id: creep.id, target: target.id})
}

function creepAttack(creepName, id) {
	var creep = Game.creeps[creepName];
	var target = Game.getObjectById(id);
	if(!creep || !target) return;
	if(!Memory.ExtraWork) {
		Memory.ExtraWork = [];
	}
	Memory.ExtraWork.push({type: 'attack', id: creep.id, target: id});
}

function creepDismantle(creepName, id) {
	var creep = Game.creeps[creepName];
	var target = Game.getObjectById(id);
	if(!creep || !target) return;
	if(!Memory.ExtraWork) {
		Memory.ExtraWork = [];
	}
	Memory.ExtraWork.push({type: 'dismantle', id: creep.id, target: id});
}

module.exports = {
    createLooker,
    creepMoveTo,
    creepHeal,
    creepAttack,
    creepDismantle,
};

// require('role_looker').creepMoveTo('jg', 7, 5, 'E35N37');