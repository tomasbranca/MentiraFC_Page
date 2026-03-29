import { client } from "../sanity.client";
import { TABLE_QUERY } from "../queries/table.queries";
import { adaptTable } from "../adapters/table.adapter";

export const getTable = async () => {
  const data = await client.fetch(TABLE_QUERY);
  return adaptTable(data);
};