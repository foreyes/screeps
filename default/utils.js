Creep.prototype.myWithdraw = function(target, resourceType) {
    var err = this.withdraw(target, resourceType);
    if(err == ERR_NOT_IN_RANGE) {
        DefaultMoveTo(this, target);
        return 0;
    }
    return err;
}

var get_positions_by_dist = function(room, start, dist) {
    var res = [];
    for(var dx = -dist; dx <= dist; dx++) {
        for(var dy = -dist; dy <= dist; dy++) {
            if(Math.abs(dx) + Math.abs(dy) == dist) {
                var x = start.x + dx;
                var y = start.y + dy;
                if(x < 0 || y < 0 || x >= 50 || y >= 50) continue;
                res.push(room.getPositionAt(x, y));
            }
        }
    }
    return res;
};

function GetDirectDistance(pos1, pos2) {
    if(pos1.roomName != pos2.roomName) {
        MyAlter("Error: not in one room when get distance!");
    }
    var dx = Math.abs(pos1.x - pos2.x);
    var dy = Math.abs(pos1.y - pos2.y);
    return Math.min(dx, dy) + Math.abs(dx - dy);
}

function CmpByObjDist2GivenPos(pos) {
    return function(a, b) {
        return GetDirectDistance(pos, a.pos) >  GetDirectDistance(pos, b.pos);
    };
}

var pathCache = {};

function stringifyPosition(pos) {
    return '' + pos.x + pos.y + pos.roomName;
}

function findNewPath2Target(creep, target, ignoreCreeps, otherRoom) {
    var path = undefined;
    if(!otherRoom) {
        path = creep.room.findPath(creep.pos, target, {ignoreCreeps: ignoreCreeps});
    } else {
        var hashVal = stringifyPosition(creep.pos) + '#' + stringifyPosition(target);
        if(ignoreCreeps) {
            if(pathCache[hashVal] != undefined && Game.time - pathCache[hashVal].timestamp < 10000) {
                path = pathCache[hashVal].path;
            } else {
                path = FindPath(creep.pos, target, {ignoreCreeps: ignoreCreeps}).path;
                pathCache[hashVal] = {
                    path: path,
                    timestamp: Game.time,
                };
            }
        } else {
            path = FindPath(creep.pos, target, {ignoreCreeps: ignoreCreeps}).path;
        }
    }
    if(path.length != 0) {
        var lastPos = path[path.length-1];
        if(!lastPos.roomName && (lastPos.x != target.x || lastPos.y != target.y)) {
            path = [];
        }
    }
    creep.cache.path = path;
    creep.cache.dest = target;
    return path;
}

function getPath2Target(creep, target, ignoreCreeps = true, otherRoom = false) {
    if(creep.cache.path == undefined) {
        return findNewPath2Target(creep, target, ignoreCreeps, otherRoom);
    }
    var path = creep.cache.path;
    var dest = creep.cache.dest;
    if(!dest || target.x != dest.x || target.y != dest.y) {
        return findNewPath2Target(creep, target, ignoreCreeps, otherRoom);
    }
    return path;
}

function defaultMoveToOtherRoom(creep, target) {
    if(creep.memory.stuck < 3) {
        var path = getPath2Target(creep, target, true, true);
        return creep.moveByPath(path);
    } else {
        delete creep.cache.path;
        var path = getPath2Target(creep, target, false, true);
        return creep.moveByPath(path);
    }
}

function defaultMoveToSameRoom(creep, target) {
    creep.say(creep.memory.stuck);
    if(creep.memory.stuck < 2) {
        var path = getPath2Target(creep, target, true);
        return creep.moveByPath(path);
    } else {
        delete creep.cache.path;
        var path = getPath2Target(creep, target, false);
        if(!path || path.length == 0) {
            return creep.memory.moveSleep = 20;
        }
        if(path.length > 0) {
            var nxtPos = path[path.length-1];
            if(nxtPos.x != target.x || nxtPos.y != target.y) {
                return creep.memory.moveSleep = 20;
            }
        }
        return creep.moveByPath(path);
    }
}

