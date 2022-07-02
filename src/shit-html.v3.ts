function getNodeFromPath(path: number[], root: Node): Node {
  console.log('finding node on', root, 'at', path);
  return path.reduce((p, c) => p.childNodes[c], root);
}

type Markers = { [marker: string]: (node: HTMLElement, value: unknown) => void };

function findValueMarkers(node: Node, path: number[] = [], markers: Markers = {}): Markers {
  if (node instanceof HTMLElement) {
    findValueMarkerAttributes(node, path, markers);
  }
  node.childNodes.forEach((child, i) => {
    // console.log('checking markers in', child);
    if (child instanceof HTMLElement) {
      findValueMarkers(child, [...path, i], markers);
    } else if (child instanceof Text) {
      findValueMarkerText(child, [...path, i], markers)
    }
  });

  return markers;
}

function findValueMarkerAttributes(node: HTMLElement, path: number[] = [], markers = {}) {
  const attrs = node.getAttributeNames();
  attrs.forEach(attr => {
    const marker = node.getAttribute(attr);
    if (attr.startsWith('.')) {
      // console.log('found property', attr, 'on', node);
      markers[marker] = (root: HTMLElement, value) => {
        const node = getNodeFromPath(path, root);
        // console.log('setting property', attr, 'to', value, 'on', node);
        node[attr.slice(1)] = value;
      }
    } else if (attr.startsWith('@')) {
      // console.log('found listener', attr, 'on', node);
      markers[marker] = (root, value) => {
        const node = getNodeFromPath(path, root);
        // console.log('setting listener', attr, 'to', value, 'on', node);
        node.addEventListener(attr.slice(1), value);
      }
    } else if (attr.startsWith('?')) {
      // console.log('found boolean', attr, 'on', node);
      markers[marker] = (root, value) => {
        const node = getNodeFromPath(path, root) as HTMLElement;
        // console.log('setting boolean', attr, 'to', value, 'on', node);
        if (value) {
          node.setAttribute(attr.slice(1), attr);
        } else {
          node.removeAttribute(attr.slice(1));
        }
      }
    } else {
      // console.log('found attribute', attr, 'on', node);
      markers[marker] = (root, value) => {
        const node = getNodeFromPath(path, root) as HTMLElement;
        // console.log('setting attribute', attr, 'to', value, 'on', node);
        node.setAttribute(attr, value);
      }
    }
  });

  return markers;
}

function findValueMarkerText(node: Text, path: number[] = [], markers = {}) {
  if (!node.textContent.startsWith('shit-')) return;
  const marker = node.textContent;

  // console.log('found text', marker, 'on', node);
  markers[marker] = (root, value) => {
    const node = getNodeFromPath(path, root) as HTMLElement;
    // console.log('setting attribute', attr, 'to', value, 'on', node);
    node.replaceWith(String(value));
  }

  return markers;
}

export function html(strParts: TemplateStringsArray, ...exprResults: unknown[]) {
  const store = new Map<string, any>();
  const addToStore = function (x: any) {
    const key = 'shit-' + Math.random().toString(16).split('.').pop();
    store.set(key, x);
    return key;
  };

  const domString = strParts.reduce((previous, next, index) => {
    let exprResult: unknown | ShitTemplate = exprResults[index - 1];
    if ((exprResult as any)?.is === 'shit-template') {
      const innerTemplate = exprResult as ShitTemplate;
      //console.log('nested template', innerTemplate.template.innerHTML);
      [...innerTemplate.store.entries()].forEach(([marker, value]) => {
        //console.log('adopting markers', marker, value);
        store.set(marker, value);
      });
      return previous + innerTemplate.template.innerHTML + next;
    }
    const marker = addToStore(exprResult);
    return previous + marker + next;
  });

  const template = document.createElement('template');
  template.innerHTML = domString;

  return {
    is: "shit-template",
    template: template,
    store: store,
    valueMarkers: findValueMarkers(template.content),
    strings: strParts,
    values: exprResults,
  };
}
type ShitTemplate = ReturnType<typeof html>;

const currentTemplate = Symbol();

export function render(template: ShitTemplate, target: HTMLElement | ShadowRoot) {
  // console.log('rendering', shitTemplate, 'into', target);
  if (!target[currentTemplate] || target[currentTemplate].strings !== template.strings) {
    target.replaceChildren(template.template.content.cloneNode(true));
    target[currentTemplate] = template;
  }

  Object.entries(template.valueMarkers).forEach(([marker, setter]) => {
    // console.log('setting marker', marker, setter);
    const value = template.store.get(marker);
    setter(target as HTMLElement, value ?? marker);
  })
}

export function css(strParts: TemplateStringsArray, ...exprResults: unknown[]) {
  const str = String.raw(strParts, ...exprResults);
  const style = new CSSStyleSheet();
  (style as any).replaceSync(str);
  return style;
}