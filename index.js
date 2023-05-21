const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// midleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Kids Toys Server is running");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@kids-toys.ebcxkyg.mongodb.net/?retryWrites=true&w=majority`;
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
    const toysCollection = client.db("toysDB").collection("toys");
    // create index on for data searching option
    const indexKeys = {name: 1, subCategory: 1};
    const indexOptions = { name: "nameCategory" };
    const result = await toysCollection.createIndex(indexKeys, indexOptions);

    app.post("/addtoy", async (req, res) => {
      const newToy = req.body;
      console.log(newToy);
      const result = await toysCollection.insertOne(newToy);
      res.send(result);
    });
    // Get My Toys
    app.get('/mytoys/:email', async(req, res)=>{
      const result = await toysCollection.find({sellerEmail: req.params.email}).toArray();
      res.send(result);
    })
    // Update a toy
    app.get('/toy/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await toysCollection.findOne(query);
      res.send(result);
    })
    app.put('/toy/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const options = { upsert:true};
      const updatedToy = req.body;
      const toyData = {
        $set:{
          name: updatedToy.name,
          photo: updatedToy.photo,
          price: updatedToy.price,
          quantity: updatedToy.quantity,
          description: updatedToy.description,
        }
      }
      const result = await toysCollection.updateOne(filter, toyData, options);
      res.send(result);

    })

    // Delete a toy
    app.delete('/toy/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    })
    // Get all toys
    app.get('/alltoys', async(req, res) =>{
      const cursor = toysCollection.find().limit(20);
      const result = await cursor.toArray();
      res.send(result);
    })
    // Get a single toys information
    app.get('/toydetails/:id', async(req, res) =>{
      const toyID = req.params.id;
      const cursor = toysCollection.find({_id : new ObjectId(toyID)});
      const result = await cursor.toArray();
      res.send(result);
    })

    // Search a toy by name & category
    app.get('/searchToy/:text', async(req, res) =>{
      const searchQuery = req.params.text;

      const searchResult = await toysCollection.find({
        $or:[
          {name : {$regex: searchQuery, $options: "i"}},
          {subCategory : {$regex: searchQuery, $options: "i"}}
        ]
      }).toArray();

      res.send(searchResult);
    })

    // Get data sub-category wise
    app.get('/alltoys/:subCategory', async(req, res) =>{
      const subCategoryQuery = req.params.subCategory;
      // console.log(subCategoryQuery)
      if(subCategoryQuery == "math" || subCategoryQuery == "science" || subCategoryQuery == "intelligence"){
        const result = await toysCollection.find({subCategory : subCategoryQuery}).toArray();
        res.send(result);
      }
    })


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

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
