import { X_Y } from "./common";

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


/** пересекаются ли указанный прямоугольник с указанным кругом */
export function IntersectionFigures_RectangleAndCirce(){
    alert("IntersectionFigures_RectangleAndCirce - Не сделано :(");
    throw new Error("IntersectionFigures_RectangleAndCirce - Не сделано :(");    
}


/** пересекаются ли указанный прямоугольник с другим прямоугольником */
export function IntersectionFigures_RectangleAndRectangle(){
    alert("IntersectionFigures_RectangleAndRectangle - Не сделано :(");
    throw new Error("IntersectionFigures_RectangleAndRectangle - Не сделано :(");    
}