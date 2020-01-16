import * as React from 'react';
import ILink from '../model/ILink';

require ('./HeaderFooter.scss');

export interface IHeaderProps {
    links: ILink[];
}

function HeaderNav(props) {
    const column = props.column;
    const numcols = column.children.length;

    return (
        <div className="row">
            { column.children.map(c => {
                return (
                    <HeaderColumn column={c} cols={numcols} /> 
                );
                })
            }
        </div>
    ); 
}

function HeaderColumn(props) {
    const column = props.column;
    const numcols = props.cols;

    let colclass = "column col" + numcols;

    return (
        <div className={colclass}>
            { column.children.map(link => {
                if (link.Html == "") {
                    return (
                        <HeaderLink link={link} />
                    );
                } else {
                    const html = link.Html;
                    return (
                        <span dangerouslySetInnerHTML={{__html: html}}></span>
                    );
                }
                })
            }
        </div>
    );
}

function HeaderLink(props) {

    const link = props.link;
    const url = link.Url;
    const title = link.Title;
    const target = (link.OpenInNewWindow) ? "_blank" : "_self";
    const classname = (link.IsHeader) ? ["navheader"] : [];
    var level1;

    function handleClick(e) {
        e.preventDefault();
//
//        if (typeof (window as any).fwhtrk != "undefined") {
//            (window as any).fwhtrk.page.link = document.title + "|topnav - " + (e.currentTarget as any).innerText + "|1";
//            (window as any)._satellite.track('linkClick');
//        }
        
        window.open(url, target);
    }

    classname.push("navlevel" + link.DisplayLevel);

    if (link.IsCont) {
        classname.push("headercont");
    }

    if (link.DisplayLevel == 1 && !link.IsHeader) {
        level1 = <div className="showmore">&#9657;</div>;
    }

    if (url != "none") {
        return (
            <a href="#" className={classname.join(" ")} onClick={handleClick}>{title}{level1}</a>
        );
    } else {
        return (
            <div className={classname.join(" ")}>{title}{level1}</div>
        );
    }


}

export class Header extends React.Component<IHeaderProps, {}> {

    constructor(props: IHeaderProps) {
        super(props);
    }

    public logoClick(e) {
        e.preventDefault();
        
        window.open("/sites/SPOnline", "_self");
    }

    public render(): JSX.Element {
        const links = this.props.links;
        let columns = [];
        let curcolumn = 0;
    
        links.map( link => {
            if (curcolumn != link.Column) {
                curcolumn = link.Column;
                columns.push(link);
            }
        });

        return (
            <nav className="sh_topNav" role="navigation">
                <div id="sh_nav_hamburger">
                    <input id="sh_nav_select" type="checkbox" />
                    <i className="ms-Icon ms-Icon--GlobalNavButton" title="GlobalNavButton" aria-hidden="true"></i>   
                    <i className="ms-Icon ms-Icon--Cancel" title="CloseGlobalNavButton" aria-hidden="true"></i>
                    <div className="navbar">
                        <div className="sh_logo dropdown">
                            <a href="#" onClick={this.logoClick}><img className="SPOnlineLogo" role="presentation" alt="Site logo" src="/sites/SPOnline/SiteAssets/SPOnlinelogo.png" /></a>
                        </div>
                    { links.map( (c, index) => {
                            var lastclass = (links.length-1 == index) ? "dropdown lastdropdown" : "dropdown"
                            return (
                                <div className={lastclass}>
                                    <div className="dropbtn">
                                        <div className="buttonText">{c.NavGroup["Title"]}</div>
                                    </div>
                                    <div className="dropdown-content">
                                        <HeaderNav column={c} cols={c.children.length} /> 
                                    </div>
                                </div> 
                            );
                        })
                    }
                        
                    </div>
                </div>
            </nav>
        );
    }
}