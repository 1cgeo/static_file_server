require('dotenv').config()
const express = require('express')
const path = require('path')
var compression = require("compression");
const fetch = require("node-fetch");
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
const Joi = require('joi');

const isValidSession = (req, res, next) => {
    let token = req.cookies['jwt-token']
    if (!token) {
        res.redirect('/signin')
        return
    }
    jwt.verify(token, process.env.SECRET, function (error, decoded) {
        if (error) {
            res.redirect('/signin')
            return
        }
        next()
    });
}

const isAuthenticated = async (username, password) => {
    try {
        var response = await fetch(`${process.env.AUTH_SERVER}/api/login`, {
            "headers": {
                "content-type": "application/json",
            },
            "body": `{\"usuario\":\"${username}\",\"senha\":\"${password}\",\"aplicacao\":\"auth_web\"}`,
            "method": "POST"
        })
        return [200, 201].includes(response?.status)
    } catch (error) {
        return false
    }
}

const buildToken = (username, password) => {
    let loginInfo = { username, password }
    var token = jwt.sign(
        {
            data: loginInfo
        },
        process.env.SECRET,
        { expiresIn: "1d" }
    );
    return token
}

const setCharset = (req, res, next) => {
    res.setHeader("Content-Type", "text/html");
    next();
}

const app = express()
const port = 3000

app.use(compression());
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));
app.use(cookieParser())

app.set('view engine', 'pug')
app.set('views', './src/views')

app.use("/css", express.static(path.join(__dirname, "node_modules/bootstrap/dist/css")))
app.use("/js", express.static(path.join(__dirname, "node_modules/bootstrap/dist/js")))

app.use("/css", express.static(path.join(__dirname, "src/views/css")))

app.use('/muvd', isValidSession, setCharset, express.static(process.env.MUVD_FOLDER));
app.use('/trd', isValidSession, setCharset, express.static(process.env.TRD_FOLDER));

app.get('/', isValidSession, (req, res) => {
    res.render('summary', { error: true })
})

app.get('/signin', (req, res) => {
    res.render('login', {})
})

app.post('/signin', async (req, res) => {
    const result = Joi.object().keys({
        username: Joi.string().required(),
        password: Joi.string().required(),
    }).validate(req.body)

    if (result.error) {
        res.render('login', { error: true })
        return
    }
    let { username, password } = result.value
    var authenticated = await isAuthenticated(username, password)
    if (!authenticated) {
        res.render('login', { error: true })
        return
    }
    let token = buildToken(username, password)
    res.cookie('jwt-token', token);
    res.redirect('/')
    return
})

app.get('/muvd', isValidSession, (req, res) => {
    res.sendFile(path.join(process.env.MUVD_FOLDER, 'MUVD_UTRD1_v1.1_20211231.html'));
});

app.get('/trd', isValidSession, (req, res) => {
    res.sendFile(path.join(process.env.TRD_FOLDER, 'MGCP_TRD4_v4.4_2016-12-31.htm'));
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
