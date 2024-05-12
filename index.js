const express = require("express")
const cors = require("cors")
require("dotenv").config()
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb")
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

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wkufpua.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
})

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect()

        const servicesCollection = client.db("serviceFlowDB").collection("services")
        const bookingsCollection = client.db("serviceFlowDB").collection("bookings")

        app.post("/add-a-service", async (req, res) => {
            const serviceData = req.body
            const result = await servicesCollection.insertOne(serviceData)
            res.send(result)
        })

        app.get("/all-services", async (req, res) => {
            const userEmail = req.query.email
            const search = req.query.search
            let query = { serviceName: { $regex: search, $options: "i" } }
            if (!search) query = {}
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

        app.get("/all-bookings", async (req, res) => {
            const userEmail = req.query.email
            let query = {}
            if (userEmail) query = { userEmail: userEmail }
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
