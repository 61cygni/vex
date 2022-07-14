import { query } from "./_generated/server";

export default query(async ({ db }): Promise<{}> => {
  const hero = await db.table("the_hero").first();
  console.log("Got hero");
  if (hero === null) {
    console.log("hero is null :(");
    return 0;
  }
  console.log("hero flying back ");
  return hero;
});
