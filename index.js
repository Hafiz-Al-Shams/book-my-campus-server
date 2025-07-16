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
        const submissionsCollection = client.db('collegeBookingDB').collection('submissions');
        const reviewsCollection = client.db('collegeBookingDB').collection('reviews');





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


        // get all submissions api -- for testing only
        app.get('/submissions', async (req, res) => {
            const cursor = submissionsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // get single submission api
        app.get('/submissions/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await submissionsCollection.findOne(query);
            res.send(result);
        });



        // POST /submissions endpoint
        app.post('/submissions', async (req, res) => {
            try {
                // now destructure the new fields, too
                const {
                    collegeId,
                    collegeName,    // ← NEW
                    collegeImgSrc,  // ← NEW
                    name,
                    email,
                    program,
                    phone,
                    address,
                    dob,
                    photoUrl,
                } = req.body;

                // Build the document to insert, including the new fields
                const submissionDoc = {
                    collegeId: new ObjectId(collegeId),
                    collegeName,           // ← NEW
                    collegeImgSrc,         // ← NEW
                    name,
                    email,
                    program,
                    phone,
                    address,
                    dob,
                    photoUrl,              // URL coming from ImgBB upload
                    submittedAt: new Date(),
                };

                const result = await submissionsCollection.insertOne(submissionDoc);

                res.status(201).json({
                    success: true,
                    insertedId: result.insertedId,
                });
            } catch (err) {
                console.error('Error in POST /submissions:', err);
                res.status(500).json({
                    success: false,
                    error: err.message,
                });
            }
        });



        // get all reviews api -- for testing only
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });


        // POST /reviews endpoint
        app.post('/reviews', async (req, res) => {
            try {
                // Destructure everything the client is sending
                const {
                    submissionId,       // string ID of the original submission
                    collegeId,          // string ID of the college
                    collegeName,
                    collegeImgSrc,
                    name,
                    email,
                    program,
                    phone,
                    address,
                    dob,
                    photoUrl,
                    submittedAt,        // ISO string of when they originally applied
                    rating,             // new: "1" | "2" | "3" | "4" | "5"
                    feedback,           // new: text
                    reviewedAt,         // ISO string of when the review was made
                } = req.body;

                // Build your review document
                const reviewDoc = {
                    submissionId: new ObjectId(submissionId), // link back to submissions._id
                    collegeId: new ObjectId(collegeId),    // link to colleges._id
                    collegeName,
                    collegeImgSrc,
                    name,
                    email,
                    program,
                    phone,
                    address,
                    dob,
                    photoUrl,
                    submittedAt: new Date(submittedAt),      // convert back to Date
                    rating: Number(rating),             // store as a number
                    feedback,
                    reviewedAt: new Date(reviewedAt),       // convert back to Date
                    createdAt: new Date(),                 // when this review was inserted
                };

                // Insert into your MongoDB reviews collection
                const result = await reviewsCollection.insertOne(reviewDoc);

                res.status(201).json({
                    success: true,
                    insertedId: result.insertedId,
                });
            } catch (err) {
                console.error('Error in POST /reviews:', err);
                res.status(500).json({
                    success: false,
                    error: err.message,
                });
            }
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

