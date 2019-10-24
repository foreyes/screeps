var utils = require('utils');

function InitWhenRespawn(spawnName = 'Spawn1') {
	if(Memory.ctx != undefined) {
		delete Memory.ctx;
	}
	Memory.ctx = {Wait: [{wait: 0, name: 'road1'}], InProgress: []};

	var spawn = Game.spawns[spawnName];
	var room = spawn.room;

	Memory.ctx.spawnId = spawn.id;
	Memory.ctx.sourcesId = room.find(FIND_SOURCES).map((obj) => {return obj.id;});
}

function FetchCtx() {
	var spawn = Game.getObjectById(Memory.ctx.spawnId);
	var room = spawn.room;
	var sources = Memory.ctx.sourcesId.map(Game.getObjectById);

	var ctx = {
		spawn: spawn,
		room: room,
		sources: sources,
		// creep informations
		workerHarvesters: utils.GetMyCreepsByRole('workerHarvester'),
		workerUpgraders: utils.GetMyCreepsByRole('workerUpgrader'),
		workerBuilders: utils.GetMyCreepsByRole('workerBuilder'),
		workerRepairers: utils.GetMyCreepsByRole('workerRepairer'),
		carriers: utils.GetMyCreepsByRole('carrier'),
		spawners: utils.GetMyCreepsByRole('spawner'),
		miners: utils.GetMyCreepsByRole('miner'),
	};

	if(Memory.ctx.flagSetContainerInfo) {
		ctx.flagDevRole = true;
		var sourceContainerIds = [sources[0].memory.containerId, sources[1].memory.containerId, spawn.memory.containerId];
		ctx.sourceContainers = sourceContainerIds.map((id) => Game.getObjectById(id));
		ctx.controllerContainer = Game.getObjectById(room.controller.memory.containerId);
	}
	return ctx;
}

module.exports = {
	InitWhenRespawn,
	FetchCtx
};

