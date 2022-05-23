function getNodeFromPath(path: number[], root: Node): Node {
  // console.log('finding node on', root, 'at', path);
  return path.reduce((p, c) => p.childNodes[c], root);
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

function findValueMarkers(node: Node, path: number[] = [], markers = {}) {
  if (node instanceof HTMLElement) {
    findValueMarkerAttributes(node, path, markers);
  }
  node.childNodes.forEach((child, i) => {
    // console.log('checking markers in', child);
    if (child instanceof HTMLElement) {
      findValueMarkers(child, [...path, i], markers);
    } else if (child instanceof Text) {
      if (child.textContent.startsWith('shit-')) {
        markers[child.textContent] = (root, value) => {
          const node = getNodeFromPath(path, root) as Text;
          // console.log('setting child', i, 'to', value, 'on', node);

          if (value.fragment) render(value, node.childNodes[i] as (HTMLElement | Text), { replaceTarget: true })
          else node.childNodes[i].replaceWith(value);
        }
      }
    } else {
      // console.log('unknown node type', child);
    }
  });

  return markers;
}

export interface ShitTemplate {
  fragment: DocumentFragment,
  store: Map<string, unknown>,
  valueMarkers: { [marker: string]: (node: HTMLElement, value: unknown) => {} },
  values: unknown[],
}

export function html(strParts: TemplateStringsArray, ...exprResults: unknown[]): ShitTemplate {
  const store = new Map();
  const addToStore = function (x) {
    const key = 'shit-' + Math.random().toString(16).split('.').pop();
    store.set(key, x);
    return key;
  };

  const domString = strParts.reduce((previous, next, index) => {
    let exprResult = exprResults[index - 1];
    const marker = addToStore(exprResult);
    return previous + marker + next;
  });

  const domTemplate = document.createElement('template');
  domTemplate.innerHTML = domString;
  const fragment = domTemplate.content;

  return {
    fragment: fragment,
    store: store,
    valueMarkers: findValueMarkers(domTemplate.content),
    values: exprResults,
  };
}

export function render(shitTemplate: ShitTemplate, target: HTMLElement | ShadowRoot | Text, { replaceTarget }: { replaceTarget?: boolean } = {}) {
  // console.log('rendering', shitTemplate, 'into', target);

  if (target instanceof Text || replaceTarget && target instanceof HTMLElement) {
    target.replaceWith(shitTemplate.fragment.cloneNode(true));
  } else {
    target.replaceChildren(shitTemplate.fragment.cloneNode(true));
  }

  Object.entries(shitTemplate.valueMarkers).forEach(([marker, setter]) => {
    // console.log('setting marker', marker, setter);
    const value = shitTemplate.store.get(marker);
    setter(target as HTMLElement, value ?? marker);
  })
}

export function css(strParts: TemplateStringsArray, ...exprResults: unknown[]) {
  const str = String.raw(strParts, ...exprResults);
  const style = new CSSStyleSheet();
  (style as any).replaceSync(str);
  return style;
}