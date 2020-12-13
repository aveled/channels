const NAU7802 = require('../../distribution');



const main = async () => {
    const address = 0x35;
    const scale = new NAU7802(address);
    scale.begin(1);

    while(true) {
        const reading = scale.getReading();

        console.log('reading', reading);
    }
}


main();
