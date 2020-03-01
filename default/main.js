// TODOs: suicade logic, build err, refactor stages, extension use
// get position by dist, wall and rampart
var moveThrough = require('move_through');
var utils = require('utils');

function fetchGlobalCtx() {
    return {cpu: Game.cpu.getUsed(), normalCreepCpu: 0, outCreepCpu: 0};
}

function fetchRoomCtx(gCtx, room) {
    if(room.memory.ctx == undefined) {
        require('context').InitRoomCtx(gCtx, room);
    }
    return require('context').FetchRoomCtx(gCtx, room);
}

var marketBuyConfig = {
    [RESOURCE_ZYNTHIUM_BAR]: {
        roomName: 'E33N36',
        amount: 10000,
        price: 0.4,
        least: 2000,
    },
    [RESOURCE_KEANIUM_BAR]: {
        roomName: 'E29N33',
        amount: 30000,
        price: 0.4,
        least: 3000,
    },
    [RESOURCE_UTRIUM_BAR]: {
        roomName: 'E29N34',
        amount: 10000,
        price: 0.4,
        least: 1000,
    },
    [RESOURCE_LEMERGIUM_BAR]: {
        roomName: 'E33N36',
        amount: 10000,
        price: 0.7,
        least: 2000,
    },
    [RESOURCE_REDUCTANT]: {
        roomName: 'E26N31',
        amount: 30000,
        price: 0.4,
        least: 3000,
    },
    [RESOURCE_OPS]: {
        roomName: 'E33N36',
        amount: 30000,
        price: 0.61,
        least: 1000,
    },
    [RESOURCE_POWER]: {
        roomName: 'E29N33',
        amount: 100000,
        price: 2.3,
        least: 1000,
    },
    [RESOURCE_GHODIUM_MELT]: {
        roomName: 'E33N36',
        amount: 20000,
        price: 3.6,
        least: 20000,
    },
    [RESOURCE_CRYSTAL]: {
        roomName: 'E33N36',
        amount: 100000,
        price: 5.5,
        least: 1000,
    },
    [RESOURCE_CONCENTRATE]: {
        roomName: 'E33N36',
        amount: 272,
        price: 120,
        least: 136,
    },
    [RESOURCE_EXTRACT]: {
        roomName: 'E35N38',
        amount: 42,
        price: 1550,
        least: 21,
    },
    [RESOURCE_MICROCHIP]: {
        roomName: 'E33N36',
        amount: 60,
        price: 10000,
        least: 30,
    },
    [RESOURCE_SPIRIT]: {
        roomName: 'E33N36',
        amount: 90,
        price: 5000,
        least: 15,
    },
    [RESOURCE_CIRCUIT]: {
        roomName: 'E33N36',
        amount: 20,
        price: 33000,
        least: 10,
    },
    [RESOURCE_EMANATION]: {
        roomName: 'E33N36',
        amount: 30,
        price: 15000,
        least: 5,
    },
};

var marketSellConfig = {
    [RESOURCE_OXIDANT]: {
        roomName: 'E26N31',
        price: 0.22,
        least: 10000,
    },
    [RESOURCE_SPIRIT]: {
        roomName: 'E35N38',
        price: 6500,
        least: 0,
    },
    [RESOURCE_CRYSTAL]: {
        roomName: 'E33N36',
        price: 6.5,
        least: 30000,
    },
    [RESOURCE_COMPOSITE]: {
        roomName: 'E29N34',
        price: 3.5,
        least: 0,
    },
    [RESOURCE_ESSENCE]: {
        roomName: 'E33N36',
        price: 50000,
        least: 0,
    },
    [RESOURCE_DEVICE]: {
        roomName: 'E33N36',
        price: 75000,
        least: 0,
    }
};

var rushBuyConfig = {
    [RESOURCE_MIST]: {
        roomName: 'E29N33',
        amount: 20000,
        price: 2.3,
        maxPrice: 3.39,
        once: 5000,
    },
    // [RESOURCE_CONDENSATE]: {
    //     roomName: 'E26N31',
    //     amount: 20000,
    //     price: 6.3,
    //     maxPrice: 25,
    //     once: 6000,
    // },
}

