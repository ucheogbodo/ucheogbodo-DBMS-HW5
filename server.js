const express = require("express");
const pool = require("./mysql");

const app = express();
const port = 3000;
const columns = ["bookid", "title", "author", "category", "price"];
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
})[char]);

app.get("/", async (req, res) => {
    const format = typeof req.query.format === "string"
        ? req.query.format.toLowerCase()
        : "json";
    const column = columns.find((name) => req.query[name] !== undefined);
    const value = column ? req.query[column] : undefined;

    if (column && (typeof value !== "string" || !value.trim())) {
        return res.status(400).send("Enter a search value.");
    }

    const sql = `SELECT ${columns.join(", ")} FROM books` +
        (column ? ` WHERE ${column} = ?` : "");

    try {
        const [books] = await pool.execute(sql, column ? [value.trim()] : []);
        if (format !== "text") return res.json(books);

        const headings = columns.map((name) => `<th>${name.toUpperCase()}</th>`).join("");
        const rows = books.map((book) =>
            `<tr>${columns.map((name) => `<td>${escapeHtml(book[name])}</td>`).join("")}</tr>`
        ).join("");

        res.type("html").send(
            `<h1>Book Search</h1><p>${books.length} result(s)</p>` +
            `<table border="1"><thead><tr>${headings}</tr></thead><tbody>${rows}</tbody></table>`
        );
    } catch (err) {
        console.error("Database query failed:", err.message);
        res.status(500).send(
            format === "text"
                ? "<h1>Unable to load books.</h1>"
                : { error: "Unable to load books." }
        );
    }
});

app.listen(port, () => console.log(`Server listening at http://localhost:${port}`));
