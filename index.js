const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uak4fm8.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const blogCollection = client.db("allBlogs").collection("blogByUser");
    const wishlistCollection = client.db("allBlogs").collection("wishlist");

    //backend create operation
    app.post("/blogByUser", async (req, res) => {
      const newBlog = req.body;
      console.log(newBlog);
      const result = await blogCollection.insertOne(newBlog);
      res.send(result);
    });

    //backend read operation
    app.get("/blogByUser", async (req, res) => {
      const cursor = blogCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // specific wishlist data get operation
    app.get("/blogByUser/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const options = {
        projection: {
          title: 1,
          shortDes: 1,
          category: 1,
          photo: 1,
          longDes: 1,
          name:1,
          _id:1,
        },
      };

      const result = await blogCollection.findOne(query, options);
      res.send(result);
    });

    // // // // // // backend specific wishlist collection start here
    app.post("/wishlist", async (req, res) => {
      const addWishlist = req.body;
      console.log(addWishlist);
      const result = await wishlistCollection.insertOne(addWishlist);
      res.send(result);
    });

    // wishlist all by specific user read and
    app.get("/wishlist", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    });

    // specific wishlist delete in my Wishlist section
    app.delete("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Blog is coming");
});

app.listen(port, () => {
  console.log(`Blogging site is running properly ${port}`);
});
