require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

const createAdmin = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/rifas-para-ti');
        
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