function implementMoveTo(creep, target) {
    if(target.pos != undefined) target = target.pos;
    if(creep.pos.isEqualTo(target)) return 0;

    if(creep.memory.moveSleep > 0) {
        creep.say('💤');
        creep.memory.moveSleep -= 1;
        return -233;
    }

    var err = null;
    if(creep.memory.stuck < 2 && creep.cache.path != undefined && target.isEqualTo(creep.cache.dest)) {
        err = creep.moveByPath(creep.cache.path);
    } else if(creep.pos.roomName != target.roomName) {
        err = defaultMoveToOtherRoom(creep, target);
    } else {
        err = defaultMoveToSameRoom(creep, target);
    }

    if(err == 0) {
        creep.memory.needMove = true;
    } else if(err == ERR_NOT_FOUND) {
        delete creep.cache.path;
    }
    return err;
}

function DefaultMoveTo(creep, target) {
    // return creep.moveTo(target);
    implementMoveTo(creep, target);
}

function IsSamePosition(pos1, pos2) {
    if(pos1 == undefined || pos2 == undefined) {
        return false;
    }
    return pos1.roomName == pos2.roomName && pos1.x == pos2.x && pos1.y == pos2.y;
}

function GetMyCreepsByRole(room, roleName) {
    return room.find(FIND_CREEPS, {
        filter: (creep) => {
            return creep.my && creep.memory.role == roleName;
        }
    });
}

// find in center
function findNewStore(ctx, creep) {
    var targets = _.filter(ctx.sourceContainers, (container) => {
        return container.store[RESOURCE_ENERGY] >= 100;
    });
    if(targets.length != 0) {
        return creep.pos.findClosestByRange(targets);
    }
    if(ctx.storage == undefined || ctx.storage.store[RESOURCE_ENERGY] < 100) return null;
    return ctx.storage;
}

function isValidEnergyTarget(target, creep) {
    if(!target) return false;
    // dropped
    if(target.resourceType != undefined) {
        return target.resourceType == RESOURCE_ENERGY && target.amount >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500);
    }
    // structure
    if(target.structureType != undefined) {
        return target.store && target.store[RESOURCE_ENERGY] >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500);
    }
    return false;
}

function findNewEnergyTarget4Worker(ctx, creep) {
    // return null if can not carry more
    if(!creep.store || creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        return null;
    }
    // get from storage
    if(ctx.storage && ctx.storage.store[RESOURCE_ENERGY] > 0) {
        return ctx.storage;
    }
    // get from container
    if(ctx.centralContainers) {
        var containers = _.filter(ctx.centralContainers, (c) => c.store[RESOURCE_ENERGY] >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500));
        if(containers.length > 0) {
            return creep.pos.findClosestByRange(containers);
        }
    }
    if(ctx.sourceContainers) {
        var containers = _.filter(ctx.sourceContainers, (c) => c.store[RESOURCE_ENERGY] >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500));
        if(containers.length > 0) {
            return creep.pos.findClosestByRange(containers);
        }
    }
    // get from dropped energy
    if(ctx.dropedEnergy) {
        var largeEnergy = ctx.dropedEnergy.filter((de) => de.amount >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500));
        if(largeEnergy.length > 0) {
            return creep.pos.findClosestByRange(largeEnergy);
        }
        // TODO:
        // return creep.pos.findClosestByPath(ctx.dropedEnergy);
    }
    // get from hostile structures
    var usefulHostileStructures = creep.room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return s.my != undefined && !s.my && s.store && s.store[RESOURCE_ENERGY] > 0;
        }
    });
    if(usefulHostileStructures.length != 0) {
        return creep.pos.findClosestByRange(usefulHostileStructures);
    }
    // get from ruins
    var usefulRuins = creep.room.find(FIND_RUINS, {
        filter: (r) => {
            return r.store[RESOURCE_ENERGY] > 0;
        }
    });
    if(usefulRuins.length != 0) {
        return creep.pos.findClosestByRange(usefulRuins);
    }
    // TODO: get from tomestone
    return null;
}

function getValidEnergyTarget4Worker(ctx, creep) {
    var target = Game.getObjectById(creep.memory.energyTargetId);
    if(!isValidEnergyTarget(target, creep)) {
        delete creep.memory.energyTargetId;
        target = findNewEnergyTarget4Worker(ctx, creep);
    }
    if(target != null) {
        creep.memory.energyTargetId = target.id;
    }
    return target;
}

