const mongoose = require('mongoose');
const Rifa = require('../models/rifas');
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

require('dotenv').config();
//|| 'mongodb://127.0.0.1:27017/rifas-para-ti';
const dbUrl = process.env.DB_URL 

async function seed() {
  try {
    await mongoose.connect(dbUrl);
    console.log('Connected to DB');

    // Remove existing documents (optional)
    await Rifa.deleteMany({});

    // Create a sample rifa document
    const sample = new Rifa({
      fecha: new Date(),
      firstPrize: 1000,
      secondPrize: 500,
      thirdPrize: 250
    });

    await sample.save();
    console.log('Seeded rifas collection with:', sample);

    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
