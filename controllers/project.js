const Project = require('../models/Project');
const User = require('../models/User');

/**
 * GET /
 * Dashboard page.
 */
exports.dashboard = (req, res) => {
  //verify user is logged in
  if (req.user) {
    //find all projects that user is a member of
    let userId = req.user.id;
    Project.Model.find({
      members: userId
    }, function(err, myProjects){
       //render dashboard page, sending array of user's projects
       res.render('dashboard', {
         title: 'Dashboard',
         "myProjectsArray": myProjects
       });
    });
  }
  //if user is not logged in, send them to splash screen
  else {
    res.render('home', {
    title: 'Home'
    });
  }
};

/**
 * GET /
 * Projects page.
 */
exports.viewAllProjects = (req, res) => {
  //verify user is logged in
  if (req.user) {
    Project.Model.find((err, projects) => {
      //load all projects on projects page
      res.render('projects', {
        title: 'Projects',
        "projectsArray": projects
      });
    });
  }
  //if user is not logged in, send them to splash screen
  else {
    res.render('home', {
    title: 'Home'
    });
  }
};

/**
 * GET /
 * Create Project page.
 */
module.exports.getCreateProject = function(req, res, next) {
  res.render('project/create', {
    title: 'Create Project'
  });
};

/**
 * POST /
 * Create Project form
 */
module.exports.postCreateProject = function(req, res, next) {
  //sanitize fields
  req.sanitize('name').trim();
  req.sanitize('description').trim();
  req.sanitize('needed').toInt();
  req.sanitize('skills').stringToArray();
  req.sanitize('interests').stringToArray();

  req.assert('name', 'Name must not be empty').len(1);
  req.assert('description', "Description must not be empty").len(1);
  //req.assert('needed', "Needed must be between 0 and 16").range(0, 16);

  //random num 1 - 8
  const rand = Math.floor((Math.random() * 8) + 1);
  const imageRand = '/img/project-placeholder/project-'+rand+'.jpg';

  const errors = req.validationErrors();
  //instantiate new project model object
  const project = new Project.Model({
    admin: req.user.id,
    adminName: req.user.profile.name,
    name: req.body.name,
    description: req.body.description,
    recruiting: {
      needed: req.body.needed,
      skills: req.body.skills,
      interests: req.body.interests
    },
    members: [req.user.id],
    image: imageRand,
    open: true
  });

  //if there is an error, return user to create project page with error message
  if (errors) {
    req.flash('errors', errors);
    return res.render('project/create', {
      title: 'Create Project',
      project
    });
  }

  //store the project to the database, then redirect user to the view page for the newly created project
  project.save()
  .then(function(project) {
    return res.redirect(`/project/${project.id}`);
  })
  .catch(function(error) {
    return res.render('project/create', {
      title: 'Create Project',
      project
    });
  });
};

/**
 * GET /
 * Project Image
 **/
module.exports.getProjectImage = function(req, res, next) {

};

/**
 * POST /
 * Project Image
 **/
module.exports.postProjectImage = function(req, res, next) {

};

/**
 * GET /project/edit
 * Edit Project page
 **/
module.exports.getEditProject = function(req, res, next) {
  //verify user is logged in
  if (req.user) {
    //verify the url parameter is a valid mongo id
    req.checkParams('id').isMongoId();
    const errors = req.validationErrors();

    //retrieve the project by its id in the url
    Project.Model.findById(req.params.id).exec()
    //return list of users applying to that project
    .then(function(project) {
      return [project, User.where('_id').in(project.applying)];
    })
    .spread(function(project, applying) {
      userId = req.user.id;
      //check to make sure project exists and the user is the admin
      if (project!=null && userId==project.admin){
        //render the edit page with list of applying members for admin to approve/decline
        res.render('project/edit', {
          title: project.name,
          project,
          applying,
          userId
        });
      }
      else {
        //if user is not the project admin, display error message
        //this is to prevent people from sneakily trying to edit a project by entering through url
        req.flash('errors', { msg: 'Only the project admin may edit the project.'});
        return res.redirect('/project/'+project._id);
      }
    })
    .catch(function(error) {
      next();
    });

  }

};

/**
 * POST /project/edit
 * Update project information
 */
module.exports.postEditProject = function(req, res, next) {
  //sanitize text fields
  req.sanitize('name').trim();
  req.sanitize('description').trim();
  req.sanitize('needed').toInt();
  req.sanitize('skills').stringToArray();
  req.sanitize('interests').stringToArray();

  req.assert('name', 'Name must not be empty').len(1);
  req.assert('description', "Description must not be empty").len(1);

  const errors = req.validationErrors();
  const projectId = req.body.id;
  //if error, return user to edit page with error message
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/projectedit/'+projectId);
  }

  //find the project by its id and update the fiends
  Project.Model.findById(projectId, (err, project) => {
    if (err || project == null) { return next(err); }
    project.name = req.body.name || '';
    project.description = req.body.description || '';
    project.recruiting.needed = req.body.needed || '0';
    project.recruiting.skills = req.body.skills || [];
    project.recruiting.interests = req.body.interests || [];
    if (req.body.recruit=='no') project.open = false;
    else project.open = true;
    //save project with updates to database
    project.save((err) => {
      if (err) {
        //catch errors
        req.flash('errors', err);
        return res.redirect('/projectedit/'+projectId);
        return next(err);
      }
      req.flash('success', { msg: 'Project information has been updated.' });
      res.redirect('/projectedit/'+projectId);
    });
  });
};

/**
 * POST /project/delete
 * Delete the project
 */
