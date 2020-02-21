var utils = require('utils');

function InitRoomCtx(gCtx, room) {
	var roomName = room.name;
	if(Memory.rooms[roomName] != undefined) {
		delete Memory.rooms[roomName];
	}
	Memory.rooms[roomName] = {};

	if(room.memory.ctx != undefined) {
		delete room.memory.ctx;
	}
	room.memory.ctx = {Wait: [], Running: []};

	var spawns = room.find(FIND_STRUCTURES, {
		filter: (struct) => {
			return struct.structureType == STRUCTURE_SPAWN;
		}
	});
	room.memory.ctx.spawnIds = spawns.map((struct) => struct.id);
	room.memory.ctx.sourceIds = room.find(FIND_SOURCES).map((src) => src.id);
}

roomCache = {};

function UpdateContext() {
	// stats creeps
	for(var creepName in Game.creeps) {
		var creep = Game.creeps[creepName];
		var room = creep.room;
		if(creep.memory.ctrlRoom) {
			room = Game.rooms[creep.memory.ctrlRoom];
		}
		if(!room.ctx.creeps) continue;

		room.ctx.creeps.push(creep);
		if(room.ctx[creep.memory.role + 's']) {
			room.ctx[creep.memory.role + 's'].push(creep);
		}
		if(creep.memory.role == 'specialer') {
			if(creep.memory.specialType == 'laber') {
				room.ctx.labers.push(creep);
			}
			if(creep.memory.specialType == 'powerSpawner') {
				room.ctx.powerSpawners.push(creep);
			}
		}
	}
	// sort fillers
	for(var roomName in Game.rooms) {
		var room = Game.rooms[roomName];
		if(room.ctx.fillers != undefined) {
			room.ctx.fillers = room.ctx.fillers.sort((a, b) => {
				if(a.spawning) return 1;
				if(b.spawning) return -1;
				return a.id - b.id;
			});
		}
	}
}

