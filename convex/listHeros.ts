import { query } from "./_generated/server";

export default query(async ({ db }): Promise<{}> => {
  console.log("listHeros ");

  return db.table("the_hero").collect();
});
