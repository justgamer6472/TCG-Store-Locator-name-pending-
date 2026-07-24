const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000; 

const db = new sqlite3.Database("./stores.db");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true}));
app.use(express.static(path.join(__dirname, "public")));

db.run(`
    Create TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL, 
        city TEXT NOT NULL,
        state TEXT NOT NULL, 
        zip TEXT NOT NULL, 
        games TEXT,
        description TEXT
    )
`);

app.get("/", (req, res) => {
    const search = req.query.search || "";

    const sql = `
        SELECT *
        FROM stores
        WHERE name LIKE ? 
            OR city LIKE ?
            OR games LIKE?
        ORDER BY name
    `;

    const searchValue = `%${search}%`;

    db.all(
        sql,
        [searchValue, searchValue, searchValue],
        (error, stores) => {
            if(error) {
                return res.status(500).send("Database error");
            }

            res.render("index", {
                stores,
                search
            });
        }
    );
});

app.get("/stores/new", (req, res) => {
    res.render("new-store");
});

app.post("/stores", (req, res) => {
    const {
        name, 
        address,
        city, 
        state,
        zip,
        games,
        description
    } = req.body;

    const sql = `
        INSERT INTO stores (
            name,
            address,
            city,
            state,
            zip,
            games,
            description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            name,
            address,
            city,
            state,
            zip,
            games,
            description
        ],
        function(error) {
            if (error) {
                console.error(error);
                return res.status(500).send("Could not add store");
            }

            res.redirect(`/stores/${this.lastID}`);
        }
    );
});

app.get("/stores/:id", (req, res) => {
    const storeId = req.params.id;

    db.get(
        "SELECT * FROM stores WHERE id = ?",
        [storeId],
        (error, store) => {
            if (error) {
                return res.status(500).send("Database error");
            }

            if (!store) {
                return res.status(404).send("Store not found");
            }

            res.render("store", { store });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});