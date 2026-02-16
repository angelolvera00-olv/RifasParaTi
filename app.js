if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const Joi = require('joi');
const ejsMate = require('ejs-mate')
const dotenv = require('dotenv');
const session = require('express-session');
const NumberModel = require('./models/numbers');
const User = require('./models/user');
const session_secret = process.env.SESSION_SECRET;
const Rifa = require('./models/rifas')

mongoose.connect('mongodb://127.0.0.1:27017/rifas-para-ti')
    .then(() => {
        console.log("Conexion abierta");
    })
    .catch(err => {
        console.log('Error');
        console.log(err);
    })

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
    secret: session_secret,
    resave: false,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
}, async (username, password, done) => {
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return done(null, false, { message: 'Usuario no encontrado' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return done(null, false, { message: 'Contraseña incorrecta' });
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

const isAdmin = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/admin/login');
};


app.get('/', async (req, res) => {
    const rifa = await Rifa.findOne({});
    res.render('home', { rifa });
})


app.get('/admin/login', (req, res) => {
    res.render('admin/login', { error: null });
});

app.post('/admin/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.render('admin/login', { error: info.message });
        }

        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/admin/panel');
        });
    })(req, res, next);
});


app.get('/Metodos', (req, res) => {
    res.render('Metodos de Pago')
})

app.get('/admin/panel', isAdmin, (req, res) => {
    res.render('admin/panel', { user: req.user });
});

app.get('/admin/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});


app.get('/Reiniciar', isAdmin, async (req, res) => {
    res.render('RifaDetalles');
})

app.get('/Aprobar', isAdmin, async (req, res) => {
    const apartados = await NumberModel.find({ status: 'apartado' });
    const agrupados = {};
    apartados.forEach(item => {
        if (!agrupados[item.assignedTo]) {
            agrupados[item.assignedTo] = [];
        }
        agrupados[item.assignedTo].push({
            id: item._id,
            number: item.number
        });
    });
    res.render('AprobarEntradas', { agrupados });
});

app.post('/AprobarSeleccion', isAdmin, async (req, res) => {
    try {
        let { seleccionados } = req.body;
        if (!seleccionados || seleccionados.length === 0) {
            return res.redirect('AprobarEntradas');
        }
        if (!Array.isArray(seleccionados)) {
            seleccionados = [seleccionados];
        }
        seleccionados = seleccionados.filter(id => id && id.trim() !== "");

        if (seleccionados.length === 0) {
            return res.redirect('AprobarEntradas')
        }

        const resultado = await NumberModel.updateMany({
            _id: { $in: seleccionados },
            status: 'apartado'
        },
            {
                $set: { status: 'asignado' }
            }
        );
        res.redirect('admin/panel')
    } catch {
        console.error("Error en AprobarSeleccion:", error);
        res.status(500).send("Error interno del servidor");
    }
})

app.get('/Lista', isAdmin, async (req, res) => {
    const asignados = await NumberModel.find({ status: 'asignado' });
    const participantes = {};
    asignados.forEach(num => {
        if (!participantes[num.assignedTo]) {
            participantes[num.assignedTo] = [];
        }
        participantes[num.assignedTo].push(num.number);
    })
    res.render('Lista', { participantes });
})


app.post('/Rifa', isAdmin, async (req, res) => {
    try {
        const [year, month, day] = req.body.fecha.split('-').map(Number);
        const fechaLocal = new Date(year, month - 1, day);
        await Rifa.findOneAndUpdate({}, {
            fecha: fechaLocal,
            firstPrize: req.body.firstPrize,
            secondPrize: req.body.secondPrize,
            thirdPrize: req.body.thirdPrize
        },
            {
                upsert: true,
                runValidators: true
            }
        );
        await NumberModel.updateMany({}, { status: "libre", assignedTo: "" })
        res.redirect('/')
    } catch (error) {
        res.render('RifaDetalles', { error: 'Por favor, completa todos los campos con valores válidos (números positivos)' });
    }
})

app.get('/Tickets', async (req, res) => {
    try {
        const numbers = await NumberModel.find();
        res.render('tickets', { numbers });
    } catch (error) {
        console.log('Error fetching numbers:', error);
        res.render('tickets', { numbers: [] });
    }
})


app.get('/register', (req, res) => {
    const selectedNumbers = req.query.numbers || [];
    const numbersArray = Array.isArray(selectedNumbers) ? selectedNumbers : [selectedNumbers];

    if (numbersArray.length === 0) {
        return res.redirect('/Tickets');
    }

    res.render('register', { selectedNumbers: numbersArray });
});

app.post('/register', async (req, res) => {
    try {
        const { name, numbers } = req.body;

        const numbersArray = Array.isArray(numbers) ? numbers : [numbers];

        if (!name || numbersArray.length === 0) {
            return res.status(400).send('Name and numbers are required');
        }

        await NumberModel.updateMany(
            { number: { $in: numbersArray } },
            {
                status: 'apartado',
                assignedTo: name
            }
        );

        res.render('success', {
            name: name,
            numbers: numbersArray
        });
    } catch (error) {
        console.log('Registration error:', error);
        res.status(500).send('Error during registration: ' + error.message);
    }
});

app.listen(3000, () => {
    console.log("Escuchando al servidor 3000")
});