const User = require('../models/User');
const Project = require('../models/Project');
/**
 * GET /
 * Meshers page.
 */
exports.viewAllUsers = (req, res) => {
  if (req.user) {
    //return all users except yourself
    User.find({'_id': {$ne : req.user._id}}, (err, users) => {

      res.render('users', {
        title: 'Meshers',
        "users": users,
      });
    });
  }
  else {
    res.render('home', {
    title: 'Home'
    });
  }
};

/**
 * GET /
 * view profile page.
 */
exports.viewUserProfile = (req, res) => {
  if (req.user) {

    let userId = req.params.id;
    User.findOne( {_id: userId}, (err, userProfile) => {

      if (userProfile!=null){
        Project.Model.find({admin : req.user.id}, (err, ownProjects) => {
          res.render('account/viewprofile', {
            title: userProfile.profile.name,
            "userProfile": userProfile,
            "ownProjects": ownProjects
          });
        });
      }
      else ;
    });
  }
};

/**
 * POST /
 * Recruit user from profile page
 */
exports.recruitUser = (req, res) => {
  if (req.user) {
    let userId = req.params.uid;
    let projRecruit = req.body.projectSelect;

    User.findOne( {_id: userId}, (err, userProfile) => {

      if (userProfile != null) {
        Project.Model.findById( projRecruit, (err, project) => {

          var alreadyRecruited = false;
          for (msg of userProfile.messages) {
            if (project.id == msg.projectId) {
              alreadyRecruited = true;
              break;
            }
          }
          if (alreadyRecruited) {
            req.flash('errors', { msg: 'You have already reached out to this Mesher.'});
            return res.redirect('back');
          }
          var recruitmsg = {'from' : req.user.id , 'fromName' : req.user.profile.name, 'message' : ' has invited you to apply to their project: ', 'projectName' : project.name, 'projectId' : project.id};
          userProfile.messages.push(recruitmsg);
          userProfile.save((err) => {
            if (err) {
              req.flash('errors', err);
              return res.redirect('back');
            }
            req.flash('success', { msg: 'Mesher will be notified about your project.'});
            res.redirect('back');
          });
        });
      }
    });
  }
}

exports.clearDashboard = (req, res) => {
  if (req.user) {
    let userId = req.params.id;

    User.findOne( {_id: userId}, (err, userProfile) => {

      if (userProfile != null) {
        userProfile.messages = [];
        userProfile.save((err) => {
          if (err) {
            req.flash('errors', err);
            return res.redirect('back');
          }
          req.flash('success', { msg: 'Notices cleared.'});
          res.redirect('back');
        });
      }
    });
  }
}
