export async function utilitiesFromCache(client, { property, value }) {
  const { rows } = await client.query(
    `SELECT * FROM tailwindcss WHERE property = $1 AND value = $2`,
    [property, value],
  );

  return rows;
}
