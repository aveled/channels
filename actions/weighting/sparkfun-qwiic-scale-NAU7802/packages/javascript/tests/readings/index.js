const NAU7802 = require('../../distribution').default;



const main = async () => {
    const address = 0x38;
    const scale = new NAU7802(address);
    scale.begin(1);

    while(true) {
        const reading = await scale.getReading();

        console.log('reading', reading);

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 500);
        });
    }
}


main();
