let express = require("express");
let app = express();
let port = 8080;

app.listen(port, () => {
  console.log(`Servern körs på port ${port}`);
});

const mysql = require("mysql");
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "api2023",
  multipleStatements: true,
});

app.use(express.json()); // ta emot data i JSON-format

const COLUMNS = ["id", "username", "firstname", "lastname", "password"];

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/users", (req, res) => {
  const sql = `SELECT * FROM users ${createCondition(req.query)}`;
  con.query(sql, (err, result) => {
    res.send(result);
  });
});

const createCondition = (query) => {
  const output = Object.keys(query)
    .filter((key) => COLUMNS.includes(key))
    .map((key) => `${key}='${query[key]}'`)
    .join(" OR ");

  return output ? `WHERE ${output}` : "";
};

app.get("/users/:id", (req, res) => {
  const sql = `SELECT * FROM users WHERE id=${req.params.id}`;
  con.query(sql, (err, result) => {
    result.length > 0 ? res.send(result) : res.sendStatus(404);
  });
});

const crypto = require("crypto");
const hash = (data) => crypto.createHash("sha256").update(data).digest("hex");

console.log("'Glass' -> " + hash("Glass"));
console.log("'Godis' -> " + hash("Godis"));

app.post("/users", (req, res) => {
  if (!req.body.username) {
    return res.status(400).send("Username required!");
  }

  const fields = ["username", "firstname", "lastname", "password"];
  const unknownFields = Object.keys(req.body).filter((key) => !fields.includes(key));

  if (unknownFields.length > 0) {
    return res.status(400).send("Unknown fields: " + unknownFields.join(", "));
  }

  let sql = `
    INSERT INTO users (username, firstname, lastname, password)
    VALUES ('${req.body.username}', '${req.body.firstname}', '${req.body.lastname}', '${hash(req.body.password)}');
    SELECT LAST_INSERT_ID() as insertId;
  `;

  con.query(sql, (err, results) => {
    if (err) throw err;
    const insertId = results[1][0].insertId;

    const output = {
      id: insertId,
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
    };

    res.send(output);
  });
});

app.post("/login", (req, res) => {
  const sql = `SELECT * FROM users WHERE username='${req.body.username}'`;

  con.query(sql, (err, result) => {
    if (err) throw err;
    if (result.length === 0 || result[0].password !== hash(req.body.password)) {
      return res.sendStatus(401);
    }

    const { username, firstname, lastname } = result[0];
    res.send({username, firstname, lastname});
  });
});

app.put("/users/:id", (req, res) => {
  if (!(req.body && req.body.firstname && req.body.lastname && req.body.password)) {
    return res.sendStatus(400);
  }

  const sql = `UPDATE users 
    SET firstname = '${req.body.firstname}', lastname = '${req.body.lastname}', password = '${req.body.password}'
    WHERE id = ${req.params.id}`;

  con.query(sql, (err) => {
    if (err) throw err;
    res.sendStatus(200).send("Allt gick ok!");
  });
});
