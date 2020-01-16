declare module "*.json" {
    const value: any;
    export default value;
}

declare module '*.scss' {
    const content: {[className: string]: string};
    export = content;
  }