function FetchRoomCtx(gCtx, room) {
	// fetch room cache
	if(roomCache[room.name] == undefined) {
		roomCache[room.name] = {};
	}
	room.cache = roomCache[room.name];
	// // ownership
	// var my = room.controller != undefined && room.controller.my;
	// var neutral = room.controller == undefined || room.controller.owner == 'None';
	// var hostile = !my && !neutral
	if(room.controller == undefined || !room.controller.my) {
		// utils.ProfileStage('Fetch room' + room.name + ' ctx: ');
		return {
			my: false,
			reservedByOthers: room.controller && room.controller.reservation && room.controller.reservation.username != 'foreyes1001',
			room: room,
			enemies: room.find(FIND_HOSTILE_CREEPS),
			constructing: room.find(FIND_MY_CONSTRUCTION_SITES),
		}
	}

	// spawns
	var spawn = undefined;
	var spawns = _.map(room.memory.ctx.spawnIds, Game.getObjectById);
	if(spawns.length > 0) {
		spawn = spawns[0];
	}
	spawns = room.find(FIND_MY_SPAWNS).filter((s) => {
		return s.isActive();
	});
	// sources
	var sources =  _.map(room.memory.ctx.sourceIds, Game.getObjectById);
	// improved
	// ---------------
	var storage = room.storage, terminal = room.terminal, factory = room.factory, powerSpawn = room.powerSpawn;
	var towers = room.towers;
	var emptyExts = [];
	if(room.energyAvailable != room.energyCapacityAvailable) {
		emptyExts = room.extensions.filter((e) => e.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
	}
	var ramparts = room.ramparts, walls = room.walls, labs = room.labs;
	var wallsAndRamparts = [];
	if(walls != undefined) wallsAndRamparts = walls;
	if(ramparts != undefined) wallsAndRamparts = wallsAndRamparts.concat(ramparts);

	var creeps = [], upgraders = [], builders = [], repairers = [], miners = [], fillers = [];
	var managers = [], labers = [], powerSpawners = [];
	// ---------------
	// enemies
	var enemies = room.find(FIND_HOSTILE_CREEPS);
    // droped energy > 300
    var dropedEnergy = room.find(FIND_DROPPED_RESOURCES, {
		filter: (resource) => {
			return resource.amount >= 50 && resource.resourceType == RESOURCE_ENERGY;
		}
	});
	// constructing
	var constructing = room.find(FIND_MY_CONSTRUCTION_SITES);
	// setup restPos
	var restPos = spawn;
	if(room.memory.ctx.restPos != undefined) {
		var pos = room.memory.ctx.restPos;
		restPos = new RoomPosition(pos.x, pos.y, pos.roomName);
	}
	// mineral
	var mineral = undefined;
	var minerals = room.find(FIND_MINERALS);
	if(minerals.length > 0 && minerals[0].mineralAmount > 0) {
		mineral = minerals[0];
	}
	var mineralCanHarvest = undefined;
	if(mineral != undefined && room.extractor) {
		mineralCanHarvest = mineral
	}

	var ctx = {
		room: room,
		my: true,
		reservedByOthers: room.controller && room.controller.reservation && room.controller.reservation.username != 'foreyes1001',
		spawns: spawns,
		spawn: spawn,
		sources: sources,
		creeps: creeps,
		towers: towers,
		enemies: enemies,
		restPos: restPos,
		dropedEnergy: dropedEnergy,
		storage: storage,
		terminal: room.terminal,
		constructing: constructing,
		emptyExts: emptyExts,
		wallsAndRamparts: wallsAndRamparts,
		ramparts: ramparts,
		upgraders: upgraders,
		builders: builders,
		repairers: repairers,
		miners: miners,
		fillers: fillers,
		keepLevel: room.memory.ctx.keepLevel == true,
		upgrading: room.memory.ctx.upgrading == true,
		mineral: mineral,
		mineralCanHarvest: mineralCanHarvest,
		factory: factory,
		managers: managers,
		labs: labs,
		labers: labers,
		powerSpawn: powerSpawn,
		powerSpawners: powerSpawners,
		// stealers: stealers,
	};
	// set room ignore
	if(ctx.spawn) {
		ctx.roomIgnore = [new RoomPosition(ctx.spawn.pos.x, ctx.spawn.pos.y-1, room.name)];
	}

	// set container info
	if(room.memory.ctx.controllerContainerPos != undefined) {
		var pos = room.memory.ctx.controllerContainerPos;
		pos = new RoomPosition(pos.x, pos.y, pos.roomName);
		var containers = room.lookAt(pos).filter((item) => {
			return item.type == 'structure' && item.structure.structureType == STRUCTURE_CONTAINER;
		});
		if(containers.length != 0) {
			room.memory.ctx.controllerContainerId = containers[0].structure.id;
			delete room.memory.ctx.controllerContainerPos;
		}
	}
	if(room.memory.ctx.sourceContainerPos != undefined) {
		for(var i in room.memory.ctx.sourceContainerPos) {
			var pos = room.memory.ctx.sourceContainerPos[i];
			pos = new RoomPosition(pos.x, pos.y, pos.roomName);
			var containers = room.lookAt(pos).filter((item) => {
				return item.type == 'structure' && item.structure.structureType == STRUCTURE_CONTAINER;
			});
			if(containers.length != 0) {
				room.memory.ctx.sourceContainerIds[i] = containers[0].structure.id;
				delete room.memory.ctx.sourceContainerPos[i];
			}
		}
		if(utils.IsEmptyObj(room.memory.ctx.sourceContainerPos)) {
			delete room.memory.ctx.sourceContainerPos;
		}
	}
	if(room.memory.ctx.centralContainerPos != undefined) {
		for(var i in room.memory.ctx.centralContainerPos) {
			var pos = room.memory.ctx.centralContainerPos[i];
			pos = new RoomPosition(pos.x, pos.y, pos.roomName);
			var containers = room.lookAt(pos).filter((item) => {
				return item.type == 'structure' && item.structure.structureType == STRUCTURE_CONTAINER;
			});
			if(containers.length != 0) {
				room.memory.ctx.centralContainerIds[i] = containers[0].structure.id;
				delete room.memory.ctx.centralContainerPos[i];
			}
		}
		if(utils.IsEmptyObj(room.memory.ctx.centralContainerPos)) {
			delete room.memory.ctx.centralContainerPos;
		}
	}
	// get container
	if(room.memory.ctx.controllerContainerId) {
		var obj = Game.getObjectById(room.memory.ctx.controllerContainerId);
		if(obj) {
			ctx.controllerContainer = obj;
		}
	}
	if(room.memory.ctx.sourceContainerIds) {
		ctx.sourceContainers = utils.ObjMap(room.memory.ctx.sourceContainerIds, Game.getObjectById);
	}
	if(room.memory.ctx.centralContainerIds) {
		var centralContainerIds = _.filter(room.memory.ctx.centralContainerIds, (id) => Game.getObjectById(id) != null);
		ctx.centralContainers = centralContainerIds.map(Game.getObjectById);
	}
	// get link
	if(room.memory.ctx.sourceLinkIds) {
		ctx.sourceLinks = utils.ObjMap(room.memory.ctx.sourceLinkIds, Game.getObjectById);
	}
	if(room.memory.ctx.centralLinkId) {
		ctx.centralLink = Game.getObjectById(room.memory.ctx.centralLinkId);
	}
	if(room.memory.ctx.controllerLinkId) {
		ctx.controllerLink = Game.getObjectById(room.memory.ctx.controllerLinkId);
	}

	ctx.creepOnContainer = ctx.controllerContainer && 
							ctx.room.lookAt(ctx.controllerContainer.pos).filter((item) => {
								return item.type == 'creep';
							}).length > 0;

	room.ctx = ctx;

	// utils.ProfileStage('Fetch room' + room.name + ' ctx: ');
	return ctx;
}

module.exports = {
	InitRoomCtx,
	FetchRoomCtx,
	UpdateContext,
};