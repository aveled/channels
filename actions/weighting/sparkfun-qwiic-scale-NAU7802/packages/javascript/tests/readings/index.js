const NAU7802 = require('../../distribution').default;



const address = 0x45;
const scale = new NAU7802(
    address,
    {
        debug: true,
    },
);


const loopRead = async  () => {
    await scale.begin(1);

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


const singleRead = async () => {
    await scale.begin(1);

    const reading = await scale.getReading();
    console.log('reading', reading);
}


const main = async () => {
    singleRead();
    // loopRead();
}


main();
