const { SerialPort } = require('serialport');


class ICT {
    
    wait = false;
    cash = 0;
    
    code = {
        16: 'Купюра уложенна',
        17: 'Ошибка укладки купюры',
        32: 'Ошибка привода',
        36: 'Снят денежный ящик',
        41: 'Идет возврат купюры',
        47: 'Купюра не принята',
        62: 'Все хорошо',
        94: 'Режим энергосбережения',
        128: 'Включен',
        129: 'Новая купюра',
        143: 'Готов к работе'
    };
    
    billtable = {
        64: {
            cash: 10,
            enabled: true
        },
        65: {
            cash: 50,
            enabled: true
        },
        66: {
            cash: 100,
            enabled: true
        },
        69: {
            cash: 5,
            enabled: true
        }
    };
    
    constructor(_com_port, callback){
        
        this.com_port = new SerialPort({
            path: _com_port,
            baudRate: 9600,
            parity: 'Even'
        });  
        
        this.callback = callback;        
    };
    
    init = () => {
        
        this.com_port.on("open", () => {
            
            this.com_port.write([0x30], e => {if(e) callback({status: "error", message: e.message});});

            this.com_port.on('data', (chunk) => {

                let readBuffer = Buffer.alloc(0);
                readBuffer = Buffer.concat([readBuffer, chunk], chunk.length + readBuffer.length);
                
                let s = Number(readBuffer[0]);

                if(s === 128 || s === 143){
                    
                    this.com_port.write([0x02], e => {if(e) this.callback({status: "error", message: e.message});});
                    
                } else if(s === 16){
                    
                    this.callback({
                        status: "ok",
                        cash: this.cash
                    });
                    
                    this.cash = 0;
                
                } else if(s === 17){
                    
                    this.callback({
                        status: "error",
                        message: this.code[s]
                    });
                    
                    this.cash = 0;
                    
                } else if(s === 41){
                    
                    if(!this.wait){
                        this.wait = true;
                        setTimeout(() => {
                            this.com_port.write([0x02], e => {if(e) this.callback({status: "error", message: e.message});});
                            this.wait = false;
                        }, 3000);
                    };
                    
                } else if(s === 94){
                    
                    if(!this.wait){
                        this.com_port.write([0x3e], e => {if(e) this.callback({status: "error", message: e.message});});
                        setTimeout(() => {
                            this.wait = false;
                        }, 3000);
                    };
                    
                } else if(s === 129){
                    
                    this.newbill(readBuffer[1]);
                    
                };

            });

        });
    };
    
    newbill = (credit) => {
 
        if(this.billtable.hasOwnProperty(credit)){

            if(this.billtable[credit].enabled){
                
                this.com_port.write([0x02], e => {if(e) this.callback({status: "error", message: e.message});});
                this.cash = Number(this.billtable[credit].cash);
                
            } else {
                
                this.com_port.write([0x0F], e => {if(e) this.callback({status: "error", message: e.message});});
                callback({
                    status: "error",
                    message: "Номинал " + this.billtable[credit].cash + " запрещен"
                });
            };

        } else {
            this.com_port.write([0x0F], e => {if(e) this.callback({status: "error", message: e.message});});
            this.callback({
                status: "error",
                message: "Неизвестный номинал " + credit
            });
        }
    }
};


module.exports = ICT;