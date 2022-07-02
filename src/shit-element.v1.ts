import { render } from './shit';

type Properties = {
  [key: string]: {
    type?: (value: string) => any
  }
}

export abstract class ShitElement extends HTMLElement {
  static get styles() { return [] };
  static get properties(): Properties { return {} };

  private internalProperties = {};

  constructor() {
    super();
    const instanceClass = <typeof ShitElement>this.constructor;

    this.attachShadow({ mode: 'open' });
    (this.shadowRoot as any).adoptedStyleSheets = instanceClass.styles;

    Object.entries(instanceClass.properties).forEach(([name, prop]) => {
      this.createProperty(name, prop);
    })
  }

  private createProperty(name: string, prop: Properties[keyof Properties]) {
    this.internalProperties[name] = (prop.type ?? String)(this.getAttribute(name))
    Object.defineProperty(this, name, {
      get: () => this.internalProperties[name],
      set: (v) => {
        this.internalProperties[name] = v;
        this.performUpdate();
      },
    })
  }

  connectedCallback() {
    this.performUpdate();
  }

  performUpdate() {
    render(this.render(), this.shadowRoot!);
  }

  abstract render(): string;
}