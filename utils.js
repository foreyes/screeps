/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utils');
 * mod.thing == 'a thing'; // true
 */

var dx = [1, 1, 1, -1, -1, -1, 0, 0];
var dy = [1, 0, -1, 1, 0, -1, 1, -1];

var reset = function() {
    var room = Game.rooms['E33N36'];
    room.memory.has_get_roads_l1 = false;
    room.memory.has_get_extensions_l2 = false;
};

// TODO: resolve remove and create conflict.
var get_roads_l1 = function(ctx) {
    var room = ctx.room, spawn = ctx.spawn, sources = ctx.sources;

    constructing_roads = room.find(FIND_CONSTRUCTION_SITES, {
        filter: (structure) => {
            return structure.my && structure.structureType == 'road';
        }
    }).forEach(function(cr) {
        cr.remove();
    });

    var goals = sources.map((source) => {return source.pos;}).concat(room.controller.pos);
    var res = [];
    goals.forEach(function(val) {
        res = res.concat(PathFinder.search(spawn.pos, {pos: val, range: 1}).path);
    });

    for(var dx = -2; dx <= 2; dx++) {
        for(var dy = -2; dy <= 2; dy++) {
            if(Math.abs(dx) + Math.abs(dy) == 2) {
                var x = spawn.pos.x + dx;
                var y = spawn.pos.y + dy;
                if(Game.map.getRoomTerrain(room.name).get(x, y) == TERRAIN_MASK_WALL) continue;
                room.createConstructionSite(x, y, STRUCTURE_ROAD);
            }
        }
    }

    res.forEach(function(pos) {
        room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
    });
    room.memory.has_get_roads_l1 = true;
};

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

var get_extensions_l2 = function(ctx) {
    var room = ctx.room, spawn = ctx.spawn, rem = 5;

    for(var dist = 3; rem > 0; dist++) {
        var positions = get_positions_by_dist(room, spawn.pos, dist);
        positions = positions.filter((pos) => {
            return room.lookAt(pos).filter((val) => {
                return val.type == 'structure' ||
                       (val.type == 'terrain' && val.terrain == 'wall');
            }).length == 0;
        });
        if(positions.length > rem) {
            positions = positions.slice(0, rem);
        }
        rem = rem - positions.length;
        positions.forEach(function(pos) {
            room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTENSION);
        });
    }
    room.memory.has_get_extensions_l2 = true;
};

var get_extensions_l3 = function(ctx) {
    var room = ctx.room, spawn = ctx.spawn, rem = 5;

    for(var dist = 3; rem > 0; dist++) {
        var positions = get_positions_by_dist(room, spawn.pos, dist);
        positions = positions.filter((pos) => {
            return room.lookAt(pos).filter((val) => {
                return val.type == 'structure' ||
                       (val.type == 'terrain' && val.terrain == 'wall');
            }).length == 0;
        });
        if(positions.length > rem) {
            positions = positions.slice(0, rem);
        }
        rem = rem - positions.length;
        positions.forEach(function(pos) {
            room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTENSION);
        });
    }
    room.memory.has_get_extensions_l3 = true;
};

var get_containers_l3 = function(ctx) {
    var room = ctx.room, spawn = ctx.spawn, sources = ctx.sources;

    var goals = sources.map((source) => {return source.pos;}).concat(room.controller.pos);
    for(var i in goals) {
        var road_path = PathFinder.search(spawn.pos, {pos: goals[i], range: 1}).path;
        var pos = road_path[road_path.length - 1];
        room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
    }

    var poss = get_positions_by_dist(room, spawn.pos, 1).filter((pos) => {
        return room.lookAt(pos).filter((val) => {
            return val.type == 'structure' ||
                   (val.type == 'terrain' && val.terrain == 'wall');
        }).length == 0;
    });
    room.createConstructionSite(poss[0].x, poss[0].y, STRUCTURE_CONTAINER);
    room.memory.has_get_containers_l3 = true;
};

function GetDirectDistance(pos1, pos2) {
    if(pos1.room != pos2.room) {
        MyAlter("Error: not in one room when get distance!");
    }
    var dx = Math.abs(pos1.x - pos2.x);
    var dy = Math.abs(pos1.y - pos2.y);
    return Math.min(dx, dy) + Math.abs(dx - dy);
}

function CmpByObjDist2GivenPos(pos) {
    return function(a, b) {
        return GetDirectDistance(pos, a.pos) >  GetDirectDistance(pos, b.pos);
    }
}

function DefaultMoveTo(creep, target) {
    creep.memory.needMove = true;
    if(creep.memory.stuck < 3) {
        creep.moveTo(target, {reusePath: 10, ignoreCreeps: true, visualizePathStyle: {stroke: '#ffaa00'}});
    } else {
        creep.say('change path');
        creep.moveTo(target, {reusePath: 0, visualizePathStyle: {stroke: '#ffaa00'}});
    }
}

function IsSamePosition(pos1, pos2) {
    return pos1.room = pos2.room && pos1.x == pos2.x && pos1.y == pos2.y;
}

module.exports = {
    // get_source_alter,
    // get_source_rate,
    // count_role,
    // get_energy
    get_positions_by_dist,
    get_roads_l1,
    get_extensions_l2,
    get_extensions_l3,
    get_containers_l3,
    GetDirectDistance,
    CmpByObjDist2GivenPos,
    DefaultMoveTo,
    IsSamePosition,
    reset
}