// Дополнительные фичи
// - Получить\вставить\удалить куки
// - Проверка телефон или компьютер
// - Сенсорный экран или нет
// - Сделать на весь экран

/** класс со статическими ф-ия дающими ответ что за мобильное или нет нет устройство */
export class WhatIsDevice{
    public static isAnyMobile() : boolean{
        return WhatIsDevice.isAndroid() 
                || WhatIsDevice.isBlackBerry() 
                || WhatIsDevice.isiOS() 
                || WhatIsDevice.isOpera() 
                || WhatIsDevice.isWindows();   
    }
    public static isAndroid() : boolean{
        if(navigator.userAgent.match(/Android/i).length > 0){
            return true;
        }
        return false    
    }
    public static isBlackBerry() : boolean{
        if(navigator.userAgent.match(/BlackBerry/i).length > 0){
            return true;
        }
        return false    
    }
    public static isiOS() : boolean{
        if(navigator.userAgent.match(/iPhone|iPad|iPod/i).length > 0){
            return true;
        }
        return false    
    }
    public static isOpera() : boolean{
        if(navigator.userAgent.match(/Opera Mini/).length > 0){
            return true;
        }
        return false    
    }
    public static isWindows() : boolean{
        if(navigator.userAgent.match(/IEMobile/i).length > 0){
            return true;
        }
        return false    
    }
}

/** Указывает сенсорный экран или нет */
export function isTouchDevice() : boolean {
    return !!('ontouchstart' in window);
}


// Куки
/** Вставить куки. Пример: set_cookie("username", "Вася Пупкин");
 * @param name - название ключа (имя куки)
 * @param value - значение ключю (значение куки)
 * @param exp_y - год, до которого хранить куки, если пусто то будет вечно
 * @param exp_m - месяц до которого хранить куки, если пусто то будет вечно
 * @param exp_d - день до которого хранить куки, если пусто то будет вечно
 */
export function set_cookie(name: string, value: string, exp_y: number, exp_m: number, exp_d: number) : void {

    let cookie_string = name + "=" + escape(value);

    if (exp_y) {
        let expires = new Date(exp_y, exp_m, exp_d);
        cookie_string += "; expires=" + expires.toUTCString();
    }

    document.cookie = cookie_string;
}

/** удаление куки по имени (ключу). Пример использования: delete_cookie ( "username" ); */
export function delete_cookie(cookie_name: string) : void {
    let cookie_date = new Date();  // Текущая дата и время
    cookie_date.setTime(cookie_date.getTime() - 1);
    document.cookie = cookie_name += "=; expires=" + cookie_date.toUTCString();
}

/** получить куки по имени (ключу). Пример: var x = get_cookie ( "username" ); */
export function get_cookie(cookie_name: string) : string { // 
    let results = document.cookie.match('(^|;) ?' + cookie_name + '=([^;]*)(;|$)');
    
    if (results)
        return unescape(results[2]);
    else
        return null;
}