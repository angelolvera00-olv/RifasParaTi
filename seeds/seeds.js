const mongoose = require('mongoose');
const Number = require('../models/numbers');
require('dotenv').config();
const dbURL = process.env.DB_URL;
//'mongodb://127.0.0.1:27017/rifas-para-ti'
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

mongoose.connect(dbURL)
    .then(() => {
        console.log("Conexion abierta");
    })
    .catch(err => {
        console.log('Error de conexion:', err);
        process.exit(1);
    });

async function seedDatabase() {
    try {
        await Number.deleteMany({});
        console.log('Números anteriores eliminados');

        const numbersData = [];
        for (let i = 1; i <= 1000; i++) {
            numbersData.push({
                number: i,
                status: 'libre',
                assignedTo: ""
            });
        }

        await Number.insertMany(numbersData);
        console.log('1000 números insertados exitosamente');

        await mongoose.connection.close();
        console.log('Conexión cerrada');
    } catch (error) {
        console.log('Error al sembrar la base de datos:', error);
        process.exit(1);
    }
}

seedDatabase();
