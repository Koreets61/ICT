const { SerialPort } = require('serialport');
const EventEmitter = require("events");

class ICT extends EventEmitter {
    
    cash = 0;
    port = false;
    timer = false;
    
    // Одни из немногих кодов состояния купюрника
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
    
    constructor(_com_port, reset = true){
        super();
        this.path = _com_port;
        this.reset = reset;
    };
    
    async connect(){
        try {

            if(this.path !== null){
                await this.begin(this.path);
            } else {
                this.emit('error', error.message);
                console.log(new Error("path not defined").message);
            };
            
        } catch (error) {
            this.emit('error', error.message);
            throw error;
        }
    };
    
    async begin(path){
        let self = this;
        this.port = new SerialPort({
            path: path,
            baudRate: 9600,
            parity: "Even"
        });

        this.port.on('open', function () {
            
            self.emit('open_port', this.port.openOptions);
            
            if(self.reset){
                this.write([0x30], e => {if(e) this.emit('error', {code: 1000, message: e.message});});
            } else {
                this.write([0x02], e => {if(e) this.emit('error', {code: 1000, message: e.message});});
            };
            
            this.on('data', (chunk) => {
                
                let readBuffer = new Buffer.alloc(0);
                readBuffer = Buffer.concat([readBuffer, chunk], chunk.length + readBuffer.length);
                
                if(self.timer){
                    clearTimeout(self.timer);
                    self.timer = false;
                };
                
                let s = Number(readBuffer[0]);
                let data_s = {
                    code: s,
                    hex_string: "0x" + readBuffer[0].toString(16),
                    description: 'Если Вам известен этот код состояния, пожалуйста сообщите мне об этом по электронной почте koreets61@gmail.com'
                };
                
                if(self.code.hasOwnProperty(s)){
                    data_s['description'] = self.code[s];
                };
                
                self.emit('status', data_s);
                
                if(s === 128){

                    self.emit('connect');
                    this.write([0x02], e => {if(e) this.emit('error', {code: 1000, message: e.message});});
   
                } else if(s === 143){

                    self.emit('powerup', self.cash);
                    this.write([0x02], e => {if(e) this.emit('error', {code: 1000, message: e.message});});
                    
                } else if(s === 16){
                                        
                    self.emit('stacked', self.cash);
                    self.cash = 0;
                
                } else if(s === 17){
                    
                    self.emit('error', {
                        code: this.code,
                        message: this.code[s]
                    });
                    self.cash = 0;
                    
                } else if(s === 41){
                    
                   self.emit('return');
                    self.cash = 0;
                    
                } else if(s === 47){
                    
                   self.emit('returned');
                   self.cash = 0; 
                    
                } else if(s === 94){
                    
                   self.emit('hibernation');
                   self.cash = 0;
                    
                } else if(s === 129){

                    self.emit('escrow', readBuffer[1]);
                    
                };

            });
        });

        this.port.on('error', function (error) {
            self.emit('error', {code: 1001, message: error.message});
        });

        this.port.on('close', function () {
            self.emit('error', {code: 1001, message: "close port"});
        });
    }; 
    
    async accepted(){
        this.port.write([0x02], e => {if(e) this.emit('error', {code: 1000, message: e.message});});
    };
    
    async returned(){
        this.port.write([0x0F], e => {if(e) this.emit('error', {code: 1000, message: e.message});});
    };
    
    async status(){
        this.port.write([0x0C], e => {if(e) this.emit('error', {code: 1000, message: e.message});});
        this.timer = setTimeout(async () => {
            this.emit('error', {code: 1002, message: "Нет связи с устройством"});
        }, 3000);
    };
    
    async reload(){
        this.port.write([0x30], e => {if(e) this.emit('error', {code: 1000, message: e.message});});
    };
    
    async powerUp(){
        this.port.write([0x02], e => {if(e) this.emit('error', {code: 1000, message: e.message});});
    };
    
};


module.exports = ICT;