module.exports.postDeleteProject = function (req, res, next) {

  const errors = req.validationErrors();
  const projectId = req.body.pid;
  //if error, return user to edit page with error message
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/projectedit/'+projectId);
  }

  //find the project by its id and update the fiends
  Project.Model.findById(projectId, (err, project) => {
    if (err || project == null) { return next(err); }
    if (req.user.id != project.admin) { return next(err); }
    project.remove((err) => {
      if (err) {
        req.flash('errors', err);
        return res.redirect('/projectedit/'+projectId);
        return next(err);
      }
      req.flash('success', { msg: 'Project has been permanently deleted.' });
      res.redirect('/dashboard');
    });
  });
};

/**
 * GET project
 * view project page
 **/
module.exports.viewProject = function(req, res, next) {

  req.checkParams('id').isMongoId();
  const errors = req.validationErrors();

  // TODO: Use projections so less data needs to be returned
  Project.Model.findById(req.params.id).exec()
  .then(function(project) {
    return [project, User.findById(project.admin), User.where('_id').in(project.members)];
  })
  .spread(function(project, admin, members) {
    userId = req.user.id;
    //render the project page with project and admin and array of members
    res.render('project/project', {
      title: project.name,
      project,
      admin,
      members,
      userId
    });
  })
  .catch(function(error) {
    next();
  });
};

/**
 * GET /projectapply
 * apply to project button
 **/
module.exports.applyToProject = function(req, res, next) {
  if (req.user){

    req.checkParams('id').isMongoId();

    const errors = req.validationErrors();
    const projectId = req.params.id;

    if (errors) {
      req.flash('errors', errors);
      return res.redirect('/project/'+projectId);
      return next(err);
    }

    //return the project by its id
    Project.Model.findById(projectId, (err, project) => {
      if (err || project == null) { return next(err); }
      //check if user if already a member or if they have already applied to the project
      if (project.members.indexOf(req.user.id) < 0 && project.applying.indexOf(req.user.id) < 0) {
        //add user to the applying users list for the project
        project.applying.push(req.user.id);
        project.save((err) => {
          if (err) {
            req.flash('errors', err);
            return res.redirect('/project/'+projectId);
            return next(err);
          }
          req.flash('success', { msg: 'Successfully applied to join this project.' });
          res.redirect('/project/'+projectId);
        });
      }
      else { //if user is already a member or already applied, return an error message
        req.flash('errors', { msg: 'Already applied to this project.' });
        res.redirect('/project/'+projectId);
      }
    });
  }
};

/**
 * GET /projectleave
 * leave a project
 **/
module.exports.leaveProject = function(req, res, next) {
  if (req.user){

    req.checkParams('id').isMongoId();

    const errors = req.validationErrors();
    const projectId = req.params.id;

    if (errors) {
      req.flash('errors', errors);
      return res.redirect('/project/'+projectId);
      return next(err);
    }

    //return the project by its id
    Project.Model.findById(projectId, (err, project) => {
      if (err || project == null) { return next(err); }
      //if user is admin, return error msg, admin can not leave a project
      if (req.user.id == project.admin) {
        req.flash('errors', { msg: 'The admin can not leave the project.' });
        res.redirect('/project/'+projectId);
      }
      //check if user is actually a member or applying member
      else if (project.members.indexOf(req.user.id) >= 0 || project.applying.indexOf(req.user.id) >= 0) {
        //add user to the applying users list for the project
        project.applying.pull(req.user.id);
        project.members.pull(req.user.id);
        project.save((err) => {
          if (err) {
            req.flash('errors', err);
            return res.redirect('/project/'+projectId);
            return next(err);
          }
          req.flash('success', { msg: 'You have left this project.' });
          res.redirect('/project/'+projectId);
        });
      }
      else { //if user is not a member or applying user
        req.flash('errors', { msg: 'You are not on this project.' });
        res.redirect('/project/'+projectId);
      }
    });
  }
};

/**
 * POST project/confirm
 * admin approves or declines applying users
 */
module.exports.confirmMemberProject = function(req, res, next) {
  const errors = req.validationErrors();
  const projectId = req.body.pid;

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/projectedit/'+projectId);
  }

  Project.Model.findById(projectId, (err, project) => {
    if (err || project == null) { return next(err); }

    //if approved add user to member list
    if (req.body.confirm == 'approve') {
      project.members.push(req.body.uid);
    }
    //remove them from applying list afterwards either way
    project.applying.pull(req.body.uid);

    project.save((err) => {
      if (err) {

        req.flash('errors', err);
        return res.redirect('/projectedit/'+projectId);
        return next(err);
      }
      //different response messages depending if admin approved or declined user
      if (req.body.confirm == 'approve') req.flash('success', { msg: 'New member approved.' });
      else req.flash('success', { msg: 'User has been declined.' });
      res.redirect('/projectedit/'+projectId);
    });
  });
};

/**
 * POST project/postmsg
 * post a message to project bulletin board (public)
 */
module.exports.postMessageProject = function(req, res, next) {
  if (req.user){

    const errors = req.validationErrors();
    const projectId = req.body.pid;
    const userId = req.user.id;

    if (errors) {
      req.flash('errors', errors);
      return res.redirect('/project/'+projectId);
      return next(err);
    }

    Project.Model.findById(projectId, (err, project) => {
      if (err || project == null) { return next(err); }

      //add to the publicChat schema, the userId, user's name, the current date and time, and the message
      project.publicChat.push({userId: req.user.id, userName: req.user.profile.name, time: new Date().toDateString() + ', ' + new Date().toLocaleTimeString(), message: req.body.text});
      project.save((err) => {
        if (err) {
          req.flash('errors', err);
          return res.redirect('/project/'+projectId);
          return next(err);
        }
        res.redirect('/project/'+projectId);
      });
      //UserId is not shown to users for a message but it is logged in database
    });
  }

};
