const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
require("dotenv").config()
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb")
const port = process.env.PORT || 5000

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use(
    cors({
        origin: ["http://localhost:5173", "https://maab-fw-assignment-11.vercel.app", "https://maab-fw-a11.vercel.app"],
        credentials: true,
        optionsSuccessStatus: 200,
    }),
)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wkufpua.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
})

const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if (!token) return res.status(401).send({ message: "Unauthorized access!" })
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) return res.status(401).send({ message: "Unauthorized access!" })
        req.user = decoded
        next()
    })
}

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect()

        const servicesCollection = client.db("serviceFlowDB").collection("services")
        const bookingsCollection = client.db("serviceFlowDB").collection("bookings")

        app.post("/jwt", async (req, res) => {
            const user = req.body
            // console.log("user for token", user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "365d" })

            res.cookie("token", token, cookieOptions).send({ success: true })
        })

        app.post("/logout", async (req, res) => {
            // const user = req.body
            res.clearCookie("token", { ...cookieOptions, maxAge: 0 }).send({ success: true })
        })

        app.post("/add-a-service", async (req, res) => {
            const serviceData = req.body
            const result = await servicesCollection.insertOne(serviceData)
            res.send(result)
        })

        app.get("/all-services", async (req, res) => {
            const search = req.query.search
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            let query = { serviceName: { $regex: search, $options: "i" } }
            if (!search) query = {}
            const result = await servicesCollection
                .find(query)
                .skip(size * page)
                .limit(size)
                .toArray()
            res.send(result)
        })

        app.get("/pagination-services", async (req, res) => {
            const count = await servicesCollection.countDocuments()
            res.send({ count })
        })

        app.get("/manage-services", verifyToken, async (req, res) => {
            const userEmail = req.query.email
            if (userEmail !== req.user.userEmail) {
                return res.status(403).send({ message: "Forbidden access!" })
            }
            let query = {}
            if (userEmail) query = { providerEmail: userEmail }
            const result = await servicesCollection.find(query).toArray()
            res.send(result)
        })

        app.get(`/services/:id`, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await servicesCollection.findOne(query)
            res.send(result)
        })

        app.patch("/update-service/:id", async (req, res) => {
            const id = req.params.id
            const updateService = req.body
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: { ...updateService },
            }
            const result = await servicesCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.delete("/delete-service/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await servicesCollection.deleteOne(query)
            res.send(result)
        })

        app.get("/all-bookings", verifyToken, async (req, res) => {
            const userEmail = req.query.email
            if (userEmail !== req.user.userEmail) {
                return res.status(403).send({ message: "Forbidden access!" })
            }
            const query = { userEmail: userEmail }
            const result = await bookingsCollection.find(query).toArray()
            res.send(result)
        })

        app.get("/all-bookings-s-to-do", async (req, res) => {
            const userEmail = req.query.email
            let query = {}
            if (userEmail) query = { providerEmail: userEmail }
            const result = await bookingsCollection.find(query).toArray()
            res.send(result)
        })

        app.patch("/all-bookings-s-to-do/:id", async (req, res) => {
            const id = req.params.id
            const updateStatus = req.body
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: { ...updateStatus },
            }
            const result = await bookingsCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.post("/add-bookings", async (req, res) => {
            const bookedData = req.body
            const result = await bookingsCollection.insertOne(bookedData)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 })
        console.log("Pinged your deployment. You successfully connected to MongoDB!")
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close()
    }
}
run().catch(console.dir)

app.get("/", (req, res) => {
    res.send("services is running...")
})

app.listen(port, () => {
    console.log("server is running on port:", port)
})
