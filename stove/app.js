var express = require('express');
var expressValidator = require('express-validator');
var crypto = require('crypto');
var util = require('util');
var path = require('path');
var app = express();
var mongoose = require('mongoose');

// ----------------------------------------------------------------------------
//                           Mongodb Conncection
// ----------------------------------------------------------------------------
mongoose.connect('mongodb://production:Team_mia_cscc09@ds139480.mlab.com:39480/stove');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error....'));
db.once('open', function callback() {
    console.log('stove db opened');
});

var usersShecma = mongoose.Schema({
    type: String,
    firstName: String,
    lastName: String,
    email: String,
    city: String,
    country: String,
    salt: String,
    saltedHash: String,
    fb_id: String
});
var users = mongoose.model('users', usersShecma);

var suggestionSchema = mongoose.Schema({
    user_id: String,
    yelp_id: String,
    name: String,
    address: String,
    image: String,
    url: String
});
var suggestions = mongoose.model('suggestions', suggestionSchema);

// ----------------------------------------------------------------------------

var Yelp = require('yelp');

var yelp = new Yelp({
    consumer_key: '6TNmm9ER-_YATjhleFDD3w',
    consumer_secret: 'vOSufCBCVGqsdfti4jIPn2W_ZXo',
    token: 'Bz2eMaYfr7LWdFTPOIhqyeqsUOd9LduB',
    token_secret: 'zW-fRLVQ939mYkRuvHM0u9CZzmA',
});

app.set('port', (process.env.PORT || 5000));

var bodyParser = require('body-parser');
app.use(bodyParser.json());

// ----------------------------------------------------------------------------
//                              Validation
// ----------------------------------------------------------------------------
app.use(expressValidator({
  customValidators: {
    fail: function(value){
      return false;
    }
  }
}));

app.use(function(req, res, next){
  Object.keys(req.body).forEach(function(arg){
    switch(arg) {
      case 'type':
        req.checkBody(arg).notEmpty();
        req.sanitizeBody(arg).whitelist(['FB', 'user']);
        break;
      case 'id':
        req.checkBody(arg).notEmpty();
        break;
      case 'first_name':
        req.checkBody(arg).notEmpty();
        req.sanitizeBody(arg).escape();
        break;
      case 'last_name':
        req.checkBody(arg).notEmpty();
        req.sanitizeBody(arg).escape();
        break;
      case 'email':
        req.checkBody(arg).isEmail();
        req.sanitizeBody(arg).escape();
        break;
      case 'firstName':
        req.checkBody(arg).notEmpty().isAscii();
        req.sanitizeBody(arg).escape();
        break;
      case 'lastName':
        req.checkBody(arg).notEmpty().isAscii();
        req.sanitizeBody(arg).escape();
        break;
      case 'city':
        req.checkBody(arg).notEmpty().isAscii();
        req.sanitizeBody(arg).escape();
        break;
      case 'country':
        req.checkBody(arg).notEmpty().isAscii();
        req.sanitizeBody(arg).escape();
        break;
      case 'password':
        req.checkBody(arg).notEmpty().isAscii();
        req.sanitizeBody(arg).escape();
        break;
      case '_id':
        req.checkBody(arg).notEmpty();
        req.sanitizeBody(arg).escape();
        break;
      case 'location':
        req.sanitizeBody(arg).escape();
        break;
      case 'term':
        req.sanitizeBody(arg).escape();
        break;
      default:
        break;
    }
  });
  Object.keys(req.params).forEach(function(arg){
    switch(arg){
      case 'pagenum':
        req.checkParams(arg).notEmpty();
        req.sanitizeParams(arg).escape();
        break;
      case 'id':
        req.checkParams(arg).notEmpty();
        req.sanitizeParams(arg).escape();
        break;
      default:
        break;
    }
  });
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) return res.status(400).send('Validation errors: ' + util.inspect(result.array()));
    else next();
  });
});

// ----------------------------------------------------------------------------
//                              Session
// ----------------------------------------------------------------------------

app.enable('trust proxy');

var session = require('express-session');
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    proxy: true,
    cookie: {
        sameSite: true,
        httpOnly: true
    }
}));
// ----------------------------------------------------------------------------

var User = function(user) {
    this.type = user.type;
    if (this.type == 'FB') {
        this.fb_id = user.id;
        this.firstName = user.first_name;
        this.lastName = user.last_name;
        this.email = user.email;
        this.city = '';
        this.country = '';
    } else {
        this.fb_id = '';
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.email = user.email;
        this.city = user.city;
        this.country = user.country;
        var salt = crypto.randomBytes(16).toString('base64');
        var hash = crypto.createHmac('sha512', salt);
        hash.update(user.password);
        this.salt = salt;
        this.saltedHash = hash.digest('base64');
    }
};

// function to check if the enter password is correct
// return True iff password enter is correct
var checkPassword = function(user, password) {
    var hash = crypto.createHmac('sha512', user.salt);
    hash.update(password);
    var value = hash.digest('base64');
    return (user.saltedHash === value);
};

app.use(function(req, res, next) {
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});

app.get('/', function(req, res, next) {
    if (!req.session.user) return res.redirect('/signin.html');
    return next();
});

app.get('/index.html/', function(req, res, next) {
    if (!req.session.user) return res.redirect('/signin.html');
    return next();
});

