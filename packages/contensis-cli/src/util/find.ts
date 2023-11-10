export const findByIdOrName = (arr: any[], idOrName: string, exact = false) =>
  arr.find(
    r =>
      r.id === idOrName ||
      (typeof r.name === 'string' &&
        r.name.toLowerCase() === idOrName.toLowerCase()) ||
      (typeof r.name === 'object' &&
        Object.values<string>(r.name || {})?.[0].toLowerCase() ===
          idOrName.toLowerCase())
  ) ||
  (!exact &&
    arr.find(
      r =>
        (typeof r.name === 'string' &&
          r.name.toLowerCase().includes(idOrName.toLowerCase())) ||
        (typeof r.name === 'object' &&
          Object.values<string>(r.name || {})?.[0].toLowerCase() ===
            idOrName.toLowerCase())
    ));