function GetEnergy4Worker(ctx, creep) {
    var target = getValidEnergyTarget4Worker(ctx, creep);
    if(target == null) return false;

    // get energy
    if(target.resourceType != undefined) {
        var err = creep.pickup(target);
        if(err == ERR_NOT_IN_RANGE) {
            DefaultMoveTo(creep, target);
        }
    } else {
        var err = creep.withdraw(target, RESOURCE_ENERGY);
        if(err == ERR_NOT_IN_RANGE) {
            DefaultMoveTo(creep, target);
        }
    }

    return true;
}

function findNewEnergyTarget4Filler(ctx, creep, fillTargetId) {
    // return null if can not carry more
    if(!creep.store || creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        return null;
    }
    // get from dropped energy
    if(ctx.dropedEnergy) {
        var largeEnergy = ctx.dropedEnergy.filter((de) => de.amount >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500));
        if(largeEnergy.length > 0) {
            return creep.pos.findClosestByRange(largeEnergy);
        }
        // TODO:
        // return creep.pos.findClosestByPath(ctx.dropedEnergy);
    }
    // get from hostile structures
    var usefulHostileStructures = creep.room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return s.my != undefined && !s.my && s.store && s.store[RESOURCE_ENERGY] > 0;
        }
    });
    if(usefulHostileStructures.length != 0) {
        return creep.pos.findClosestByRange(usefulHostileStructures);
    }
    // get from source's container
    if(ctx.sourceContainers) {
        var containers = _.filter(ctx.sourceContainers, (c) => c && c.store[RESOURCE_ENERGY] >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500));
        if(containers.length > 0) {
            return creep.pos.findClosestByRange(containers);
        }
    }
    // get from central containers
    if(ctx.centralContainers) {
        var containers = _.filter(ctx.centralContainers, (c) => {
            // stop [get, store] infinite loop.
            return c && fillTargetId != c.id && c.store[RESOURCE_ENERGY] >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500);
        });
        if(containers.length > 0) {
            return creep.pos.findClosestByRange(containers);
        }
    }
    // get from storage
    if(ctx.storage && ctx.storage.store[RESOURCE_ENERGY] > 0) {
        // stop [get, store] infinite loop.
        if(fillTargetId != ctx.storage.id) {
            return ctx.storage;
        }
    }
    // TODO: get from tomestone
    return null;
}

function getValidEnergyTarget4Filler(ctx, creep, fillTargetId) {
    var target = Game.getObjectById(creep.memory.energyTargetId);
    if(!isValidEnergyTarget(target, creep)) {
        delete creep.memory.energyTargetId;
        target = findNewEnergyTarget4Filler(ctx, creep, fillTargetId);
    }
    if(target != null) {
        creep.memory.energyTargetId = target.id;
    }
    return target;
}

function GetEnergy4Filler(ctx, creep, fillTargetId) {
    var target = getValidEnergyTarget4Filler(ctx, creep, fillTargetId);
    return target;
}

function findNewEnergyTarget4ImportantTarget(ctx, creep) {
    // return null if can not carry more
    if(!creep.store || creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        return null;
    }
    // get from central containers
    if(ctx.centralContainers) {
        var containers = _.filter(ctx.centralContainers, (c) => {
            return c.store[RESOURCE_ENERGY] >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500);
        });
        if(containers.length > 0) {
            return creep.pos.findClosestByRange(containers);
        }
    }
    // get from storage
    if(ctx.storage && ctx.storage.store[RESOURCE_ENERGY] > 0) {
        return ctx.storage;
    }
    // TODO: get from tomestone
    return null;
}

function isStorageOrCentralContainer(ctx, target) {
    if(!target) return false;
    if(ctx.storage && target.id == ctx.storage.id) return true;
    if(ctx.centralContainers) {
        for(var i in ctx.centralContainers) {
            if(target.id == ctx.centralContainers[i].id) return true;
        }
    }
    return false;
}

