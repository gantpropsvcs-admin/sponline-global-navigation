// SPFx imports
import { override } from '@microsoft/decorators';
import { Log } from '@microsoft/sp-core-library';
import {
    BaseApplicationCustomizer, PlaceholderContent, PlaceholderName
} from '@microsoft/sp-application-base';
import { sp, Web } from "@pnp/sp";
import { ISPHttpClientOptions, SPHttpClientResponse, SPHttpClient, IHttpClientOptions, HttpClientResponse } from "@microsoft/sp-http";
import { initializeIcons } from '@uifabric/icons';
initializeIcons();

import HeaderFooterDataService from './common/services/HeaderFooterDataService';
import TeamSitesSearchService from './common/services/TeamSitesSearchService';
import SiteConfigDataService from './common/services/SiteConfigDataService';
import IHeaderFooterData from './common/model/IHeaderFooterData';
import IConfigData from './common/model/IConfigData';
import ComponentManager from './common/components/ComponentManager';

const LOG_SOURCE: string = 'SPOnlineHeaderFooterApplicationCustomizer';
const HUB_KEY : string = "Hub";

/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 */
export interface ISPOnlineHeaderFooterApplicationCustomizerProperties {
    Top: string;
    Bottom: string;
}

/** A Custom Action which can be run during execution of a Client Side Application */
export default class SPOnlineHeaderFooterApplicationCustomizer
    extends BaseApplicationCustomizer<ISPOnlineHeaderFooterApplicationCustomizerProperties> {

        public static navigateToLink(link:String, title:String, newWindow:Boolean) {
            if (newWindow) {
                window.open(link.toString(), "_blank");
            } else {
                window.location.href = link.toString();               
            }

            return false;

        }

        private getPlatformType() {
            if(navigator.userAgent.match(/mobile/i)) {
              return 'Mobile';
            } else if (navigator.userAgent.match(/iPad|Android|Touch/i)) {
              return 'Tablet';
            } else {
              return 'Desktop';
            }
          }

        private _topPlaceholder: PlaceholderContent | undefined;
        private _bottomPlaceholder: PlaceholderContent | undefined;
        private _cachedNavItems: IHeaderFooterData;
        private _rendered = false;
        private static NAV_ITEMS_KEY: string = "SPOnlineNavItems";
        private static NAV_ITEMS_EXPIRED: string = "SPOnlineNavItemsExpiry";
        private static EXPIRE_DURATION: string = "SPOnlineExpireDuration";
        private static NAV_USER:string = "SPOnlineNavUser";

        private RenderNavigation() :void {
            // inject font override at bottom
            let shStyle = document.createElement("style");
            shStyle.innerText = '.ms-Fabric { font-family: SubwaySixInch,"Segoe UI Web (West European)",Segoe UI,-apple-system,BlinkMacSystemFont,Roboto,Helvetica Neue,sans-serif; }';
            document.body.appendChild(shStyle); 

            let shStyleSheet = document.createElement("link");

            shStyleSheet.setAttribute("typeref", "text/css");
            shStyleSheet.setAttribute("rel", "stylesheet");
            shStyleSheet.setAttribute("href", "/sites/SPOnline/siteassets/styles/SPOnline.css");

            document.head.appendChild(shStyleSheet);

            // Get the elements from SPFx
            let data = this._cachedNavItems;
            
            if (this._rendered) { return; }

            let curCulture = this.context.pageContext.cultureInfo.currentUICultureName;

            const header: PlaceholderContent = this.context.placeholderProvider.tryCreateContent(
                PlaceholderName.Top,
                { onDispose : this.onDispose }
            );

            const footer: PlaceholderContent = (location.href.indexOf("_layouts") == -1) ? this.context.placeholderProvider.tryCreateContent(
                PlaceholderName.Bottom,
                { onDispose : this.onDispose }
            ) : null;

            // first, determine if navigation already exists, passing null prevents a new render
            // this is needed for partial page loads and double rendering after adding a change event listener on the 
            // placeholders to fix bottom nav on "see all" pages
            let curheader = document.getElementById("sh_nav_hamburger") == null ? header : null;
            let curfooter = document.getElementById("sh_footer_hamburger") == null ? footer : null; 
               
            if (header || footer) {
                // If we have at least one placeholder, render into it
                ComponentManager.render(header ? header.domElement : null, footer ? footer.domElement : null, data);
                this._rendered = true;
            }

            document.getElementById("sh_search_submit").addEventListener("click", event => { 
                var query = document.getElementById("sh_search_text")["value"];

                if (query != "") {
                    console.log("search was clicked");
                    (window as any).fwhtrk.page.link = "Top nav - search";
                    (window as any)._satellite.track('linkClick');
                    //window.location.href = "/sites/SPOnline/sitepages/search.aspx?q=" + query; 
                    window.location.href = "https://fwh.sharepoint.com/sites/SPOnline/_layouts/15/search.aspx?q=" + query;
                } else {
                    alert("No search term was entered");
                }
            });

            document.getElementById("sh_search_text").addEventListener("keydown", event => { 
                var charCode = event.keyCode || event.which;
                if (charCode == 13) {
                    var query = document.getElementById("sh_search_text")["value"];
                    if (query != "") {
                        console.log("search was clicked");
                        (window as any).fwhtrk.page.link = "Top nav - search";
                        (window as any)._satellite.track('linkClick');
                        //window.location.href = "/sites/SPOnline/sitepages/search.aspx?q=" + query; 
                        window.location.href = "https://fwh.sharepoint.com/sites/SPOnline/_layouts/15/search.aspx?q=" + query;
                    } else {
                        alert("No search term was entered");
                    }
                }
            });

            let platform = this.getPlatformType();


            if (platform == "Mobile" || platform == "Tablet") {
                let dropdowns = document.getElementsByClassName("dropdown");
                let searchdd = dropdowns[dropdowns.length-1];
                let teamsitesdd = dropdowns[dropdowns.length-2];

                let searchlink = document.createElement("a");
                //searchlink.href = "/sites/SPOnline/sitepages/search.aspx";
                searchlink.textContent = "Search";
                searchlink.addEventListener("click", function() {
                    SPOnlineHeaderFooterApplicationCustomizer.navigateToLink("https://fwh.sharepoint.com/sites/SPOnline/_layouts/15/search.aspx", "search", false);
                 });

                let searchbutton = document.createElement("div");
                searchbutton.className = "searchlink";
                searchbutton.appendChild(searchlink);

                let teamsiteslink = document.createElement("a");
                //teamsiteslink.href = "/sites/SPOnline/sitepages/my-team-sites.aspx";
                teamsiteslink.textContent = "Team Sites";
                teamsiteslink.addEventListener("click", function(e) {
                    SPOnlineHeaderFooterApplicationCustomizer.navigateToLink("/sites/SPOnline/sitepages/my-team-sites.aspx", (e.currentTarget as any).innerText, false);
                 });
                
                let teamsitesbutton = document.createElement("div");
                teamsitesbutton.className = "teamsiteslink";
                teamsitesbutton.appendChild(teamsiteslink);
            

                searchdd.innerHTML = "";
                searchdd.appendChild(searchbutton);

                teamsitesdd.innerHTML = "";
                teamsitesdd.appendChild(teamsitesbutton);

                window.addEventListener("blur", function() { 
                    let topnavbutton:any = document.getElementById("sh_nav_select");
                    let footernavbutton:any = document.getElementById("sh_footer_select");

                    if (topnavbutton.checked) {
                        topnavbutton.click();
                    }

                    if (footernavbutton.checked) {
                        footernavbutton.click();
                    }
                      
                });
            }

        }

        @override
        public onInit(): Promise<void> {
            Log.info(LOG_SOURCE, 'Initialized SuHubFooterApplicationCustomizer');
    
            // New promise to give back to SPFx and resolve
            // or reject when we're done
            const promise = new Promise<void>((resolve, reject) => {

            sp.setup({
                spfxContext: this.context
            });

            let cachedNav = sessionStorage.getItem(SPOnlineHeaderFooterApplicationCustomizer.NAV_ITEMS_KEY);
            let cachedNavExpiry = sessionStorage.getItem(SPOnlineHeaderFooterApplicationCustomizer.NAV_ITEMS_EXPIRED);
            let cachedNavUser = sessionStorage.getItem(SPOnlineHeaderFooterApplicationCustomizer.NAV_USER);

            let curUser = this.context.pageContext.user.loginName;
            
            if (cachedNav != null && new Date(cachedNavExpiry) > (new Date()) && curUser == cachedNavUser) {
                //Use cached terms
                this._cachedNavItems = JSON.parse(cachedNav);
                // Wait for the placeholders to be created (or handle them being changed) and then
                // render.

                this.context.placeholderProvider.changedEvent.add(this, this.RenderNavigation);
                // Tell SPFx we are done
                resolve();                
            }
            else {
                let curweb = new Web(this.context.pageContext.web.absoluteUrl);           
                curweb.hubSiteData().then(response => { 
                    let hs = response; //JSON.parse(response as any);
                
                    SiteConfigDataService.get(hs.url)
                        .then((configdata : IConfigData) => {
                            let searchConfig = { 
                                "refinementfilters" : configdata.siteconfig.filter(c => { return c.configkey === "TSRefinements";})[0].configvalue,
                                "searchfields" : (configdata.siteconfig.filter(c => { return c.configkey === "TSFields";})[0].configvalue), 
                                "roottitle" : configdata.siteconfig.filter(c => { return c.configkey === "Hub";})[0].configvalue
                                
                            };

                            // -- UPLOAD JSON WITH MENU CONTENTS AND PUT THE URL HERE --
                            let navfields = configdata.siteconfig.filter(c => { return c.configkey === "NavFields"; })[0].configvalue;
                            let navexpand = configdata.siteconfig.filter(c => { return c.configkey === "NavExpands"; })[0].configvalue;
                            let navorder = configdata.siteconfig.filter(c => { return c.configkey === "NavOrder"; })[0].configvalue;
                            let cachedExpireDuration = Number(configdata.siteconfig.filter(c => { return c.configkey === "CacheExpireDuration"; })[0].configvalue);

                            const url = hs.url + "/_api/Lists/GetByTitle('SPOnline%20Navigation')/items?$select=" + navfields + "&$expand=" + navexpand + "&$orderby=" + navorder;
                            
                            // Read JSON containing the header and footer data
                            HeaderFooterDataService.get(url)
                            .then ((data: IHeaderFooterData) => {

                                TeamSitesSearchService.get(searchConfig)
                                    .then((tsdata : IHeaderFooterData) => {
                                        data.headerLinks = data.headerLinks.concat(tsdata.headerLinks);

                                        
                                        data.headerLinks.push({
                                            "NavGroup":{
                                                "Title": "Search",
                                                "GroupOrder" : 0
                                            },
                                            "Title":"Search",
                                            "Url":"/",
                                            "IsCont":false,
                                            "IsHeader":true,
                                            "Column":0,
                                            "NavOrder":0,
                                            "OpenInNewWindow":false,
                                            "Html": "",
                                            "children" : [{
                                                "NavGroup":{
                                                    "Title": "SearchBox",
                                                    "GroupOrder" : 0
                                                },
                                                "Title":"SearchBox",
                                                "Url":"/",
                                                "IsHeader":true,
                                                "IsCont":false,
                                                "Html": "",
                                                "Column":0,
                                                "NavOrder":0,
                                                "OpenInNewWindow":false,
                                                "children" : [{
                                                    "NavGroup":{
                                                        "Title": "SearchBox",
                                                        "GroupOrder" : 0
                                                    },
                                                    "Title":"SearchBox",
                                                    "Url":"none",
                                                    "IsCont":false,
                                                    "Html": '<div class="sh_wrapper"><input id="sh_search_text" class="sh_search" type="text" placeholder="Search..." /><div id="sh_search_submit"><i class="ms-Icon ms-Icon--Search x-hidden-focus" title="Search" aria-hidden="true"></i></div></div>',
                                                    "IsHeader":true,
                                                    "Column":0,
                                                    "NavOrder":0,
                                                    "OpenInNewWindow":false,
                                                    "children" : []
                                                }]
                                            }]
                                        });

                                        sessionStorage.setItem(SPOnlineHeaderFooterApplicationCustomizer.NAV_USER,curUser);
                                        sessionStorage.setItem(SPOnlineHeaderFooterApplicationCustomizer.NAV_ITEMS_KEY, JSON.stringify(data));

                                        let expirydate = new Date();
                                        expirydate.setMinutes(expirydate.getMinutes() + cachedExpireDuration);
                                        sessionStorage.setItem(SPOnlineHeaderFooterApplicationCustomizer.NAV_ITEMS_EXPIRED, expirydate.toISOString());

                                        //this.RenderNavigation(data);
                                        this._cachedNavItems = data;
                                        this.context.placeholderProvider.changedEvent.add(this, this.RenderNavigation);
                                        // Tell SPFx we are done
                                        resolve();
                                    });    

                                    resolve();
                            })
                            .catch ((error: string) => {
                                console.log('Error in SPOnlineHeaderFooterApplicationCustomizer: ${error}');
                                reject();
                            });
                        });
                    });             
                }

                
            });
            return promise;
        }            
}


