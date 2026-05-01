const collections = new Map();
const counters = new Map();

const clone = (value) => JSON.parse(JSON.stringify(value));

const getCollection = (name) => {
  if (!collections.has(name)) {
    collections.set(name, []);
  }

  return collections.get(name);
};

const getNextSequence = async (counterName) => {
  const current = counters.get(counterName) || 0;
  const next = current + 1;
  counters.set(counterName, next);
  return next;
};

const setNextSequence = (counterName, value) => {
  counters.set(counterName, Number(value) || 0);
};

const listCollection = (name, sorter = (left, right) => (Number(right.id) || 0) - (Number(left.id) || 0)) => {
  return clone(getCollection(name)).sort(sorter);
};

const findById = (name, id) => {
  return getCollection(name).find((item) => String(item.id) === String(id)) || null;
};

const findOne = (name, predicate) => {
  return clone(getCollection(name).find(predicate) || null);
};

const filterCollection = (name, predicate, sorter) => {
  const items = getCollection(name).filter(predicate);
  const sorted = sorter ? items.sort(sorter) : items;
  return clone(sorted);
};

const upsertById = (name, record) => {
  const items = getCollection(name);
  const index = items.findIndex((item) => String(item.id) === String(record.id));

  if (index >= 0) {
    items[index] = { ...items[index], ...clone(record) };
    return clone(items[index]);
  }

  items.push(clone(record));
  return clone(record);
};

const updateById = (name, id, updates) => {
  const items = getCollection(name);
  const index = items.findIndex((item) => String(item.id) === String(id));

  if (index < 0) {
    return null;
  }

  items[index] = { ...items[index], ...clone(updates) };
  return clone(items[index]);
};

const deleteById = (name, id) => {
  const items = getCollection(name);
  const index = items.findIndex((item) => String(item.id) === String(id));

  if (index < 0) {
    return false;
  }

  items.splice(index, 1);
  return true;
};

module.exports = {
  getCollection,
  getNextSequence,
  setNextSequence,
  listCollection,
  findById,
  findOne,
  filterCollection,
  upsertById,
  updateById,
  deleteById,
};