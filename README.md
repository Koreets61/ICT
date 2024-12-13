# ICT #
ICT Protocol (ICT002)


#### Пример

```
const ICT002 = require('@koreets61/ICT');

const ict = new ICT002('COM9', false);

async function init_ict(){
    
    const billtable = {
        
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
    
    await ict.connect();
    
    ict.on('open_port', async(data) => {
        console.log('Порт ICT открыт');
        console.log(data);
        setTimeout(async () => {
            console.log('Запрашиваю статус...');
            ict.status();
        }, 1000);
    });
    
    ict.on('connect', async() => {
        console.log('Подключен');
    });
    
    ict.on('powerup', async(data) => {
        console.log('Включен');
        console.log(data);
    });
    
    ict.on('status', async(data) => {
        console.warn('Статус: ', data);
        if(data.code === 94){
            console.log('Включаю устройство...');
            await ict.powerUp();
        }
        
    });
    
    ict.on('stacked', async(data) => {
        console.log('Купюра уложена');
        console.log(data);
    });
    
    ict.on('return', async() => {
        console.log('Купюра возвращается');
    });
    
    ict.on('returned', async() => {
        console.log('Купюра возвращена');
    });
    
    ict.on('hibernation', async() => {
        console.log('Включен режим энергосбережения');
    });
    
    ict.on('escrow', async(code_banknote) => {
        console.log('Установленна новая купюра, код в прошивке: ' + code_banknote);
         
        if(billtable.hasOwnProperty(code_banknote)){
            console.log('Купюра распознана как: ' + billtable[code_banknote].cash);
            
            if(billtable[code_banknote].enabled){
                console.log('Купюра разрешена, принимаю...');
                await ict.accepted();
            } else {
                await ict.returned();
            };
            
        } else {
            console.log('Купюра не распознана, возвращаю...');
            await ict.returned();
            
        }
    });
    
    ict.on('error', async(data) => {
        console.log('Ошибка');
        console.log(data);
    });
    
    
    
};

init_ict();
```