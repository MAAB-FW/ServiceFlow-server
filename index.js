const express = require("express")
const cors = require("cors")
require("dotenv").config()
const port = process.env.PORT || 5000

const app = express()

app.use(express.json())
app.use(
    cors({
        origin: ["http://localhost:5173", "https://maab-fw-assignment-11.vercel.app"],
        credentials: true,
        optionsSuccessStatus: 200,
    }),
)

app.get("/", (req, res) => {
    res.send("services is running...")
})

app.listen(port, () => {
    console.log("server is running on port:", port)
})
