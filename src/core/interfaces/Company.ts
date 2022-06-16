export interface CompanyItem
{
    name : string;
    description? : string;
    thumbcolor? : string;
    value? : string;
    icon? : string;
    url : string;
    checkable? : boolean;
    // children? : SidebarItem[];

}

export interface CompanyItems
{
    companyitems : CompanyItem[];
    itemlimit ? : number;
}