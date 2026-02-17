require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const dbURL = process.env.DB_URL;
//'mongodb://127.0.0.1:27017/rifas-para-ti'
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const createAdmin = async () => {
    try {
        await mongoose.connect(dbURL);
        
        const admin = new User({
            username: process.argv[2] || 'daniela',
            password: process.argv[3] || 'rifasAdmin'
        });
        
        await admin.save();
        console.log(`✓ Usuario "${admin.username}" creado`);
        process.exit();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

createAdmin();