require("dotenv").config();

const { faker } = require("@faker-js/faker");
const mysql = require("mysql2");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.json());

const db = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.PORT,
});
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
  console.log("Connected to the MySQL database!");
});
let getRandomSchool = () => {
  return [
    faker.string.uuid(),
    `${faker.company.name()} School`,
    faker.address.streetAddress(true),
    parseFloat(faker.address.latitude(40.477399, 40.917577)),
    parseFloat(faker.address.longitude(-74.25909, -73.700272)),
  ];
};

// Add Schools API
app.post("/addSchool", (req, res) => {
  const { id, name, address, latitude, longitude } = req.body;

  if (!id || !name || !address || !latitude || !longitude) {
    return res.status(400).send({ error: "All fields are required!" });
  }

  const query = `INSERT INTO schools (id ,name, address, latitude, longitude) VALUES (?, ?, ?, ? ,?)`;
  db.execute(
    query,
    [id, name, address, latitude, longitude],
    (err, results) => {
      if (err) return res.status(500).send({ error: err.message });
      res.status(201).send({
        message: "School added successfully!",
        schoolId: results.insertId,
      });
    }
  );
});

// List Schools API
app.get("/listSchools", (req, res) => {
  const userLat = parseFloat(req.query.userLat);
  const userLng = parseFloat(req.query.userLng);

  if (isNaN(userLat) || isNaN(userLng)) {
    return res
      .status(400)
      .send({ error: "Valid user latitude and longitude are required!" });
  }

  const query = `SELECT id, name, address, latitude, longitude FROM schools`;

  db.execute(query, (err, results) => {
    if (err) return res.status(500).send({ error: err.message });

    const schoolDistance = results
      .map((school) => {
        const distance = Math.sqrt(
          Math.pow(school.latitude - userLat, 2) +
            Math.pow(school.longitude - userLng, 2)
        );
        return { ...school, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    res.status(200).send(schoolDistance);
  });
});

app.listen("8080", () => {
  console.log("server is working");
});

// insert user in bulk
// let q = "INSERT INTO schools (id, name, address, latitude ,longitude) VALUES ?";

// let schools = [];
// for (let i = 1; i <= 100; i++) {
//   schools.push(getRandomSchool());
// }

// try {
//   db.query(q, [schools], (err, result) => {
//     if (err) throw err;
//     console.log(result);
//   });
// } catch (err) {
//   console.log(err);
// }

// db.end();
