import { Test2 } from "./test2";

export class Test1{
    public test2 = new Test2();

    public WriteLol(){
        let msg = this.test2.GetLol();
        alert(msg);
    }
}