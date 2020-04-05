export class X_Y{
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

/** "усыпить исполнение кода" 
 * @param ms - время в мс
*/
export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}