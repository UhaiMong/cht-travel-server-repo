const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const { query } = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cnhrqkg.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.88wnsqi.mongodb.net/?retryWrites=true&w=majority`;

// const client = new MongoClient(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   serverApi: ServerApiVersion.v1
// });

// database end

async function run() {
  try {
    // database connection

    const database = client.db("cht-travel");
    const allHotelBandarban = database.collection("hotelsBandarban");
    const localLanguages = database.collection("local-languages");
    const paymentCollection = database.collection("payment");
    const usersCollection = database.collection("users");

    //database connection ended

    //GET API
    app.get("/hotels", async (req, res) => {
      const result = await allHotelBandarban.find().toArray();
      res.send(result);
    });

    // Get all booking information
    app.get("/api/bookings", async (req, res) => {
      const result = await paymentCollection.find().toArray();
      res.send(result);
    });

    // get all local languages
    app.get("/local-language", async (req, res) => {
      const result = await localLanguages.find().toArray();
      res.send(result);
    });

    // get users
    app.get("/api/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // GET SINGLE HOTEL
    app.get("/hotel/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      // console.log(query);
      const singleHotel = await allHotelBandarban.findOne(query);
      // console.log(singleHotel)
      res.send(singleHotel);
    });

    //  POST / INSERT API
    app.post("/addHotels", async (req, res) => {
      const packageDetails = req.body;
      const result = await allHotelBandarban.insertOne(packageDetails);
      res.json(result);
    });

    // DELETE API
    app.delete("/hotel/:id", async (req, res) => {
      const id = req.params.id;
      const result = await allHotelBandarban.deleteOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    // UPDATE API
    app.put("/updateHotel/:id", async (req, res) => {
      console.log("req--->", req.body);
      const id = req.params.id;
      const result = allHotelBandarban.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            title: req.body?.title,
            imageURL: req.body?.imageURL,
            price: req.body?.price,
            totalRoom: req.body?.totalRoom,
            isAvailable: req.body?.isAvailable,
            address: req.body?.address,
            latitude: req.body?.latitude,
            longitude: req.body?.longitude,
            description: req.body?.description,
          },
        }
      );
      res.send(result);
    });

    //sslcommerz init

    app.post("/init", async (req, res) => {
      const data = {
        total_amount: req.body.price,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        currency: "BDT",
        tran_id: "REF123",
        success_url: "http://hilltractstech.com//success",
        fail_url: "http://hilltractstech.com//fail",
        cancel_url: "http://hilltractstech.com//cancel",
        ipn_url: "http://hilltractstech.com//ipn",
        shipping_method: "Courier",
        product_name: req.body?.title,
        product_category: "Electronic",
        product_profile: "general",
        cus_name: req.body?.name,
        cus_email: req.body.email,
        cus_add1: req.body?.city,
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: req.body?.phone,
        cus_fax: req.body?.phone,
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
        multi_card_name: "mastercard",
        value_a: "ref001_A",
        value_b: "ref002_B",
        value_c: "ref003_C",
        value_d: "ref004_D",
      };

      // inserting payment info in mongoDB
      const result = await paymentCollection.insertOne(data);
      // res.json(result);

      const sslcommer = new SslCommerzPayment(
        process.env.STORE_ID,
        process.env.STORE_PASS,
        false
      ); //true for live default false for sandbox
      sslcommer.init(data).then((data) => {
        console.log(data);
        if (data.GatewayPageURL) {
          res.status(200).json(data.GatewayPageURL);
          console.log(data);
        }
        res.status(400).json("Payment seasson failed");
      });
    });

    app.post("/success", async (req, res) => {
      res.status(200).redirect("https://chttourguide.netlify.app/success");
    });

    app.post("/fail", async (req, res) => {
      res.status(200).redirect("https://chttourguide.netlify.app/");
    });

    app.post("/cancel", async (req, res) => {
      res.status(200).redirect("https://chttourguide.netlify.app/");
    });
    //sslcommerz end

    //   for save the user in database
    // post api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // upsert data for google log in
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          email: user.email,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    //  make admin
    app.put("/makeAdmin", async (req, res) => {
      const filter = { email: req.body.email };
      const result = await usersCollection.find(filter).toArray();
      if (result) {
        const documents = await usersCollection.updateOne(filter, {
          $set: { role: "admin" },
        });
        res.send(result);
      }
    });

    // check admin or not
    app.get("/checkAdmin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      console.log(query);
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

//sever running test
app.get("/", async (req, res) => {
  res.send(`Cht-travel server is running on ${port} numbers`);
});

app.listen(port, () => {
  console.log(`It's running on ${port}`);
});
