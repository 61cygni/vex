import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

export default query(async ({ db }, Id : id, level : number): Promise<{}> => {
  console.log("listHerosNotMe "+Id+" : "+level);

  return db.query("the_hero")
           .filter(q => q.eq(q.field("level"), level))
           .filter(q => q.neq(q.field("_id"), Id))
           .collect();
});
