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
    };
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
    GetDirectDistance,
    CmpByObjDist2GivenPos,
    DefaultMoveTo,
    IsSamePosition,
}