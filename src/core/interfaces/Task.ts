export interface TaskItem
{
    name : string;
    description? : string;
    thumbcolor? : string;
    value? : string;
    icon? : string;
    url : string;
    status : string;
    type : string;
    date? : string;
    days? : string;
    checkable : boolean;
    // children? : SidebarItem[];

}

export interface TodayTask
{
    todaytaskitems : TaskItem[];
    itemlimit ? : number;
}