$(document).ready(function() {

});


//ROLE FILTER ON MESHERS PAGE ---------{NOT USED}------------
function roleFilter(){
    var usersDivs = document.getElementById("users-listing").getElementsByTagName("div");

    var coder = document.getElementById("coder").checked;
    var designer = document.getElementById("designer").checked;
    var scientist = document.getElementById("scientist").checked;
    var other = document.getElementById("other").checked;

    for( i=0; i< usersDivs.length; i++ ) {
       var childDiv = usersDivs[i];
       childDiv.style.display = "none";

       if (coder) {
         if(childDiv.innerHTML.indexOf("Coder") != -1) {
           childDiv.style.display = "block";
         }
       }

       if (designer) {
        if(childDiv.innerHTML.indexOf("Designer") != -1) {
          childDiv.style.display = "block";
        }
       }

       if (scientist) {
         if(childDiv.innerHTML.indexOf("Scientist") != -1) {
           childDiv.style.display = "block";
         }
       }

       if (other) {
         if(childDiv.innerHTML.indexOf("Other") != -1) {
         childDiv.style.display = "block";
        }
       }
    }
}

//USER SEARCH BAR
function userSearch(){
  var users = document.getElementById("users-listing").getElementsByClassName("card-box");
  var searchFor = document.getElementById("users-search").value;
  var lookFlag = document.getElementById("look-check").checked;
  var usersFound = 0;
  //loop through each user box on users page
  for( i=0; i< users.length; i++ ) {
    var childDiv = users[i];
    var fields = childDiv.getElementsByClassName("user");
    //hide all of them
    childDiv.style.display = "none";
    //loop through each field in each (hidden) proj-box and display the ones that match the searched for term (Not case sensitive)
    for ( j=0; j < fields.length; j++) {
      var childField = fields[j];
      if (childField.innerHTML.search(new RegExp(searchFor, "i")) != -1) {
        var lookCheck = childDiv.firstChild.lastChild.innerHTML;

        if(!lookFlag){
          childDiv.style.display = "block";
          usersFound++;
        }
        else if (lookFlag) {
          if (lookCheck=='true'){
            childDiv.style.display = "block";
            usersFound++;
          }
        }
      }
    }
  }
  if (usersFound == 0) document.getElementById('not-found').innerHTML = "Couldn't catch anyone outside, how about that?";
  else document.getElementById('not-found').innerHTML = "";
}

//PROJECT SEARCH BAR
function projectSearch(){
  var projects = document.getElementById("projects-listing").getElementsByClassName("card-box");
  var searchFor = document.getElementById("projects-search").value;
  var openFlag = document.getElementById("open-check").checked;
  var projectsFound = 0;
  //loop through each proj-box div on projects page
  for( i=0; i< projects.length; i++ ) {
     var childDiv = projects[i];
     var fields = childDiv.getElementsByClassName("project");
     //hide all of them
     childDiv.style.display = "none";
     //loop through each field in each (hidden) proj-box and display the ones that match the searched for term (Not case sensitive)
     for ( childField of fields ) {
       if (childField.innerHTML.search(new RegExp(searchFor, "i")) != -1) {
         var openCheck = childDiv.firstChild.lastChild.innerHTML;

         if (!openFlag){
           childDiv.style.display = "block";
           projectsFound++;
         }
         else if (openFlag) {
          if (openCheck=='true'){
           childDiv.style.display = "block";
           projectsFound++;
          }
         }

       }
     }
  }
  if (projectsFound == 0) document.getElementById('not-found').innerHTML = "No projects found...";
  else document.getElementById('not-found').innerHTML = "";

}

//recruit user
function recruitUser(uid, pid) {
  var userId = uid;
  var projRecruit = pid;
  User.findOne( {_id: userId}, (err, userProfile) => {
    if (userProfile != null) {
      Project.Model.findOne( {_id : projRecruit}, (err, project) => {
        var recruitmsg = {'from' : req.user.id , 'fromName' : req.user.profile.name, 'message' : 'has invited you to apply to their project', 'projectName' : project.name, 'projectLink' : '/project/'+project.id};
        userProfile.messages.push(recruitmsg);
        userProfile.save((err) => {
          if (err) {
            req.flash('errors', err);
            return res.redirect('back');
          }
          req.flash('success', { msg: 'Successfully recruited user.'});
          res.redirect('back');
        });
      });
    }
  });
}
