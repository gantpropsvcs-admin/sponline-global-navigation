import * as React from 'react';
import ILink from '../model/ILink';

require ('./HeaderFooter.scss');

export interface IFooterProps {
    links: ILink[];
}

function FooterNav(props) {
    const column = props.column;

    let ellipsisurl = "javascript:return;";

    return (
        
            <div className="menu">
                <div className="navheading menu-item has-children">
                { column.children.map(l => {
                    return (
                        <FooterColumn col={l} />
                    );
                })

                }
                </div>
            </div>
           
    );
}

function FooterColumn(props) {
    const col = props.col;
    
    let header = col.children[0].NavGroup.Title;

    return (
        <div className="childlinks sub-menu">
            <span className="dropbtn">{header}</span>
            {/*<h3>{header}</h3>*/}
            <div className="navlinks">
        { col.children.map(cl => {
            return (
                <FooterLink footerlink={cl} />
                );
            })
        }
            </div>
        </div> 
    );
}


function FooterLink(props) {
    const footerlink = props.footerlink;
    var url = footerlink.Url;
    var title = footerlink.Title;
    var target = (footerlink.OpenInNewWindow) ? "_blank" : "_self";

    function handleClick(e) {
        e.preventDefault();

        if (typeof (window as any).fwhtrk != "undefined") {
            (window as any).fwhtrk.page.link = document.title + "|footernav - " + (e.currentTarget as any).innerText + "|1";
            (window as any)._satellite.track('linkClick');
        }
        
        window.open(url, target);
    }

    return (
        <a className="navlink menu-item" href="#" onClick={handleClick}>{title}</a>
    );
}

function Copyright(props) {
    const text = props.text;

    let curdate = new Date();
    let outstring = curdate.getFullYear().toString() + " " + text;
    
    return (
        <div>&copy; {outstring}</div>
    );
}

export class Footer extends React.Component<IFooterProps, {}> {

    constructor(props: IFooterProps) {
        super(props);
    }

    public render(): JSX.Element {
        const columns = this.props.links;

        return (
        <div id="sh_footer_hamburger">
            <input id="sh_footer_select" type="checkbox" />
            <i className="ms-Icon ms-Icon--GlobalNavButton" title="FooterNavButton" aria-hidden="true"></i>   
            <i className="ms-Icon ms-Icon--Cancel" title="CloseFooterNavButton" aria-hidden="true"></i>
            <div className="bottomNav">
                <div className="links">
                    <div className="linkstop">
                        
            {columns.map(c => {
                return (
                    <FooterNav column={c} />  
                );             
            })}
                    </div>
                </div>
              
                <div className="copyright">
                    <Copyright text=" Subway IP LLC" />
                </div>


            </div>
        </div>
        );
    }
}