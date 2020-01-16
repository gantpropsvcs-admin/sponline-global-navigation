import "@pnp/polyfill-ie11";
import { SearchQueryBuilder } from "@pnp/polyfill-ie11/dist/searchquerybuilder";
import { sp, ISearchQueryBuilder, SearchQuery } from "@pnp/sp";
import IHeaderFooterData from '../model/IHeaderFooterData';

export default class HeaderFooterDataService {
    public static realmenucount : number = 0;
    private static compare(a, b) {
        // Use toUpperCase() to ignore character casing
        const titleA = a.SiteTitle;
        const titleB = b.SiteTitle;
      
        let comparison = 0;
        if (titleA > titleB) {
          comparison = 1;
        } else if (titleA < titleB) {
          comparison = -1;
        }
        return comparison;
      }
    
      private static CheckColumnCount(hub, links, grpidx, colidx, maxitems) {
        let maxlength = links[grpidx-1].children[colidx-1].children.length == maxitems;
        let curcollinks = links[grpidx-1].children[colidx-1].children;
    
        if (maxlength) {
            let curcol = links[grpidx-1].children.push(this.NewNavItem("Column0"));
            
            if (curcollinks[curcollinks.length-1].IsHeader) {
                let lastHub = curcollinks.pop();
                links[grpidx-1].children[curcol-1].push(lastHub);
            } else {
                let hubs = curcollinks.filter(hubitem => {
                    return hubitem.IsHeader;
                });
    
                var curHub = JSON.stringify(hubs.pop());
    
                let newidx = links[grpidx-1].children[curcol-1].children.push(JSON.parse(curHub));
                links[grpidx-1].children[curcol-1].children[newidx-1].Title = links[grpidx-1].children[curcol-1].children[newidx-1].Title + " cont.";   
                links[grpidx-1].children[curcol-1].children[newidx-1].IsCont = true;

                HeaderFooterDataService.realmenucount++;
            }
        }
    
        return links;
      }

    public static NewNavItem (title,url = "none",headerfooter = "Top",isheader = false,grouporder = 0,column = 0,displevel = 1,order = 0,newwindow = false,iscont = false,children = []) {
        return {
            "NavGroup":{
                "Title": title,
                "GroupOrder" : grouporder
            },
            "Title": title,
            "Url":url,
            "HeaderFooter":headerfooter,
            "IsHeader":isheader,
            "Html": "",
            "Column":column,
            "DisplayLevel":displevel,
            "NavOrder":order,
            "OpenInNewWindow":newwindow,
            "IsCont": iscont,
            "children" : children
        };
    }


