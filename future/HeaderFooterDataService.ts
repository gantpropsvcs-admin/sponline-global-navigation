
import { sp, Search, SearchResults, SearchQueryBuilder, SearchQuery, SortDirection } from "@pnp/sp";
import IHeaderFooterData from '../model/IHeaderFooterData';
import ILink from '../model/ILink';

export default class HeaderFooterDataService {

    // Get the header/footer data from the specifed URL
    public static get (url: string, lang: string): Promise<IHeaderFooterData | string> {
        const insert = (arr, index, newItem) => [
            // part of the array before the specified index
            ...arr.slice(0, index),
            // inserted item
            newItem,
            // part of the array after the specified index
            ...arr.slice(index)
        ];

        let langField = "lcid_" + lang;
 
        return new Promise <IHeaderFooterData | string>((resolve, reject) => {

            fetch(url, {
                method: 'GET',
                headers: { "Accept": "application/json;" },
                credentials: 'same-origin'    // sends cookies, need for SharePoint AuthN
            })
            .then (results => results.json())
            .then(data => {
                let headeritems = data.value.filter(d => { return d.HeaderFooter === "Top"; });
                let footeritems = data.value.filter(d => { return d.HeaderFooter === "Footer"; });
                let headerLinks = [];
                let footerLinks = [];

                var curgroup = "";
                var curcol = 0;
                var curcolidx = -1;
                var curgroupidx = -1;

                headeritems.forEach((link, idx) => {
                    link.Html = "";
                    link.NavGroup.Title = (link.NavGroup[langField] != null && link.NavGroup[langField] != "") ? link.NavGroup[langField] : link.NavGroup.Title;
                    if (link.NavGroup.Title != curgroup) {
                        curcol = 0;
                        curcolidx = -1;
                        curgroupidx = -1;
                        curgroup = link.NavGroup.Title;
                        var group = {
                            "NavGroup":{
                                "Title": curgroup,
                                "GroupOrder" : 0
                            },
                            "Title":curgroup,
                            "Url":"/",
                            "HeaderFooter":"Top",
                            "IsHeader":true,
                            "Html": "",
                            "Column":link.Column,
                            "NavOrder":0,
                            "OpenInNewWindow":false,
                            "children" : []
                        };
                        
                        curgroupidx = headerLinks.push(group);

                        
                    }
                    
                    if (parseInt(link.Column) != curcol) {
                        curcol = link.Column;

                        curcolidx = headerLinks[curgroupidx-1].children.push({
                            "NavGroup":{
                                "Title": "Column" + link.Column,
                                "GroupOrder" : 0
                            },
                            "Title":"Column" + link.Column,
                            "Url":"/",
                            "HeaderFooter":"Top",
                            "IsHeader":false,
                            "Column":link.Column,
                            "NavOrder":0,
                            "OpenInNewWindow":false,
                            "Html": "",
                            "children" : []
                        });
                    } 

                    let hasLang = (link[langField] != null && link[langField] != "");
                    link.Title = (hasLang) ? link[langField] : link.Title;
                        
                    headerLinks[curgroupidx-1].children[curcolidx-1].children.push(link);
                });

                curgroup = "";
                curcol = 0;
                curcolidx = -1;
                curgroupidx = -1;

                footeritems.forEach((link, idx) => {
                    if (parseInt(link.Column) != curcol) {
                        curcol = link.Column;

                        curcolidx = footerLinks.push({
                            "NavGroup":{
                                "Title": "Column" + curcol,
                                "GroupOrder" : 0
                            },
                            "Title":"Column" + curcol,
                            "Url":"#",
                            "HeaderFooter":"Footer",
                            "IsHeader":true,
                            "Column":link.Column,
                            "NavOrder":0,
                            "OpenInNewWindow":false,
                            "Html": "",
                            "children" : []  
                        });
                    }

                    link.NavGroup.Title = (link.NavGroup[langField] != null || link.NavGroup[langField] != "") ? link.NavGroup[langField] : link.Title;
                    
                    if (link.NavGroup.Title  != curgroup) {
                        curgroup = link.NavGroup.Title;

                        curgroupidx = footerLinks[curcolidx-1].children.push({
                            "NavGroup":{
                                "Title": curgroup,
                                "GroupOrder" : 0
                            },
                            "Title":curgroup,
                            "Url":"/",
                            "HeaderFooter":"Footer",
                            "IsHeader":true,
                            "Column":link.Column,
                            "NavOrder":0,
                            "OpenInNewWindow":false,
                            "Html": "",
                            "children" : []
                        });

                    }         
                    
                    let hasLang = (link[langField] != null && link[langField] != "");
                    link.Title = (hasLang) ? link[langField] : link.Title;

                    footerLinks[curcolidx-1].children[curgroupidx-1].children.push(link);
                });        
                
                

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
            //.catch ((error) => {
                // Bad news, we couldn't even issue an HTTP request
            //    reject('Error requesting header footer data');
            //});
            
        });
    }
}