import { Test2 } from "./test2";
import { EventDistributor } from "./engine/common";

export class Test1{
    public LolEvent = new EventDistributor();

    public WriteLol(){
        // let msg = this.test2.GetLol();
        // alert(msg);
    }
}