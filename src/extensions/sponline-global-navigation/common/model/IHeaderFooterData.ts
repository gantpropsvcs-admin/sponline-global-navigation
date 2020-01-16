import ILink from './ILink';

// All top nav data, in the format we expect the JSON to be in
export default interface IHeaderFooterData {
    headerLinks: ILink[];
    footerLinks: ILink[];
}