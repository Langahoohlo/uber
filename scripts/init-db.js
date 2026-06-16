const { readFileSync } = require("fs");
const { join } = require("path");

const requirePackage = (name) => {
  try {
    return require(name);
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") throw error;

    const [scope, packageName] = name.startsWith("@")
      ? name.split("/")
      : [null, name];
    const pnpmName = scope
      ? `${scope}+${packageName}@`
      : `${packageName}@`;
    const pnpmRoot = join(__dirname, "..", "node_modules", ".pnpm");
    const entry = require("fs")
      .readdirSync(pnpmRoot)
      .find((item) => item.startsWith(pnpmName));

    if (!entry) throw error;

    return require(
      scope
        ? join(pnpmRoot, entry, "node_modules", scope, packageName)
        : join(pnpmRoot, entry, "node_modules", packageName),
    );
  }
};

const { neon } = requirePackage("@neondatabase/serverless");

const loadEnvFile = () => {
  const envPath = join(__dirname, "..", ".env");

  try {
    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!match) continue;

      const [, key, rawValue = ""] = match;
      if (process.env[key]) continue;

      process.env[key] = rawValue
        .replace(/^['"]|['"]$/g, "")
        .replace(/\\n/g, "\n");
    }
  } catch {
    // The explicit DATABASE_URL check below gives the useful error.
  }
};

const main = async () => {
  loadEnvFile();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add it to .env before running db:init.");
  }

  const sql = neon(process.env.DATABASE_URL);

  await sql`
    CREATE TABLE IF NOT EXISTS drivers (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      profile_image_url TEXT,
      car_image_url TEXT,
      car_seats INTEGER NOT NULL CHECK (car_seats > 0),
      rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      clerk_id VARCHAR(50) UNIQUE NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rides (
      ride_id SERIAL PRIMARY KEY,
      origin_address VARCHAR(255) NOT NULL,
      destination_address VARCHAR(255) NOT NULL,
      origin_latitude DECIMAL(9, 6) NOT NULL,
      origin_longitude DECIMAL(9, 6) NOT NULL,
      destination_latitude DECIMAL(9, 6) NOT NULL,
      destination_longitude DECIMAL(9, 6) NOT NULL,
      ride_time INTEGER NOT NULL,
      fare_price DECIMAL(10, 2) NOT NULL CHECK (fare_price >= 0),
      payment_status VARCHAR(20) NOT NULL,
      driver_id INTEGER REFERENCES drivers(id),
      user_id VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    INSERT INTO drivers (
      id,
      first_name,
      last_name,
      profile_image_url,
      car_image_url,
      car_seats,
      rating
    )
    VALUES
      (1, 'James', 'Wilson', 'https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/', 'https://ucarecdn.com/a2dc52b2-8bf7-4e49-9a36-3ffb5229ed02/-/preview/465x466/', 4, 4.80),
      (2, 'David', 'Brown', 'https://ucarecdn.com/6ea6d83d-ef1a-483f-9106-837a3a5b3f67/-/preview/1000x666/', 'https://ucarecdn.com/a3872f80-c094-409c-82f8-c9ff38429327/-/preview/930x932/', 5, 4.60),
      (3, 'Michael', 'Johnson', 'https://ucarecdn.com/0330d85c-232e-4c30-bd04-e5e4d0e3d688/-/preview/826x822/', 'https://ucarecdn.com/289764fb-55b6-4427-b1d1-f655987b4a14/-/preview/930x932/', 4, 4.70),
      (4, 'Robert', 'Green', 'https://ucarecdn.com/fdfc54df-9d24-40f7-b7d3-6f391561c0db/-/preview/626x417/', 'https://ucarecdn.com/b6fb3b55-7676-4ff3-8484-fb115e268d32/-/preview/930x932/', 4, 4.90)
    ON CONFLICT (id) DO NOTHING;
  `;

  await sql`
    SELECT setval(
      pg_get_serial_sequence('drivers', 'id'),
      (SELECT COALESCE(MAX(id), 1) FROM drivers),
      true
    );
  `;

  console.log("Database initialized: users, drivers, rides.");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
