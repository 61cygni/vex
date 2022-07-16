import { mutation } from "./_generated/server";

export default mutation(async ({ db }, id : Id ) => {
  console.log("deleteHero: " + id);
  db.delete(id);
  return id;
});

