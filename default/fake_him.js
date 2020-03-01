const C = require('const');

require('fake_him').fakeHim('spirit', 200000, 200020, 15, "E35N38", "E35N38");
function fakeHim(resourceType, priceLow, priceHigh, timeOut = 5, roomName = C.MainRoomName, buyRoom = C.MainRoomName) {
    if(!Memory.temp) Memory.temp = {};
    if(!Memory.temp.fakeList) Memory.temp.fakeList = [];
    Memory.temp.fakeList.push({
        resourceType: resourceType,
        priceLow: priceLow,
        priceHigh: priceHigh,
        roomName: roomName,
        buyRoom: buyRoom,
        timeOut: timeOut,
        state: 'prepare',
    });
}

function handleFake() {
    if(!Memory.temp) return;
    if(!Memory.temp.fakeList) return;
    for(var i in Memory.temp.fakeList) {
        var info = Memory.temp.fakeList[i];
        switch(info.state) {
        case 'prepare': {
            if(!Game.rooms[info.roomName]) continue;
            if(!Game.rooms[info.roomName].terminal) continue;
            if(!Game.rooms[info.roomName].terminal.my) continue;
            if(Game.rooms[info.roomName].terminal.store[info.resourceType] == 0) continue;
            if(info.priceLow >= info.priceHigh) continue;
            console.log('prepare fake');
            Game.market.createOrder({
                type: ORDER_BUY,
                resourceType: info.resourceType,
                price: info.priceHigh,
                totalAmount: 1,
                roomName: info.buyRoom,
            });
            console.log('create buy order');
            Game.market.createOrder({
                type: ORDER_SELL,
                resourceType: info.resourceType,
                price: info.priceLow,
                totalAmount: 1,
                roomName: info.roomName,
            });
            console.log('create sell order');
            info.startTime = Game.time;
            info.state = 'running';
            break;
        }
        case 'running': {
            var myOrders = Game.market.orders;
            var fakeSell = _.filter(myOrders, (order) => {
                return order.resourceType == info.resourceType &&
                        order.price == info.priceLow && order.roomName == info.roomName &&
                        order.remainingAmount > 0;
            });
            var fakeBuy = _.filter(myOrders, (order) => {
                return order.resourceType == info.resourceType &&
                        order.price == info.priceHigh && order.roomName == info.buyRoom &&
                        order.remainingAmount > 0;
            });
            var sell = _.some(fakeSell) && _.first(fakeSell);
            var buy = _.some(fakeBuy) && _.first(fakeBuy);
            if(!sell && !buy) {
                console.log("useless try!");
                info.state = 'terminate';
            }
            if(!sell) {
                console.log("success!");
                Game.market.cancelOrder(buy.id);
                info.state = 'terminate';
            }
            if(!buy) {
                console.log("shit!");
                // Game.market.cancelOrder(sell.id);
                info.state = 'terminate';
            }
            if(Game.time - info.startTime >= info.timeOut) {
                console.log("time out!");
                Game.market.cancelOrder(sell.id);
                Game.market.cancelOrder(buy.id);
                info.state = 'terminate';
            }
            break;
        }
        }
    }
    Memory.temp.fakeList = Memory.temp.fakeList.filter((info) => info.state != 'terminate');
}

module.exports = {
    fakeHim,
    handleFake,
};