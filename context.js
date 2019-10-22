function InitWhenRespawn(spawnName = 'Spawn1') {
	if(Memory.ctx != undefined) {
		delete Memory.ctx;
	}
	Memory.ctx = {Wait: [], InProgress: ['road1']};

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
		sources: sources
	};
	return ctx;
}

module.exports = {
	InitWhenRespawn,
	FetchCtx
};

