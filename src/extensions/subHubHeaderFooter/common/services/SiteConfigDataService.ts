import IConfigData from '../model/IConfigData';

export default class SiteConfigDataServices {
    // Get the header/footer data from the specifed URL
    public static get (site : any): Promise<IConfigData | string> {
        let url = site + "/_api/lists/SubHubConfig/items";

        return new Promise <IConfigData | string>((resolve, reject) => {
            fetch(url, {
                method: 'GET',
                headers: { "Accept": "application/json;" },
                credentials: 'same-origin'    // sends cookies, need for SharePoint AuthN
            })
            .then (results => results.json())
            .then (data => {
                let items = { "siteconfig" : data.value };
                return( <IConfigData> items );
            }).then(data => {
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