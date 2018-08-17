/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bluebird = require('bluebird');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');
const zlib = require('zlib');
const helmet = require('helmet');

const upload = multer({ dest: path.join(__dirname, 'uploads') });

/**
 * Give the location of the credentials you want to use in the MESHD_CREDENTIALS
 * environment variable.  If the file is not found, the program will halt. If the
 * environment variable is not given, the default credentials will be used but
 * a warning will be logged.
 */
if (process.env.MESHD_CREDENTIALS) {
  // If we're using production credentials...
  let result = dotenv.load({ path: process.env.MESHD_CREDENTIALS });
  console.log("Reading credentials from %s", process.env.MESHD_CREDENTIALS);

  if (result.error) {
    // If something went wrong in loading the credentials...
    console.error(chalk.red("Failed to read credentials from %s"), process.env.MESHD_CREDENTIALS);
    console.error(chalk.red("%s"), result.error);
    process.exit(1);
  }
}
else {
  /**
   * Load environment variables from .env file, where API keys and passwords are configured.
   */
  dotenv.load({ path: '.env.example' });
  console.warn(chalk.red('Using default API credentials from .env.example for development; do NOT use these for production!'));
}

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');
const projectController = require('./controllers/project');
const chatController = require('./controllers/chat');
const pageController = require('./controllers/generic');
const usersPageController = require('./controllers/userspage');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.Promise = bluebird;
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);
mongoose.connection.on('error', () => {
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(helmet());
app.use(expressStatusMonitor());
app.use(compression({level: zlib.Z_BEST_COMPRESSION}));
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  outputStyle: 'compressed'
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator({
  customSanitizers: {
    stringToArray: function(value) {
      return value ? value.split(',') : [];
    }
  },
  customValidators: {

  }
}));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  if (req.path === '/api/upload') {
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});


app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
      req.path !== '/login' &&
      req.path !== '/signup' &&
      !req.path.match(/^\/auth/) &&
      !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  } else if (req.user &&
      req.path == '/dashboard') {
    req.session.returnTo = req.path;
  }
  next();
});


app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));



/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/dashboard', projectController.dashboard);
app.get('/about', pageController.about);
app.get('/help', pageController.help);
app.get('/meshers', passportConfig.isAuthenticated, usersPageController.viewAllUsers);
app.get('/viewprofile/:id', passportConfig.isAuthenticated, usersPageController.viewUserProfile);
app.get('/logout', userController.logout);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/profile', passportConfig.isAuthenticated, userController.getAccount);
app.post('/profile/update', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/profile/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/profile/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);
app.get('/projects', passportConfig.isAuthenticated, projectController.viewAllProjects);
app.get('/project/create', passportConfig.isAuthenticated, projectController.getCreateProject);
app.post('/project/create', passportConfig.isAuthenticated, projectController.postCreateProject);
app.get('/projectedit/:id', passportConfig.isAuthenticated, projectController.getEditProject);
app.post('/project/edit', passportConfig.isAuthenticated, projectController.postEditProject);
app.post('/project/delete', passportConfig.isAuthenticated, projectController.postDeleteProject);
app.get('/projectapply/:id', passportConfig.isAuthenticated, projectController.applyToProject);
app.get('/projectleave/:id', passportConfig.isAuthenticated, projectController.leaveProject);
app.post('/project/confirm', passportConfig.isAuthenticated, projectController.confirmMemberProject);
app.post('/project/postmsg', passportConfig.isAuthenticated, projectController.postMessageProject);
app.get('/project/:id', projectController.viewProject);
app.post('/recruit/:uid', passportConfig.isAuthenticated, usersPageController.recruitUser);
app.get('/cleardashboard/:id', passportConfig.isAuthenticated, usersPageController.clearDashboard);


/**
 * API examples routes.
 */
 /*
app.get('/api', apiController.getApi);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/tumblr', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
app.get('/api/github', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGithub);
app.get('/api/upload', apiController.getFileUpload);
app.post('/api/upload', upload.single('myFile'), apiController.postFileUpload);
app.get('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getPinterest);
app.post('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postPinterest);
*/
// Not ready to outright strip these yet; we might want to look at some of this code.  -JTG

const redirectToDashboard = (req, res) => {
  res.redirect('/dashboard');
};

const failureRedirect = {
  failureRedirect: '/'
};

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', failureRedirect), redirectToDashboard);
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', failureRedirect), redirectToDashboard);
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', failureRedirect), redirectToDashboard);

/**
 * OAuth authorization routes. (API examples)
 */
 /*
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), (req, res) => {
  res.redirect('/api/tumblr');
});
app.get('/auth/pinterest', passport.authorize('pinterest', { scope: 'read_public write_public' }));
app.get('/auth/pinterest/callback', passport.authorize('pinterest', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/api/pinterest');
});
*/
// Not ready to outright strip these yet; we might want to look at some of this code.  -JTG

/**
 * Error Handler.
 */
app.use(errorHandler());

// Handle 404
app.use(function(req, res) {
  res.status(404).render('404.pug', {title: 'Whoops! Not Found!'});
});

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});

module.exports = app;
