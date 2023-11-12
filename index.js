const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uak4fm8.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// my middlewares
const logger = (req, res, next) => {
  console.log("log: info", req.host, req.originalUrl);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  console.log("value of token in middleware", token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    // error
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized access" });
    }
    // if token is valid then it would be decoded
    console.log("value in the token", decoded);
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const blogCollection = client.db("allBlogs").collection("blogByUser");
    const wishlistCollection = client.db("allBlogs").collection("wishlist");

    // Auth Related Api Start Here
    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        // // token set code here
        .cookie("token", token, {
          httpOnly: true,
          secure: false, // http://localhost:5173/login
          // sameSite: "none",
        })
        .send({ success: true });
    });

    //backend create operation
    app.post("/blogByUser", logger, async (req, res) => {
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
          name: 1,
          _id: 1,
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
    app.get("/wishlist", logger, verifyToken, async (req, res) => {
      // console.log("The Token IS=", req.cookies.token);
      console.log("user in the valid token",req.user);
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