function isNpcOrder(roomName) {
    for(var i in roomName) {
        var ch = roomName[i];
        if(ch >= '0' && ch <= '9') {
            if(ch == '0') return true;
        }
    }
    return false;
}

function dealMarket(orders, myOrders) {
    for(var resourceType in rushBuyConfig) {
        var info = rushBuyConfig[resourceType];
        var terminal = Game.rooms[info.roomName].terminal;
        if(terminal && terminal.store[resourceType] >= info.amount) continue;
        var curAmount = terminal.store[resourceType];
        // create order
        var mine = _.filter(myOrders, (order) => {
            return order.type == ORDER_BUY && order.remainingAmount > 0 &&
                    order.resourceType == resourceType;
        });
        if(mine.length == 0) {
            Game.market.createOrder({
                type: ORDER_BUY,
                resourceType: resourceType,
                price: info.price,
                totalAmount: info.once,
                roomName: info.roomName,
            });
            continue;
        }
        // rush buy
        var myPrice = mine[0].price, myId = mine[0].id;
        var higher = orders.filter((order) => {
            return order.type == ORDER_BUY && order.id != myId &&
                    order.resourceType == resourceType &&
                    order.amount > 0 && !isNpcOrder(order.roomName);
        }).sort((a, b) => {
            return b.price - a.price;
        });
        if(higher.length > 0) {
            if(higher[0].price < info.maxPrice) {
                if(higher[0].amount > 1000) {
                    var newPrice = Math.max(info.price, higher[0].price + 0.01);
                    Game.market.changeOrderPrice(myId, newPrice);
                    myPrice = newPrice;
                } else if(higher[0].amount < 10) {
                    Game.market.deal(higher[0].id, higher[0].amount, info.roomName);
                }
            }
        } else {
            if(myPrice > info.price * 1.5) {
                Game.market.changeOrderPrice(myId, myPrice - 0.01);
            }
        }
        // rush sell
        var sells = orders.filter((order) => {
            return order.type == ORDER_SELL && order.resourceType == resourceType &&
                    order.amount > 0 && order.price < myPrice * 1.1;
        }).sort((a, b) => {
            return a.price - b.price;
        });
        if(sells.length > 0) {
            Game.market.deal(sells[0].id, Math.min(8000, info.amount - curAmount, sells[0].amount), info.roomName);
        }
    }

    for(var resourceType in marketBuyConfig) {
        var info = marketBuyConfig[resourceType];
        if(!Game.rooms[info.roomName] || !Game.rooms[info.roomName].terminal || !Game.rooms[info.roomName].terminal.my) {
            continue;
        }
        var terminal = Game.rooms[info.roomName].terminal;
        var curAmount = terminal.store[resourceType];
        if(curAmount < info.least) {
            var exsitOrder = _.filter(myOrders, (order) => {
                return order.type == ORDER_BUY &&
                        order.resourceType == resourceType && order.remainingAmount > 0;
            });
            if(exsitOrder.length == 0) {
                Game.market.createOrder({
                    type: ORDER_BUY,
                    resourceType: resourceType,
                    price: info.price,
                    totalAmount: info.least,
                    roomName: info.roomName,
                });
            } 
        }

        if(terminal.cooldown > 0) continue;

        if(curAmount < info.amount) {
            var targets = orders.filter((order) => {
                return order.type == ORDER_SELL &&
                        order.resourceType == resourceType &&
                        order.amount > 0 && order.price <= info.price;
            }).sort((a, b) => {
                return a.price - b.price;
            });
            if(targets.length > 0) {
                Game.market.deal(targets[0].id, Math.min(8000, info.amount - curAmount, targets[0].amount), info.roomName);
            }
        }
    }

    for(var resourceType in marketSellConfig) {
        var info = marketSellConfig[resourceType];
        if(!Game.rooms[info.roomName] || !Game.rooms[info.roomName].terminal || !Game.rooms[info.roomName].terminal.my) {
            continue;
        }
        var terminal = Game.rooms[info.roomName].terminal;
        var curAmount = terminal.store[resourceType];
        if(curAmount <= info.least) continue;

        // only deal order_buy, won't create order_sell.
        if(terminal.cooldown > 0) continue;

        var targets = orders.filter((order) => {
            // ignore my order
            var roomName = order.roomName;
            if(Game.rooms[roomName] && Game.rooms[roomName].my) return false;

            return order.type == ORDER_BUY &&
                    order.resourceType == resourceType &&
                    order.amount > 0 && order.price >= info.price;
        }).sort((a, b) => {
            return b.price - a.price;
        });
        if(targets.length > 0) {
            Game.market.deal(targets[0].id, Math.min(8000, curAmount - info.least, targets[0].amount), info.roomName);
        }
    }
}