    // Get the header/footer data from the specifed URL
    public static get (cfg : any): Promise<IHeaderFooterData | string> {
        const ROOT_TITLE = cfg.roottitle;
        let refiners = cfg.refinementfilters;
        let refinerarr = [];
        refinerarr.push(refiners);

        let fields = cfg.searchfields.split(",");

        
        
        return new Promise <IHeaderFooterData | string>((resolve, reject) => {
            const appSearchSettings: SearchQuery = {
                TrimDuplicates: false,
                RowLimit: 500,
                RefinementFilters: refinerarr,
                SelectProperties: fields
              };
              let query: ISearchQueryBuilder = SearchQueryBuilder("(contentclass:sts_site) (contentclass:sts_web)", appSearchSettings);
          
              sp.search(query)
            
            .then(data => {
                let headeritems = data.PrimarySearchResults;
                let headerLinks = [];
                let footerLinks = [];
                let curgroup = "";
                let curcol = 0;
                let curcolidx = -1;
                let curgroupidx = -1;
                const MAXLINKS = 24;
                const COLMAX = Math.ceil(MAXLINKS/2);

                curgroupidx = headerLinks.push(this.NewNavItem("Team Sites"));

                // items are nested logically, but not returned in order.  Due to how we 
                // determine hubs and spokes, need to create a sorted list
                let sortedteamsites = [];
                
                if (headeritems.length > 0) {
                    // if there are items, get onlyh the hubs
                    let tshubs = headeritems.filter(hub => {
                        let h = hub as any;
                        var curDeptId = h.DepartmentId.replace(/[{}]/g, "");
                        var curSiteId = h.SiteId;
                        var curSiteName = h.SiteTitle;
    
                        return (curDeptId == curSiteId && curSiteName != ROOT_TITLE);                      
                    });

                    // sort the hubs
                    tshubs = tshubs.sort(this.compare);

                    // iterate through the hubs
                    tshubs.forEach(hub => {
                        let h = hub as any;

                        // and get the child sites for this hub
                        let hubId = h.DepartmentId.replace(/[{}]/g, "");
                        let hubitems = headeritems.filter(site => {
                            let s = site as any;
                            let curDeptId = s.DepartmentId.replace(/[{}]/g, "");
                            let curSiteId = s.SiteId;

                            return (hubId == curDeptId && hubId != curSiteId);
                        });
                        
                        // only add hub if there are team sites for the hub
                        if (hubitems.length > 0) {
                            // add the hub to the sorted list
                            sortedteamsites.push(h);

                            // sort them alphabetically first
                            hubitems = hubitems.sort(this.compare);

                            // add spoke sites for this hub to the sorted list
                            sortedteamsites = sortedteamsites.concat(hubitems);
                        }

                    });
                }

                // Only need the top 24 sites
                let topteamsites = sortedteamsites.slice(0, MAXLINKS);
                
                // if last item is a hub, remove it
                if (topteamsites.length == MAXLINKS) {
                    let lastItem = topteamsites[MAXLINKS-1];
                    let lastDeptId = lastItem.DepartmentId.replace(/[{}]/g, "");
                    let lastSiteId = lastItem.SiteId;

                    if (lastDeptId == lastSiteId) {
                        topteamsites = topteamsites.slice(0, MAXLINKS-1);
                    }                   
                }

                // process the items needed for the menu
                if (topteamsites.length > 0) {
                    let tslist = [];
                    let curidx = 0;

                    // transform the data from search format to nav format
                    topteamsites.forEach(site => {
                        let isHeader = (site.SiteId == site.DepartmentId.replace(/[{}]/g, ""));
                        let siteurl = (isHeader) ? "none" : site.Path;

                        tslist.push(this.NewNavItem(site.SiteTitle,siteurl,"Top",isHeader,0,((tslist.length<=12) ? 0 : 1),1,curidx++,false,false,[]));
                    });
                    
                    // split the list into two columns
                    let col1 = tslist.slice(0,12);
                    let col2 = tslist.slice(12);

                    // If last of column 1 is a header, delete it and push to the
                    // top of column 2
                    if (col1[col1.length-1].IsHeader) {
                        let hub = col1.pop();
                        col2.unshift(hub);
                    }

                    if (col2.length > 0) {
                        // Neither the last of column 1 or the first of column 2 is not a 
                        // header, need to add hub cont. to the top of the next column
                        if (!col2[0].IsHeader && !col1[col1.length-1].IsHeader) {
                            let hdridx = col1.map(hub => hub.IsHeader).lastIndexOf(true);
                            let cont = JSON.stringify(col1[hdridx]);
                            let newHub = JSON.parse(cont);
                            newHub.IsCont = true;
                            newHub.Title += " cont.";
                            col2.unshift(newHub);
                        }

                        // If last of column 2 is a header, delete it
                        if (col2[col2.length-1].IsHeader) {
                            col2.pop();
                        }
                    }

                    curcolidx = headerLinks[curgroupidx-1].children.push(this.NewNavItem("Column0"));
                    headerLinks[curgroupidx-1].children[0].children = col1;

                    // add col2 if > 0
                    if (col2.length > 0) {
                        curcolidx = headerLinks[curgroupidx-1].children.push(this.NewNavItem("Column0"));
                        headerLinks[curgroupidx-1].children[1].children = col2;
                    }
                    

                    if (headeritems.length > MAXLINKS) {
                        headerLinks[curgroupidx-1].children[curcolidx-1].children.push(this.NewNavItem("My Team Sites","/sites/subhub/sitepages/my-team-sites.aspx","Top",true,0,curcolidx,1,0,false,false,[]));
                    } 
                } else {
                    curcolidx = headerLinks[curgroupidx-1].children.push(this.NewNavItem("Column0","none","Top"));
                        
                    headerLinks[curgroupidx-1].children[curcolidx-1].children.push(this.NewNavItem("No team sites found","none","Top",true,0,curcol));

                    if (headerLinks[curgroupidx-1].children[curcolidx-1].children.length == COLMAX) {
                        curcolidx = headerLinks[curgroupidx-1].children.push(this.NewNavItem("Column0"));
                    }
                }

                let items = { "headerLinks" : headerLinks, "footerLinks" : footerLinks };

                return( <IHeaderFooterData> items );
                })
            .then(data => {
                // It parsed OK, fulfull the promise
                resolve(data);
            })
            .catch((error) => {
                // Bad news, couldn't parse the JSON
                reject('Error parsing header footer data');
            });
           
        });
    }
}

/*
                    let hubs = topteamsites.filter(hub => {
                        let h = hub as any;
                        var curDeptId = h.DepartmentId.replace(/[{}]/g, "");
                        var curSiteId = h.SiteId;
    
                        return (curDeptId == curSiteId);                        
                    });
    
                    //hubs = hubs.sort(this.compare);


                    
                    curcolidx = headerLinks[curgroupidx-1].children.push(this.NewNavItem("Column0"));

                    hubs.forEach(hub => {
                        let hubId = hub.DepartmentId.replace(/[{}]/g, "");
                        let hubitems = topteamsites.filter(spoke => {
                            let curDeptId = spoke.DepartmentId.replace(/[{}]/g, "");
                            let curSiteId = spoke.SiteId;

                            return (hubId == curDeptId && hubId != curSiteId);
                        });

                        headerLinks = this.CheckColumnCount(hub,headerLinks,curgroupidx,curcolidx,COLMAX);
                        curcolidx = headerLinks[curgroupidx-1].children.length;

                        headerLinks[curgroupidx-1].children[curcolidx-1].children.push(this.NewNavItem(hub.Title,"none","Top",true,0,curcol,1,0,false,false,[]));
                        
                        this.realmenucount++;

                        hubitems.some((link, idx) => {
                            this.realmenucount++;

                            let curDeptId = link.DepartmentId.replace(/[{}]/g, "");
                            let curSiteId = link.SiteId;

                            headerLinks = this.CheckColumnCount(hub, headerLinks,curgroupidx,curcolidx,COLMAX);
                            curcolidx = headerLinks[curgroupidx-1].children.length;

                            headerLinks[curgroupidx-1].children[curcolidx-1].children.push(this.NewNavItem(link.Title,link.SPWebUrl,"Top",curDeptId == curSiteId,0,curcol,1,idx,false,false,[]));

                            return this.realmenucount === MAXLINKS;
                        });
                        hubitems.forEach((link, idx) => {
                            
                        });
                    });
*/
