const NAU7802 = require('../../distribution').default;



const address = 0x38;
const scale = new NAU7802(
    address,
    {
        debug: true,
    },
);
scale.begin(1);


const loopRead = () => {
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


const singleRead = () => {
    const reading = await scale.getReading();
    console.log('reading', reading);
}


const main = async () => {
    singleRead();
    // loopRead();
}


main();
