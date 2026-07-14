
const FILTER_TYPES = {
  exact: (value) => value,                           // { name: "Mouse" }
  regex: (value) => ({ $regex: value, $options: 'i' }), // case-insensitive search
  gte: (value) => ({ $gte: Number(value) }),         // price >= 100
  lte: (value) => ({ $lte: Number(value) }),         // price <= 500
  gt: (value) => ({ $gt: Number(value) }),           // stock > 0
  lt: (value) => ({ $lt: Number(value) }),
  in: (value) => ({ $in: value.split(',').map(v => v.trim()) }),     // status=ACTIVE,CHECKED_OUT
  boolean: (value) => value === 'true'   ,
  dateGte: (value) => ({ $gte: new Date(value) }),  
  dateLte: (value) => ({ $lte: new Date(value) }), 
};

 
function buildFilter(query, schema) {
  const filter = {};

  for (const [queryKey, config] of Object.entries(schema)) {
    if (query[queryKey] === undefined || query[queryKey] === '') continue;
    const field = config.field;
    const type = config.type;
    const rawValue = config.value !== undefined ? config.value : query[queryKey];
    const condition = FILTER_TYPES[type](rawValue);
    if (filter[field] && typeof filter[field] === 'object' && typeof condition === 'object') {
      filter[field] = { ...filter[field], ...condition };
    } else {
      filter[field] = condition;
    }
  }

  return filter;
}


function buildSort(query, allowedFields, defaultField = 'createdAt') {
  const field = allowedFields.includes(query.sort) ? query.sort : defaultField;
  const order = query.order === 'asc' ? 1 : -1;
  return { [field]: order };
}


function buildPagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export { buildFilter, buildSort, buildPagination };