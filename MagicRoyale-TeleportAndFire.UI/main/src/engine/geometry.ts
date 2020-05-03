import { X_Y, Size } from "./common";

/** Входит ли указанная точка в прямоугольник 
 * @param point - собтственно проверяемая точка
 * @param rectangleCoordinates - левая верхняя координата прямоугольника
 * @param rectangleWidth - ширина прямоугольника
 * @param rectangleHeight - высота прямоугольника
*/
export function IsBelongingPointToRectangle(point: X_Y, rectangleCoordinates: X_Y, 
                            rectangleWidth: number, rectangleHeight: number) : boolean{
    if (point.x >= rectangleCoordinates.x &&
        point.x <= rectangleCoordinates.x + rectangleWidth &&
        point.y >= rectangleCoordinates.y &&
        point.y <= rectangleCoordinates.y + rectangleHeight){

        return true;
    }

    return false;
}


/** входит ли указанная точка в круг 
 * @param point - собственно точка
 * @param circleCenter - центр окружности
 * @param radius - радиус круга
*/
export function IsBelongingPointToCirle(point: X_Y, circleCenter: X_Y, radius: number){
    return (point.x - circleCenter.x) * (point.x - circleCenter.x) + 
                (point.y - circleCenter.y) * (point.y - circleCenter.y) <= radius * radius;
}


/** пересекаются ли указанный прямоугольник с указанным кругом 
 * @param rectangleCenter -  центр прямоугольника
 * @param rectangleWidth - ширина прямоугольника
 * @param rectangleHeight - высота прямоугольника
 * @param circleCenter - центр окружности
 * @param circleRadius - радиус окружности
*/
export function IntersectionFigures_RectangleAndCirce(rectangleCenter: X_Y, rectangleSize: Size, 
                                                circleCenter: X_Y, circleRadius: number) : boolean{
    
    // https://codengineering.ru/q/circle-rectangle-collision-detection-intersection-21544/

    let circleDistance = new X_Y(Math.abs(circleCenter.x - rectangleCenter.x), Math.abs(circleCenter.y - rectangleCenter.y));

    if (circleDistance.x > (rectangleSize.width/2 + circleRadius)) { return false; }
    if (circleDistance.y > (rectangleSize.height/2 + circleRadius)) { return false; }

    if (circleDistance.x <= (rectangleSize.width/2)) { return true; } 
    if (circleDistance.y <= (rectangleSize.height/2)) { return true; }

    let cornerDistance_sq = (circleDistance.x - rectangleSize.width/2)^2 + (circleDistance.y - rectangleSize.height/2)^2;

    return (cornerDistance_sq <= (circleRadius ** 2));
}


/** пересекаются ли указанный прямоугольник с другим прямоугольником. Дешевая (быстрая по скорости) операция проверки.
 * 
 * Перейди к функции, чтобы увидеть что значат ее аргументы.
 * 
 * Аргументы, где one и two это прямоугольники:
 * (a.x,a.y)--------------|
 *    |                   |
 *    |                   |
 *    |                   |
 *    |---------------(a.x1,a.y1)
 * (b.x,b.y)---------------------|
 *    |                          |
 *    |                          |
 *    |                          |
 *    |---------------------(b.x1,b.y1)
 */
export function IntersectionFigures_RectangleAndRectangle(oneLeftTop: X_Y, oneRightBottom: X_Y, 
                                                    twoLeftTop: X_Y, twoRightBottom: X_Y) : boolean{

    return ( oneLeftTop.y < twoRightBottom.y || oneRightBottom.y > twoLeftTop.y || 
                oneRightBottom.x < twoLeftTop.x || oneLeftTop.x > twoRightBottom.x )  
}

/** пересекаются ли указанный круг с другим кругом 
 * @param oneCenter - координаты центра первого круга
 * @param oneRadius - радиус первого круга
 * @param twoCenter - координаты центра первого круга
 * @param twoRadius - радиус первого круга
 * 
*/
export function IntersectionFigures_CirceAndCirce(oneCenter: X_Y, oneRadius: number, twoCenter: X_Y, twoRadius: number) : boolean{
    // окружности пересекаются если расстояние между центрами меньше либо равно сумме радиусов

    let distance = distanceBetweenPoints(oneCenter, twoCenter);

    if(distance <= oneRadius + twoRadius) {
        return true
    }

    return false;
}

/** вычислить расстояние между двумя точками на плоскости */
export function distanceBetweenPoints(onePoint: X_Y, twoPoint: X_Y) : number {
    return Math.sqrt(((twoPoint.x - onePoint.x) ** 2) + ((twoPoint.y - onePoint.y) ** 2));
}