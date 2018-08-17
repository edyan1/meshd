
/*
 * Use this module like so:
 * app.get('/some/route', page('title', {local: 'configuration'}));
 */
module.exports.page = function(page, locals) {
  return function(req, res) {
    res.render(page, locals);
  };
}

exports.about = (req, res) => {
  res.render('about', {
    title: 'About Us'
  });
};

exports.help = (req, res) => {
  res.render('help', {
    title: 'MESHD How To'
  });
};
