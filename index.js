const express = require('express');
const bcrypt = require("bcrypt");
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
        // user collection related
        const userCollection = client.db("collegeBookingDB").collection("users");



        // auth related
        app.get("/user-by-email", async (req, res) => {
            const email = req.query.email;
            if (!email) return res.status(400).send({ message: "Email required" });

            try {
                const user = await userCollection.findOne({ email });
                if (!user) return res.status(404).send({ message: "User not found" });

                res.send(user); // Include password so it can be compared in authorize
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Internal server error" });
            }
        });

        // auth related
        app.post("/users", async (req, res) => {
            try {
                const { name, email, password } = req.body;

                // Check if user already exists
                const existingUser = await userCollection.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({ message: "User already exists" });
                }

                // Hash the password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Store the new user
                const result = await userCollection.insertOne({
                    name,
                    email,
                    password: hashedPassword,
                });

                res.status(201).json({
                    message: "User registered successfully",
                    userId: result.insertedId,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // auth related
        app.post("/users/social", async (req, res) => {
            try {
                const { name, email } = req.body;

                // Check if user already exists
                const existingUser = await userCollection.findOne({ email });
                if (existingUser) {
                    return res.status(200).json({ message: "User already exists" }); // No error
                }

                // Store the new social user (no password)
                const result = await userCollection.insertOne({
                    name,
                    email,
                    provider: "social", // Optional: to differentiate
                });

                res.status(201).json({
                    message: "Social user registered successfully",
                    userId: result.insertedId,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // auth related
        app.patch("/users/update", async (req, res) => {
            try {
                const { email, updatedData } = req.body;

                if (!email || !updatedData) {
                    return res.status(400).json({ message: "Invalid update request" });
                }

                const result = await userCollection.updateOne(
                    { email },
                    { $set: updatedData }
                );

                if (result.modifiedCount > 0) {
                    return res
                        .status(200)
                        .json({ message: "Profile updated successfully" });
                } else {
                    return res.status(200).json({ message: "No changes made" });
                }
            } catch (err) {
                console.error("Profile update error:", err);
                res.status(500).json({ message: "Internal server error" });
            }
        });





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



        // testing area
        // Search colleges by name (similar to MealsDB search)
        // app.get('/colleges/search', async (req, res) => {
        //     try {
        //         const searchTerm = req.query.s; // Using 's' parameter like MealsDB

        //         if (!searchTerm) {
        //             return res.json({ colleges: [] });
        //         }

        //         // Create case-insensitive search query
        //         const query = {
        //             name: { $regex: searchTerm, $options: 'i' }
        //         };

        //         const cursor = collegeCollection.find(query);
        //         const result = await cursor.toArray();

        //         // Return in similar format to MealsDB (colleges instead of meals)
        //         res.json({ colleges: result });
        //     } catch (err) {
        //         console.error("Error searching colleges:", err);
        //         res.status(500).json({ colleges: [] });
        //     }
        // });

        // testing area




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


        // get all submissions by email query for a specific user
        app.get('/submissions/by-email/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const result = await submissionsCollection.find(query).toArray();
            res.send(result);
        })






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

