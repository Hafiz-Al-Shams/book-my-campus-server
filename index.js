const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;




// for cookies special cors middleware below

// app.use(
//     cors({
//         origin: [
//             "http://localhost:5173",
//             "http://localhost:5174",
//             "https://site-name.web.app",
//             "https://site-name.firebaseapp.com",
//             "https://site-name.netlify.app",
//         ],
//         credentials: true,
//     })
// );


// normal middlewares
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bkfjr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});



async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");





        const collegeCollection = client.db('collegeBookingDB').collection('colleges');





        // get all colleges api

        app.get('/colleges', async (req, res) => {
            const cursor = collegeCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // get single college api
        app.get('/colleges/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await collegeCollection.findOne(query);
            res.send(result);
        });









    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('book-my-campus nodeJS server is RUNNING!')
});


app.listen(port, () => {
    console.log(`book-my-campus server is getting prepared on PORT: ${port}`)
});

