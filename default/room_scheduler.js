var utils = require('utils');
var stages = require('stage_scheduler').stages;

var roleMap = {
    spawn: require('role_spawn'),
    upgrader: require('role_upgrader'),
    repairer: require('role_repairer'),
    builder: require('role_builder'),
    filler: require('role_filler'),
    miner: require('role_miner'),
    tower: require('role_tower'),
    specialer: require('role_specialer'),
    mineraler: require('role_mineraler'),
};

function Run(gCtx, room) {
    var ctx = room.ctx;

    if(room.name == 'E33N36') {
        if(room.memory.statController == undefined || Game.time % 1000 == 2) {
            if(room.memory.statController == undefined) {
                room.memory.statController = [room.controller.progress];
            }
            room.memory.statController.push(room.controller.progress - room.memory.statController[0]);
        }
    }

    try {
        if(ctx.storage) {
            if(ctx.room.memory.storageStat == undefined) {
                ctx.room.memory.storageStat = ctx.storage.store[RESOURCE_ENERGY];
            }
            if(ctx.room.memory.storageHis == undefined) {
                ctx.room.memory.storageHis = [];
            }
            if(Game.time % 1000 == 0) {
                ctx.room.memory.storageHis.push(ctx.storage.store[RESOURCE_ENERGY] - ctx.room.memory.storageStat);
                ctx.room.memory.storageStat = ctx.storage.store[RESOURCE_ENERGY];
            }
        }
    } catch(err) {
        var errMsg = 'Storage stats in Room ' + room.name + ": ";
        utils.TraceError(err, errMsg);
    }

    try {
        // run room scheduler logic
        // step1: if a task is ready, pick it into ready.
        var newWait = [], ready = [];
        for(var i in room.memory.ctx.Wait) {
            var task = room.memory.ctx.Wait[i];
            if(task.wait == 0) {
                ready.push(task.name);
            } else {
                newWait.push(task);
            }
        }
        // step2: run init function for ready tasks, then push into Running.
        room.memory.ctx.Wait = newWait;
        for(var i in ready) {
            var name = ready[i];
            var task = stages[name];
            task.init(ctx, task.next);
            room.memory.ctx.Running.push(name);
        }
        // step3: run loop function for Running tasks, check if need terminate.
        var newRunning = [];
        for(var i in room.memory.ctx.Running) {
            var name = room.memory.ctx.Running[i];
            var task = stages[name];
            if(task.loop(ctx)) {
                task.terminate(ctx, task.next);
            } else {
                newRunning.push(name);
            }
        }
        room.memory.ctx.Running = newRunning;
    } catch(err) {
        var errMsg = 'Room Scheduler in ' + room.name + ": ";
        utils.TraceError(err, errMsg);
    }

    // run tower logic.
    try {
        for(var i in ctx.towers) {
            roleMap['tower'].Run(ctx, ctx.towers[i]);
        }
    } catch(err) {
        var errMsg = 'Tower in ' + room.name + ": ";
        utils.TraceError(err, errMsg);
    }

    // run role logic.
    var spawn = ctx.spawn, room = ctx.room;

    for(var name in ctx.creeps) {
        try {
            var creep = ctx.creeps[name];
            if(creep.spawning) continue;
            var start = Game.cpu.getUsed();

            // update stuck count
            if(creep.memory.needMove && utils.IsSamePosition(creep.memory.lastPos, creep.pos)) {
                creep.memory.stuck += 1;
            } else {
                creep.memory.stuck = 0;
            }
            creep.memory.needMove = false;
            creep.memory.lastPos = creep.pos;
            // run role logic

            // no role
            if(!creep.memory.role) continue;
            // special roles
            if(creep.memory.role == 'mister') {
                require('mister').Run(ctx, creep);
                continue;
            }
            if(creep.memory.role == 'simple_outer') {
                require('role_simple_outer').Run(ctx, creep);
                continue;
            }
            if(creep.memory.role == 'outMiner') {
                require('role_outMiner').Run(ctx, creep);
                continue;
            }
            if(creep.memory.role == 'outReserver') {
                require('role_outReserver').Run(ctx, creep);
                continue;
            }
            if(creep.memory.role == 'outCarrier') {
                require('role_outCarrier').Run(ctx, creep);
                continue;
            }
            if(creep.memory.role == 'defender') {
                require('role_defender').Run(ctx, creep);
                continue;
            }
            // normal role
            if(creep.room.name != room.name) {
                utils.DefaultMoveTo(creep, new RoomPosition(25, 25, room.name));
            } else {
                roleMap[creep.memory.role].Run(ctx, creep);
            }
            gCtx.creepCpu[creep.name] = Game.cpu.getUsed() - start;
        } catch(err) {
            console.log(creep.memory.role);
            var errMsg = 'Creep ' + name + ' in ' + room.name + ": ";
            utils.TraceError(err, errMsg);
        }
    }
    try {
        // run main spawn first, and at most spawn one creep pre tick.
        if(spawn != undefined) {
            var err = roleMap['spawn'].Run(ctx, spawn);
            if(err != 0) {
                for(var i in ctx.spawns) {
                    if(ctx.spawns[i].name != spawn.name) {
                        var err = roleMap['spawn'].Run(ctx, ctx.spawns[i], false);
                        if(err == 0) {
                            break;
                        }
                    }
                }
            }
        }
    } catch(err) {
        var errMsg = 'Spawn in ' + room.name + ": ";
        utils.TraceError(err, errMsg);
    }

    if(ctx.factory && ctx.room.name == 'E33N36') {
        // ctx.factory.produce(RESOURCE_LEMERGIUM_BAR);
        ctx.factory.produce(RESOURCE_ZYNTHIUM_BAR);
        // ctx.factory.produce(RESOURCE_KEANIUM_BAR);
        ctx.factory.produce(RESOURCE_OXIDANT);
        ctx.factory.produce(RESOURCE_CONDENSATE);
        ctx.factory.produce(RESOURCE_PURIFIER);
    }
    if(ctx.factory && ctx.room.name == 'E35N38') {
        ctx.factory.produce(RESOURCE_KEANIUM_BAR);
        ctx.factory.produce(RESOURCE_ZYNTHIUM_BAR);
    }
    if(ctx.factory && ctx.room.name == 'E29N34' && ctx.terminal && ctx.terminal.store['O'] >= 10000) {
        ctx.factory.produce(RESOURCE_OXIDANT);
    }
    if(ctx.labs) {
        if(ctx.labers.length == 0) {
            require('role_spawn').SpawnCreep('5dc6d24401ce096f94fc8ea6', 'specialer', {parts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], memory: {specialType: 'laber'}});
        }
        ctx.labs[2].runReaction(ctx.labs[0], ctx.labs[1]);
        ctx.labs[3].runReaction(ctx.labs[0], ctx.labs[1]);
    }
    if(ctx.upgrading && ctx.controllerLink) {
        if(ctx.controllerLink.store[RESOURCE_ENERGY] < 400) {
            for(var i in ctx.sourceLinks) {
                var link = ctx.sourceLinks[i];
                if(link.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                    link.transferEnergy(ctx.controllerLink);
                }
            }
            if(ctx.centralLink && ctx.centralLink.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                ctx.centralLink.transferEnergy(ctx.controllerLink);
            }
        }
    } else if(ctx.sourceLinks && ctx.centralLink) {
        for(var i in ctx.sourceLinks) {
            var link = ctx.sourceLinks[i];
            if(link.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                link.transferEnergy(ctx.centralLink);
            }
        }
    }
    if(ctx.room.name == 'E33N36' && ctx.terminal.store[RESOURCE_ENERGY] >= 10000 && ctx.terminal.cooldown == 0) {
        var xs = ctx.terminal.store[RESOURCE_CATALYST];
        var xbars = ctx.terminal.store[RESOURCE_PURIFIER];
        var myOrders = Game.market.getAllOrders((order) => {
            return order.resourceType == RESOURCE_PURIFIER || order.resourceType == RESOURCE_CATALYST;
        });
        if(xs < 100000 && xbars < 20000) {
            var buyx = myOrders.filter((order) => {
                return order.resourceType == RESOURCE_CATALYST && order.type == ORDER_SELL && order.price <= 0.14 && order.amount > 0;
            });
            if(buyx.length > 0) {
                buyx = buyx.sort((a, b) => {
                    return a.price > b.price;
                });
                var order = buyx[0];
                Game.market.deal(order.id, Math.min(8000, order.amount), 'E33N36');
            }
            if(Game.time % 20 == 1) {
                var activeBuyX = _.filter(Game.market.orders, (order) => {
                    return  order.type == ORDER_BUY &&
                            order.resourceType == RESOURCE_CATALYST &&
                            order.amount > 0;
                });
                if(activeBuyX.length == 0) {
                    Game.market.createOrder({
                        type: ORDER_BUY,
                        resourceType: RESOURCE_CATALYST,
                        price: 0.13,
                        totalAmount: 10000,
                        roomName: "E33N36"
                    });
                } else {
                    if(activeBuyX[0].remainingAmount < 10000) {
                        Game.market.extendOrder(activeBuyX[0].id, 10000 - activeBuyX[0].remainingAmount);
                    }
                }
            }
        }
        if(xbars > 1000) {
            var sells = myOrders.filter((order) => {
                return order.resourceType == RESOURCE_PURIFIER && order.type == ORDER_BUY && order.price >= 0.96 && order.amount > 0;
            });            if(sells.length > 0) {
                sells = sells.sort((a, b) => {
                    return a.price < b.price;
                });
                var order = sells[0];
                Game.market.deal(order.id, Math.min(8000, xbars, order.amount), 'E33N36');
            }
        }
    }
    if(Game.rooms.E33N36.storage.store[RESOURCE_ENERGY] + Game.rooms.E33N36.terminal.store[RESOURCE_ENERGY] < 900000) {
        if(ctx.room.name != 'E33N36' && ctx.terminal && ctx.terminal.store[RESOURCE_ENERGY] >= 50000) {
            ctx.terminal.send(RESOURCE_ENERGY, 40000, 'E33N36');
        }
    }
}

module.exports = {
    Run,
};