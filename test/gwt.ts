export default function (givenAll) {
  async function it_gwt(fns) {
    const scope = {};
    if (givenAll) await givenAll.call(scope);
    for (const fn of fns) {
      await fn.call(scope);
    }
  }

  const it = function (name, ...fns) {
    return globalThis.it(name, it_gwt.bind(this, fns));
  }
  it.only = function (name, ...fns) {
    return globalThis.it.only(name, it_gwt.bind(this, fns));
  }

  return it;
}