function getValidEnergyTarget4ImportantTarget(ctx, creep) {
    var target = Game.getObjectById(creep.memory.importantEnergyTargetId);
    if(!isStorageOrCentralContainer(ctx, target) || target.store[RESOURCE_ENERGY] == 0) {
        delete creep.memory.importantEnergyTargetId;
        target = findNewEnergyTarget4ImportantTarget(ctx, creep);
    }
    if(target != null) {
        creep.memory.importantEnergyTargetId = target.id;
    }
    return target;
}

function GetEnergy4ImportantTarget(ctx, creep) {
    var target = getValidEnergyTarget4ImportantTarget(ctx, creep);
    return target;
}

function GetEnergyFromStore(ctx, creep) {
    var target = Game.getObjectById(creep.memory.targetId);
    if(!target || !target.structureType || !target.store || target.store[RESOURCE_ENERGY] < 100) {
        target = findNewStore(ctx, creep);
    }
    if(ctx.dropedEnergy.length != 0) {
        // TODO: plan closest
        target = creep.pos.findClosestByRange(ctx.dropedEnergy);
        // target = ctx.dropedEnergy[0];
        // ctx.dropedEnergy = ctx.dropedEnergy.slice(1);
    }
    if(!target) return;

    var err = creep.withdraw(target, RESOURCE_ENERGY);
    if(err == ERR_NOT_IN_RANGE) {
        DefaultMoveTo(creep, target);
    }
    err = creep.pickup(target);
    if(err == ERR_NOT_IN_RANGE) {
        DefaultMoveTo(creep, target);
    }
    creep.memory.targetId = target.id;
    creep.memory.fromWhere = target.id;
}

function GetEnergyFromControllerStore(ctx, creep) {
    var target = ctx.controllerContainer;
    if(target.store[RESOURCE_ENERGY] == 0) {
        if(ctx.storage != undefined && ctx.storage.store[RESOURCE_ENERGY] > 0) {
            target = ctx.storage;
        }
    }
    if(target.store[RESOURCE_ENERGY] == 0) {
        return;
    }

    var err = creep.withdraw(target, RESOURCE_ENERGY);
    if(err == ERR_NOT_IN_RANGE) {
        DefaultMoveTo(creep, target);
    }
}

function IsItemInList(item, lst, eqCond = null) {
    for(var i in lst) {
        if(eqCond == null) {
            if(item == lst[i]) return true;
        } else {
            if(eqCond(item, lst[i])) return true;
        }
    }
    return false;
}

function getContainerPosByFlag(flagName, roomName) {
    var flag = Game.flags[flagName];
    if(!flag || flag.room.name != roomName) return null;
    return flag.pos;
}

function InitSourceAndContainerInfo4Room(roomName) {
    try {
        var room = Game.rooms[roomName];
        room.memory.ctx.sourceIds = {};
        room.memory.ctx.sourceContainerPos = {};
        room.memory.ctx.sourceContainerIds = {};
        room.memory.ctx.centralContainerPos = {};
        room.memory.ctx.centralContainerIds = {};

        var pos = getContainerPosByFlag('cc', roomName);
        if(pos != null){
            room.memory.ctx.controllerContainerPos = pos;
        }
        for(var i in [0, 1]) {
            var flagName = 's' + i;
            var flag = Game.flags[flagName];
            if(flag && flag.room.name == roomName) {
                var sources = room.lookAt(flag.pos).filter((item) => item.type == 'source');
                var source = sources[0].source;
                room.memory.ctx.sourceIds[i] = source.id;
            }
            pos = getContainerPosByFlag('sc' + i, roomName);
            if(pos != null){
                room.memory.ctx.sourceContainerPos[i] = pos;
            }
            pos = getContainerPosByFlag('cc' + i, roomName);
            if(pos != null) {
                room.memory.ctx.centralContainerPos[i] = pos;
            }
        }
    } catch(err) {
        console.log(err.stack);
    }
}

function InitLinkInfo4Room(roomName) {
    var room  = Game.rooms[roomName];

    room.memory.ctx.sourceLinkIds = {};
    for(var i in [0, 0]) {
        var flagName = 'sl' + i;
        var flag = Game.flags[flagName];
        if(flag && flag.room.name == roomName) {
            var links = room.lookAt(flag.pos).filter((item) => item.type == 'structure' && item.structure.structureType == STRUCTURE_LINK);
            var link = links[0].structure;
            room.memory.ctx.sourceLinkIds[i] = link.id;
        }
    }

    var flagName = 'centrall';
    var flag = Game.flags[flagName];
    if(flag && flag.room.name == roomName) {
        var links = room.lookAt(flag.pos).filter((item) => item.type == 'structure' && item.structure.structureType == STRUCTURE_LINK);
        var link = links[0].structure;
        room.memory.ctx.centralLinkId = link.id;
    }
}

