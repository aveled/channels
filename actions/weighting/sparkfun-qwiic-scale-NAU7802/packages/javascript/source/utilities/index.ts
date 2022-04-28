// #region module
/**
 * Wait for a number of milliseconds.
 *
 * @param time
 */
const delay = async (
    time: number,
) => {
    await new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    });
}
// #endregion module



// #region exports
export {
    delay,
};
// #endregion exports
