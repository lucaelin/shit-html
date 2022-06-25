import { render } from './shit';

type ShitProperties = { [key: string]: ShitProperty }
type ShitProperty = {
  type?: (value: string) => any,
  attribute?: boolean,
  /* TODO actually figure out what they do
  reflect: boolean,
  converter: { 
    fromAttribute: this.type || (v: string)=>any, 
    toAttribute: (v: any)=>any, 
  },
  state,
  hasChanged,
  */
}

export abstract class ShitElement extends HTMLElement {
  updatePending?: Promise<void>;
  private firstUpdate = false;
  private internalProperties: { [key: string]: any } = {};

  static get styles() { return [] };
  static get observedAttributes() {
    return Object.entries(this.properties)
      .filter(([_name, settings]) => settings.attribute ?? true)
      .map(([name]) => name);
  };
  static get properties(): ShitProperties {
    return {};
  }

  constructor() {
    super();
    const instanceClass = <typeof ShitElement>this.constructor;

    this.attachShadow({ mode: 'open' });
    (this.shadowRoot as any).adoptedStyleSheets = instanceClass.styles;

    Object.entries(instanceClass.properties).forEach(([name, props]) => {
      this.internalProperties[name] = (props.type ?? String)(this.getAttribute(name))
      Object.defineProperty(this, name, {
        get: () => this.internalProperties[name],
        set: (v) => {
          this.internalProperties[name] = v;
          this.requestUpdate();
        },
        configurable: true,
      })
    })
  }

  connectedCallback() {
    this.performUpdate();
  }

  requestUpdate() {
    if (!this.updatePending) {
      this.updatePending = new Promise((res) => {
        queueMicrotask(() => {
          this.performUpdate();
          res();
          this.updatePending = undefined;
        });
      })
    }
    return this.updatePending;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    const instanceClass = <typeof ShitElement>this.constructor;
    const prop = instanceClass.properties[name];
    this[name] = (prop.type ?? String)(newValue);
    this.requestUpdate();
  }

  performUpdate() {
    render(this.render(), this.shadowRoot!);
    if (!this.firstUpdate && this.firstUpdated) this.firstUpdated()
    this.firstUpdate = true;
  }

  firstUpdated() { };
  abstract render(): Parameters<typeof render>[0];
}