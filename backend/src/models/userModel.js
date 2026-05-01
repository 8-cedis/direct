const { deleteById, findOne, getNextSequence, listCollection, updateById, upsertById } = require("../database/localStore");

const createUser = async ({ name, email, passwordHash }) => {
  const id = await getNextSequence("users");
  const user = {
    id,
    name,
    email,
    password: passwordHash,
    role: "buyer",
    status: "active",
    suspended: false,
    created_at: new Date().toISOString(),
  };

  upsertById("users", user);
  return { id, name, email };
};

const findUserByEmail = async (email) => {
  return findOne("users", (user) => user.email === email);
};

const getAllUsers = async () => {
  return listCollection("users");
};

const updateUserSuspension = async (id, suspended) => {
  const existing = updateById("users", id, {
    suspended: Boolean(suspended),
    status: suspended ? "suspended" : "active",
    updated_at: new Date().toISOString(),
  });

  if (!existing) {
    return false;
  }
  return true;
};

const deleteUserById = async (id) => {
  return deleteById("users", id);
};

module.exports = {
  createUser,
  findUserByEmail,
  getAllUsers,
  updateUserSuspension,
  deleteUserById,
};
