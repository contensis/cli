export const findByIdOrName = (arr: any[], idOrName: string, exact = false) =>
  arr.find(
    r =>
      r.id === idOrName ||
      r.name.toLowerCase() === idOrName.toLowerCase()
  ) ||
  (!exact &&
    arr.find(r => r.name.toLowerCase().includes(idOrName.toLowerCase())));
