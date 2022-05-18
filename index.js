const express = require('express')
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bfh9q.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try{
        await client.connect();
        const serviceCollection = client.db('Doctors_Portal').collection('services');
        const bookingCollection = client.db('Doctors_Portal').collection('bookings');

        app.get('/service', async (req,res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/available', async (req,res) =>{
          const date = req.query.date;

           const services = await serviceCollection.find().toArray();

           const query = {date: date};
           const bookings = await bookingCollection.find(query).toArray();
          //  find booking for each service 
          services.forEach(service =>{
            const serviceBookings = bookings.filter(b => b.treatment === service.name);
            const booked = serviceBookings.map(s => s.slot);
            const available = service.slots.filter(s => !booked.includes(s))
            service.slots = available;
          })

          res.send(services);
        })


        app.post('/booking', async (req,res) =>{
          const booking = req.body;
          const query = {treatment : booking.treatment, date: booking.date, patient: booking.patient }
          const exists = await bookingCollection.findOne(query)
          if(exists){
            return res.send({success:false, booking: exists})
          }
          const result = await bookingCollection.insertOne(booking);
          res.send({success:true,result});
        })



    }
    finally {
       
      }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Doctors Portal')
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})