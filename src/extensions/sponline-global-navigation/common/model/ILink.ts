// Any menu link
export default interface ILink {
    Title: string;
    Url: string;
    NavGroup : any;
    IsHeader: boolean;
    Column: number;
    NavOrder: number;
    OpenInNewWindow: boolean;
    IsCont: boolean;
    Html: string;
    children : ILink[];
}