function ObjMap(obj, func) {
    var res = {};
    for(var i in obj) {
        res[i] = func(obj[i]);
    }
    return res;
}

function IsEmptyObj(obj) {
    for(var i in obj) {
        return false;
    }
    return true;
}

function TraceError(err, msg = '') {
    if(err) {
        if(err.stack != undefined) {
            console.log(msg + err.stack);
        } else {
            console.log(msg + err);
        }
    }
}

function GetMaxEnergyForSpawn(spawn) {
    var res = spawn.store.getCapacity(RESOURCE_ENERGY);
    var extensions = spawn.room.find(FIND_STRUCTURES, {filter: (structure) => structure.structureType == 'extension' && structure.isActive()});
    for(var i in extensions) {
        res += extensions[i].store.getCapacity(RESOURCE_ENERGY);
    }
    return res;
}

function GetCurEnergyForSpawn(spawn) {
    var res = spawn.store[RESOURCE_ENERGY];
    var extensions = spawn.room.find(FIND_STRUCTURES, {filter: (structure) => structure.structureType == 'extension' && structure.isActive()});
    for(var i in extensions) {
        res += extensions[i].store[RESOURCE_ENERGY];
    }
    return res;
}

function GetPartsByArray(partsArray) {
    var parts = [];
    for(var i in partsArray) {
        var item = partsArray[i];
        for(var j = 0; j < item[1]; j++) {
            parts.push(item[0]);
        }
    }
    return parts;
}

function GetResourceFromStorageAndTerminal(ctx, creep, resourceType = RESOURCE_ENERGY) {
    var target = null;
    if(ctx.storage && ctx.storage.store[resourceType] > 0) {
        target = ctx.storage;
    } else if(ctx.terminal && ctx.terminal.store[resourceType] > 0) {
        target = ctx.terminal;
    }
    if(target == null) return false;

    var err = creep.withdraw(target, resourceType);
    if(err == ERR_NOT_IN_RANGE) {
        DefaultMoveTo(creep, target);
        return true;
    }
    return err == 0;
}

function GetRoomPosition(pos) {
    return new RoomPosition(pos.x, pos.y, pos.roomName);
}

function FindPath(origin, goal, opt = {}) {
    var roadCost = 1;
    var plainCost = 2;
    var swampCost = 10;
    if(opt.moveRate != undefined) {
        plainCost = Math.max(Math.ceil(plainCost / opt.moveRate), 1);
        swampCost = Math.max(Math.ceil(swampCost / opt.moveRate), 1);
    }
    if(opt.buildRoad) {
        roadCost = 10;
        plainCost = 11;
        swampCost = 12;
    }
    return PathFinder.search(origin, goal, {
        plainCost: plainCost,
        swampCost: swampCost,
        maxOps: 20000,
        roomCallback: function(roomName) {
            var room = Game.rooms[roomName];
            if(!room) return;
            costs = new PathFinder.CostMatrix;

            room.find(FIND_STRUCTURES).forEach((struct) => {
                if(struct.structureType == STRUCTURE_ROAD) {
                    costs.set(struct.pos.x, struct.pos.y, roadCost);
                } else if(struct.structureType != STRUCTURE_CONTAINER &&
                            (struct.structureType != STRUCTURE_RAMPART ||
                            !struct.my)) {
                    costs.set(struct.pos.x, struct.pos.y, 0xff);
                }
            });
            if(opt.buildRoad) {
                room.find(FIND_CONSTRUCTION_SITES).forEach((struct) => {
                    if(struct.structureType == STRUCTURE_ROAD && struct.my) {
                        costs.set(struct.pos.x, struct.pos.y, roadCost);
                    }
                });
            }
            if(!opt.buildRoad && !opt.ignoreCreeps) {
                room.find(FIND_CREEPS).forEach((creep) => {
                    costs.set(creep.pos.x, creep.pos.y, 0xff);
                });
            }
            return costs;
        },
    });
}