// make sure spawn's adjusted 4 cells are not wall when respawn.
// spawn should not near by sources.
// sort from small to big
// set a restPos Flag
// require('prototype.Creep.move')
module.exports.loop = function() {
    Memory.inConsole = false;
    Memory.processPower = true;
    var targetStorage = Game.getObjectById('5e4d1528513adebfae6760e3');
    if(targetStorage && targetStorage.store[RESOURCE_ENERGY] < 800000 && targetStorage.room.controller.level < 8) {
        Memory.processPower = false;
    }
    // require('fake_him').handleFake();
    var rm = Game.getObjectById('5e2566c0c155efe0d19cdf3b');
    if(rm && rm.hits < 100000) {
        var t = Game.rooms.E35N38.terminal;
        t.send(RESOURCE_SPIRIT, t.store[RESOURCE_SPIRIT], 'E29N33');
        t.send(RESOURCE_EMANATION, t.store[RESOURCE_EMANATION], 'E29N33');
    }

    if(Memory.processPower) {
        try {
            for(var roomName in Game.rooms) {
                var ps = Game.getObjectById(Memory.rooms[roomName].psId);
                if(ps) {
                    ps.processPower();
                }
            }
        } catch(err) {
            var errMsg = 'Run processPower err';
            utils.TraceError(err, errMsg);
        }
    }   

    if(global.runExtension != undefined) {
        try {
            if(global.runExtension()) return 0;
        } catch(err) {
            var errMsg = 'Run extension err';
            utils.TraceError(err, errMsg);
        }
    }

    for(var id in Memory.deposits) {
        if(Game.rooms[Memory.deposits[id].roomName]) {
            if(!Game.getObjectById(id)) {
                delete Memory.deposits[id];
            }
        }
    }

    try {
        require('role_invaderPair').Run();
    } catch(err) {
        var errMsg = 'Invader Pair error: ';
        utils.TraceError(err, errMsg);
    }

    try {
        require('role_invaderPicker').Run();
    } catch(err) {
        var errMsg = 'Invader Picker error: ';
        utils.TraceError(err, errMsg);
    }

    if(Game.cpu.bucket < 2000) {
        var gCtx = fetchGlobalCtx();
        gCtx.allOrders = Game.market.getAllOrders();
        try {
            dealMarket(gCtx.allOrders, Game.market.orders);
        } catch(err) {
            var errMsg = 'Market error: ';
            utils.TraceError(err, errMsg);
        }
        return 0;
    }

    require('room_structure_cache');

    if(Memory.profilingflag == 1 || Memory.profileRems == 1) {
        Memory.memoryFetchTime = Game.cpu.getUsed();
        console.log('Parse memory: ' + Memory.memoryFetchTime);
    }
    Memory.moveCpuUseCur = 0;

    utils.ProfileUpdate();
    // statOutMiner
    Memory.outSpeed = Memory.statOutMiner / (Game.time - Memory.statStart);
    // clear memory
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    // fetch creep cache
    require('cache').FetchCreepCache();
    // cancel unactive orders
    if(Game.time % 1000 == 0) {
        var unactiveOrder = _.filter(Game.market.orders, (order) => {
            return order.amount == 0;
        });
        for(var i in unactiveOrder) {
            Game.market.cancelOrder(unactiveOrder[i].id);
        }
    }
    // fetch global context
    var gCtx = fetchGlobalCtx();

    utils.ProfileStage('Init: ');

    gCtx.allOrders = Game.market.getAllOrders((order) => {
        return true;
        // return order.resourceType == RESOURCE_PURIFIER || order.resourceType == RESOURCE_CATALYST ||
        //         order.resourceType == RESOURCE_OXIDANT || order.resourceType == RESOURCE_CRYSTAL ||
        //         order.resourceType == RESOURCE_EXTRACT || order.resourceType == RESOURCE_COMPOSITE ||
        //         order.resourceType == RESOURCE_SPIRIT || order.resourceType == RESOURCE_POWER;
    });
    utils.ProfileStage('Fetch market: ');

    // global action begin

    // global action end

    // run room scheduler
    var stG = Game.cpu.getUsed();
    for(var i in Game.rooms) {
        try {
            Game.rooms[i].ctx = fetchRoomCtx(gCtx, Game.rooms[i]);
        } catch(err) {
            var errMsg = 'fetch room ' + i + ' error: ';
            utils.TraceError(err, errMsg);
        }
    }

    try {
        require('context').UpdateContext();
    } catch(err) {
        var errMsg = 'update room context error: ';
        utils.TraceError(err, errMsg);
    }
    utils.ProfileStage('Fetch room ctx: ');

    for(var i in Game.rooms) {
        try {
            var room = Game.rooms[i];
            require('room_scheduler').Run(gCtx, room);
        } catch(err) {
            var errMsg = 'room ' + i + ' error: ';
            utils.TraceError(err, errMsg);
        }
    }
    utils.ProfileStage('Run room scheduler: ');

    try {
        require('terminal_scheduler').Run(gCtx);
    } catch(err) {
        var errMsg = 'Terminal scheduler error: ';
        utils.TraceError(err, errMsg);
    }

    utils.ProfileStage('Run terminal scheduler: ');

    for(var i in Game.rooms) {
        try {
            var ctx = Game.rooms[i].ctx;
            if(ctx.my) {
                for(var creep of ctx.managers) {
                    require('role_manager').Run(ctx, creep);
                }
            }
        } catch(err) {
            var errMsg = 'room ' + i + ' manager error: ';
            utils.TraceError(err, errMsg);
        }
    }

    utils.ProfileStage('Run room manager: ');

    for(var powerCreepName in Game.powerCreeps) {
        try {
            var powerCreep = Game.powerCreeps[powerCreepName];
            require('role_powerCreep').Run(powerCreep);
        } catch(err) {
            var errMsg = 'PowerCreep ' + powerCreepName + ' error: ';
            utils.TraceError(err, errMsg);
        }
    }

    utils.ProfileStage('Run power creeps: ');

    // cpu use stats
    if(Memory.cpuUse == undefined) {
        Memory.cpuUse = Game.cpu.getUsed();
    } else {
        Memory.cpuUse = Memory.cpuUse * 0.999 + Game.cpu.getUsed() * 0.001;
    }
    if(Game.time % 100 == 0) {
        console.log(Memory.cpuUse);
    }
    if(Memory.moveCpuUse == undefined) {
        Memory.moveCpuUse = Memory.moveCpuUseCur;
    } else {
        Memory.moveCpuUse = Memory.moveCpuUse * 0.8 + Memory.moveCpuUseCur * 0.2;
    }
    utils.ProfileStage('Stats mean cpu used: ', false, true);
    // console.log('normal: ' + gCtx.normalCreepCpu);
    // console.log('out: ' + gCtx.outCreepCpu);

    try {
        dealMarket(gCtx.allOrders, Game.market.orders);
    } catch(err) {
        var errMsg = 'Market error: ';
        utils.TraceError(err, errMsg);
    }

    try {
        moveThrough.Run();
    } catch(err) {
        var errMsg = 'Move through error: ';
        utils.TraceError(err, errMsg);
    }
};