# ICT #
ICT Protocol (ICT002)


#### Пример

```
const ICT002 = require('@koreets61/ICT');

const ict = new ICT002('COM9', ict_callback);

ict.init();

function ict_callback(data){
    console.log(data);
};
```