app.use(express.static('frontend'));
app.use('/bower_components', express.static(path.join(__dirname + '/bower_components')));

// ----------------------------------------------------------------------------
//                              API calls
// ----------------------------------------------------------------------------


app.post('/api/users/', function(req, res, next) {
    var data = new User(req.body);
    var new_users = new users(data);

    users.findOne({
        email: req.body.email
    }, function(err, user) {
        if (err) return res.status(500).end(err);
        if (user) return res.status(409).end("User with email " + req.body.email + " already exists");
        new_users.save(function(err) {
            if (err) return res.status(500).end(err);
            return res.json(new_users);
        });
    });
});

// normal siginin
app.post('/api/signin/', function(req, res, next) {
    if (!req.body.email || !req.body.password) return res.status(400).send("Bad Request");

    users.findOne({
        email: req.body.email
    }, function(err, user) {
        if (err) return res.status(500).end(err);
        if (!user || !checkPassword(user, req.body.password)) return res.status(401).end("Unauthorized");
        req.session.user = user;
        res.cookie('user', user._id.toString(), {
            sameSite: true,
            httpOnly: true
        });
        var res_result = {};
        res_result.firstName = user.firstName.toString();
        res_result.lastName = user.lastName.toString();
        res_result.email = user.email.toString();
        res_result.city = user.city.toString();
        res_result.country = user.country.toString();
        res_result._id = user._id.toString();
        return res.json(res_result);
    });
});

//Facebook Signin
app.post('/api/signinFB/', function(req, res, next) {
    var data = new User(req.body);
    var new_users = new users(data);

    users.findOne({
        fb_id: data.fb_id
    }, function(err, user) {
        if (err) return res.status(500).end(err);
        if (user) {
            req.session.user = user;
            res.cookie('user', user._id.toString(), {
                sameSite: true,
                httpOnly: true
            });
            return res.json(user);
        }
        new_users.save(function(err) {
            if (err) return res.status(500).end(err);
            return res.json(new_users);
        });
    });
});

//Signout
app.delete('/api/signout/', function(req, res, next) {
    req.session.destroy(function(err) {
        if (err) return res.status(500).end(err);
        return res.end();
    });
});

//Gives Current user
app.get('/api/current/', function(req, res, next) {
    if (!req.session.user) return res.status(403).end("Forbidden");
    return res.json(req.session.user);
});

//set location of current user
app.put('/api/setlocation/', function(req, res, next) {
    if (!req.session.user) return res.status(403).end("Forbidden");
    req.session.user.city = req.body.city;
    req.session.user.country = req.body.country;
    return res.json(req.session.user);
});

//update user information
app.put('/api/users/', function(req, res, next) {
    if (!req.session.user) return res.status(403).end("Forbidden");

    users.findOne({
        "_id": req.body._id
    }, function(err, user) {
        if (err) return res.status(500).end(err);
        users.findOneAndUpdate({
                "_id": req.body._id
            }, {
                $set: {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    city: req.body.city,
                    country: req.body.country
                }
            },
            {new: true},
            function(err, user) {
                if (err) return res.status(500).end(err);
                users.findOne({
                    "_id": req.body._id
                }, function(err, user) {
                    req.session.user = user;
                    return res.json(req.session.user);
                });
            });
    });
});


// api call to randomly generate suggestion
app.post('/api/spin/', function(req, res, next) {
    if (!req.session.user) return res.status(403).end("Forbidden");
    var sr_location = req.session.user.city + "+" + req.session.user.country;
    var sr_term = 'restaurant';
    var sr_par = {};
    if (req.body.location) sr_location = req.body.location.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '').replace(" ", "+");
    if (req.body.term) sr_term = req.body.term.toLowerCase();
    else {
      sr_par.limit = '1';
      sr_par.offset = Math.floor(Math.random() * 1000);
    }

    sr_par.term = sr_term;
    sr_par.location = sr_location;

    var checkDB = function(place) {
        return new Promise(function(resolve, reject) {
            suggestions.findOne({
                user_id: req.session.user._id,
                yelp_id: place.id
            }, function(err, item) {
                if (err) reject('item already exists');
                if (item) resolve(place);
                var new_sug = new suggestions({
                    "user_id": req.session.user._id,
                    "yelp_id": place.id,
                    "name": place.name,
                    "address": place.location.display_address,
                    "image": place.image_url,
                    "url": place.url
                });
                new_sug.save(function(err) {
                    if (err) reject('Could not insert the new suggestion in database');
                    resolve(place);
                });
            });
        });
    };

    // See http://www.yelp.com/developers/documentation/v2/search_api
    yelp.search(sr_par)
        .then(function(data) {
            var index;
            if (req.body.term) index = Math.floor(Math.random() * data.businesses.length);
            else index = 0;
            return checkDB(data.businesses[index]);
        }).then(function(data) {
            return res.json(data);
        })
        .catch(function(err) {
            return res.json(err);
        });
});

//history api call
app.get('/api/history/:id/:pagenum/', function(req, res, next) {
    if (!req.session.user) return res.status(403).end("Forbidden");
    var star = 10 * parseInt(req.params.pagenum);
    suggestions.find({
        user_id: req.params.id
    }).sort({
        '_id': -1
    }).skip(star).limit(10).exec(function(err, history) {
        if (err) res.status(404).end("Post id:" + req.params.id + " does not exists");
        else res.json(history);
    });
});
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