function FindLongPath(origin, goalList, opt = {}) {
    var path = [], cur = origin;
    for(var goal of goalList) {
        path = path.concat(FindPath(cur, goal, opt).path);
        cur = goal;
    }
    return path;
}

function ParsePathFromMemoryObject(memPath) {
    return memPath.map((pos) => new RoomPosition(pos.x, pos.y, pos.roomName));
}

function listSum(lst) {
    var sum = 0;
    for(var x of lst) {
        sum += x;
    }
    return sum;
}

function ProfileUpdate() {
    if(Memory.profilingflag != undefined) {
        Memory.profileRems = Memory.profilingflag;
        delete Memory.profilingflag;
    } 
    if(Memory.profileRems == undefined) return;
    if(Memory.profileRems < 0) {
        delete Memory.profileRems;
        delete Memory.profileMsg;
        delete Memory.profileMean;
        delete Memory.curCpu;
    } else {
        Memory.profileRems -= 1;
        Memory.curCpu = Game.cpu.getUsed();
    }
}

function ProfileStage(msg, showHis = false, summary = false) {
    if(Memory.profileRems == undefined) return;
    if(Memory.profileMsg == undefined) {
        Memory.profileMsg = {};
        Memory.profileMean = {};
    }
    if(Memory.profileMsg[msg] == undefined) Memory.profileMsg[msg] = [];
    var curCpu = Game.cpu.getUsed();
    Memory.profileMsg[msg].push(curCpu - Memory.curCpu);
    Memory.curCpu = curCpu;
    if(Memory.profileRems == 0) {
        var profileList = Memory.profileMsg[msg];
        Memory.profileMean[msg] = listSum(profileList) / profileList.length;
        if(showHis) {
            console.log(msg, listSum(profileList) / profileList.length, profileList);
        } else {
            console.log(msg, listSum(profileList) / profileList.length);
        }
        if(summary) {
            var sum = Memory.memoryFetchTime;
            for(var i in Memory.profileMean) {
                sum += Memory.profileMean[i];
            }
            console.log('Total cpu used: ' + sum);
            console.log('Actually used by this tick: ', Game.cpu.getUsed());
        }
    }
}

function StartProfiling(ticks) {
    Memory.profilingflag = ticks;
}

function GetObjByArray(arr) {
    var res = {};
    for(var i in arr) {
        res[arr[i][0]] = arr[i][1];
    }
    return res;
}

function GetResourcesStats(resourceType) {
    var sum = 0;
    for(var roomName in Game.rooms) {
        var room = Game.rooms[roomName];
        if(room.ctx.terminal) {
            sum += room.ctx.terminal.store[resourceType];
        }
        if(room.ctx.storage) {
            sum += room.ctx.storage.store[resourceType];
        }
    }
    return sum;
}

function DistanceInRange(pos1, pos2) {
    if(pos1.roomName != pos2.roomName) return 100000;
    return Math.max(pos1.x - pos2.x, pos1.y - pos2.y);
}

function Any(iterable, condition = null) {
    for(var idx in iterable) {
        var item = iterable[idx];
        if(condition == null || condition(item)) {
            return item;
        }
    }
    return null;
}

module.exports = {
    get_positions_by_dist,
    GetDirectDistance,
    CmpByObjDist2GivenPos,
    DefaultMoveTo,
    IsSamePosition,
    GetMyCreepsByRole,
    GetEnergyFromStore,
    GetEnergyFromControllerStore,
    IsItemInList,
    GetEnergy4Worker,
    GetEnergy4Filler,
    InitSourceAndContainerInfo4Room,
    ObjMap,
    IsEmptyObj,
    GetEnergy4ImportantTarget,
    TraceError,
    GetMaxEnergyForSpawn,
    GetCurEnergyForSpawn,
    GetPartsByArray,
    GetResourceFromStorageAndTerminal,
    InitLinkInfo4Room,
    GetRoomPosition,
    FindPath,
    ProfileUpdate,
    ProfileStage,
    StartProfiling,
    GetObjByArray,
    GetResourcesStats,
    DistanceInRange,
    Any,
    FindLongPath,
    ParsePathFromMemoryObject,
};