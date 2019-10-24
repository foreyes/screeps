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
	var spawners = utils.GetMyCreepsByRole(room, 'spawner');
	var carriers = utils.GetMyCreepsByRole(room, 'carrier');
	var towers = room.find(FIND_STRUCTURE, {
		filter: (structure) => {
			return structure.structureType == STRUCTURE_TOWER && structure.my;
		}
	});
	if(spawners.length == 0 && carriers.length != 0) {
		carriers[0].memory.role = 'spawner';
		spawners = [carriers[0]];
		carriers = utils.GetMyCreepsByRole(room, 'carrier');
	}

	var enemies = ctx.room.find(FIND_CREEPS, {
        filter: (creep) => {
            return !creep.my;
        }
    });

	var restPos = Game.flags['restPos'];
	if(restPos == undefined || restPos == null) {
		console.log("please set a restPos flag.");
		restPos = spawn;
	}

	var ctx = {
		restPos: restPos,
		spawn: spawn,
		room: room,
		sources: sources,
		towers: towers,
		enemies: enemies,
		storage: room.storage,
		// creep informations
		workerHarvesters: utils.GetMyCreepsByRole(room, 'workerHarvester'),
		workerUpgraders: utils.GetMyCreepsByRole(room, 'workerUpgrader'),
		workerBuilders: utils.GetMyCreepsByRole(room, 'workerBuilder'),
		workerRepairers: utils.GetMyCreepsByRole(room, 'workerRepairer'),
		carriers: carriers,
		spawners: spawners,
		miners: utils.GetMyCreepsByRole(room, 'miner'),
	};

	if(Memory.ctx.flagSetContainerInfo) {
		ctx.flagDevRole = true;
		var sourceContainerIds = [Memory.ctx.sourceContainerIds[0], Memory.ctx.sourceContainerIds[1], Memory.ctx.spawnContainerId];
		ctx.sourceContainers = sourceContainerIds.map((id) => Game.getObjectById(id));
		ctx.controllerContainer = Game.getObjectById(Memory.ctx.controllerContainerId);
	}
	return ctx;
}

module.exports = {
	InitWhenRespawn,
	FetchCtx
};

