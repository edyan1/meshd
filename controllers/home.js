/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  if (req.user) {
    res.redirect('/dashboard');
  }
  else {
    res.render('home', {
    title: 'Home'
    });
  }
};
