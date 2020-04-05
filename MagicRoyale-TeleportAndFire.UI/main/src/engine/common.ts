export class X_Y{
    public x: number;
    public y: number;
}

/** "усыпить исполнение кода" 
 * @param ms - время в мс
*/
export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}