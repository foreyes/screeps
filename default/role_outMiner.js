var utils = require('utils');

var roleParts = {
	0: [],
	1150: utils.GetPartsByArray([[WORK, 8], [CARRY, 2], [MOVE, 5]]),
	1800: utils.GetPartsByArray([[WORK, 12], [CARRY, 4], [MOVE, 8]]),
	2300: utils.GetPartsByArray([[WORK, 16], [CARRY, 4], [MOVE, 10]]),
	3950: utils.GetPartsByArray([[WORK, 29], [CARRY, 4], [MOVE, 17]])
};

function getCost(energy) {
	if(energy >= 3950) return 3950;
	if(energy >= 2300) return 2300;
	if(energy >= 1800) return 1150;
	if(energy >= 1150) return 1150;
	return 0;
}

function GetPartsAndCost(energy) {
	var cost = getCost(energy);
	var parts = roleParts[cost];
	return {cost: cost, parts: parts};
}

var buffer = {};

const S_TO_WORK = 0, S_RUN_AWAY = 1, S_WORK = 2, S_BUILD = 3, S_REPAIR = 4;

function runToWork(creep, outSource, idx) {
	creep.memory.state = S_TO_WORK;
	var workPos = utils.GetRoomPosition(outSource.workPos[idx]);
	if(!creep.pos.isEqualTo(workPos)) {
		return utils.DefaultMoveTo(creep, workPos);
	}
	return runWork(creep, outSource, idx);
}

function runRunAway(creep) {
	creep.memory.state = S_RUN_AWAY;
	var ctrlRoom = Game.rooms[creep.memory.ctrlRoom];
	if(creep.room.name != ctrlRoom.name || !creep.pos.inRangeTo(ctrlRoom.storage, 10)) {
		return utils.DefaultMoveTo(creep, ctrlRoom.storage);
	}
	if(creep.hits == creep.hitsMax) {
		creep.memory.state = S_TO_WORK;
		creep.memory.sleep = 100;
	}
}

function checkRoad(creep, source) {
	creep.memory.checkTime = Game.time;

	var path = buffer[source.id];
	if(path == undefined) {
		path = utils.FindPath(creep.pos, {pos: Game.rooms[creep.memory.ctrlRoom].storage.pos, range: 1}, {buildRoad: true}).path;
		buffer[source.id] = path;
	}
	path.forEach((pos) => {
		Game.rooms[pos.roomName].createConstructionSite(pos, STRUCTURE_ROAD);
	})
}

function runWork(creep, outSource, idx) {
	creep.memory.state = S_WORK;
	var source = Game.getObjectById(outSource.sources[idx]);
	if(creep.store.getFreeCapacity( ) > 0) {
		if(creep.room.ctx.reservedByOthers) return -1;
		if(source.energy == 0) {
			creep.memory.sleep = source.ticksToRegeneration;
			return -1;
		}
		return creep.harvest(source);
	}
	// full and need repair
	var container = _.first(creep.room.lookForAt(LOOK_STRUCTURES, creep.pos).filter((s) => {
		return s.structureType == STRUCTURE_CONTAINER;
	}));
	if(container && container.hits < container.hitsMax) {
		return runRepair(creep, container);
	}
	// check build
	if(!container) {
		creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
		checkRoad(creep, source);
	}
	if(Game.time % 1073 < 4 && (!creep.memory.checkTime || Game.time - creep.memory.checkTime > 100)) {
		checkRoad(creep, source);
	}
	// full and need build
	if(creep.room.ctx.constructing.length > 0) {
		return runBuild(creep);
	}
	// still harvest
	return creep.harvest(source);
}

function runBuild(creep) {
	creep.memory.state = S_BUILD;
	if(creep.room.ctx.constructing.length == 0) {
		return runWork(creep, creep.outSource, creep.memory.sourceIdx);
	}
	return require('role_builder').Try2Build(creep.room.ctx, creep);
}

function runRepair(creep, container) {
	creep.memory.state = S_REPAIR;
	if(!container) return runWork(creep, creep.outSource, creep.memory.sourceIdx);
	creep.memory.containerId = container.id;
	// check state
	if(creep.store[RESOURCE_ENERGY] == 0 || container.hits == container.hitsMax) {
		return runWork(creep, creep.outSource, creep.memory.sourceIdx);
	}
	return creep.repair(container);
}

function Run(ctx, creep) {
	// handle 'noThrough' and sleep
	creep.memory.noThrough = creep.memory.state != S_WORK;
	if(creep.memory.sleep > 1) {
		creep.memory.sleep -= 1;
		creep.say('💤');
		return 0;
	}

	// check escape
	var outSource = require('room_config')[creep.memory.ctrlRoom].outSources[creep.memory.workRoom];
	creep.outSource = outSource;
	if(creep.hits < creep.hitsMax) {
		if(!outSource.needDefender && !Game.creeps['defender' + creep.memory.workRoom]) {
			outSource.needDefender = true;
		}
		creep.memory.state = S_RUN_AWAY;
	}

	// default state
	if(creep.memory.state == undefined) {
		creep.memory.state = S_TO_WORK;
	}

	// handle states
	switch(creep.memory.state) {
	case S_TO_WORK: {
		runToWork(creep, outSource, creep.memory.sourceIdx);
		break;
	}
	case S_RUN_AWAY: {
		runRunAway(creep);
		break;
	}
	case S_WORK: {
		runWork(creep, outSource, creep.memory.sourceIdx);
		break;
	}
	case S_BUILD: {
		runBuild(creep);
		break;
	}
	case S_REPAIR: {
		runRepair(creep, Game.getObjectById(creep.memory.containerId));
	}
	}
}

module.exports = {
	GetPartsAndCost,
    Run
};