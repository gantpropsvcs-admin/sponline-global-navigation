## sponline-global-navigation

This code was written to provide a mega menu for a SharePoint Online intranet.  The basis for SPFX in SPOnline is:
- Node.js
- React
- TypeScript
- gulp as a dev server
- SASS for dynamic style sheets
- webpack for packaging

Microsoft's is somewhat behind the version curve, and the project will not work on versions of Node later than v10.

The project initiates from a scaffold in yeoman that creates all the basic structure of the project.  All the main code is in src\extensions\sponline-global-navigation.  

An SPOnline tenant is required for development and debugging, since it is an extension and SPOnline has hooks that can load localhost Javascript into the cloud tenant.  This is convenient as there is no need for a SharePoint development server (or any lower environment for that matter) keeping the dev footprint light.

The development work was completed on this in June of 2019.

### Solution Architecture

There are two data sources for this extension.  

One is a user-managed list in SharePoint itself.  This makes it easy for navigation to be modifed without IT resources.  The second is using the search engine to get team sites a user has access to and is security trimmed.  Since the framework Microsoft is using is a bit older, await was not part of the orgininal code, so, the data sources are chained calls.

The code is unusual in that due to the way extensions work, injection of the React components happens in one of two placeholders that are globally available.  Outside of that, the React components are typical JSX constructs.

The whole code base is strongly typed via Typescript.

In this project, there were no unit tests written due to time and resources.

To aid performance, the resultant data structures are stored in session storage to prevent continous calls to the list and search engine. 

### Building the code

```bash
git clone the repo
npm i
npm i -g gulp
gulp
```

This package produces the following:

* lib/* - intermediate-stage commonjs build artifacts
* dist/* - the bundled script, along with other resources
* deploy/* - all resources which should be uploaded to a CDN.

### Build options

* gulp clean - TODO
* gulp test - TODO
* gulp serve - TODO
* gulp bundle - TODO
* gulp package-solution - TODO
