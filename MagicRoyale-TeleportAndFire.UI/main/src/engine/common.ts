export class X_Y{
    public x: Number;
    public y: Number;
}

/** "усыпить исполнение кода" 
 * @param ms - время в мс
*/
export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}