$(document).ready(function() {
	// Get the modal
	var modal = document.getElementById('login-modal');

	// Get the button that opens the modal
	var btn = document.getElementById("login-button");

	// Get the <span> element that closes the modal
	var span = document.getElementById("close");

	// Get the elements that need to disappear
	var content = document.getElementById("content");

	// When the user clicks on the button, open the modal

	btn.onclick = function() {
	    modal.style.display = "flex";
	    content.style.display = "none";
	}

	// When the user clicks on <span> (x), close the modal
	span.onclick = function() {
	    modal.style.display = "none";
	    content.style.display = "flex";
	}

	// When the user clicks anywhere outside of the modal, close it
	/*window.onclick = function(event) {
	    if (event.target == modal) {
	        modal.style.display = "none";
	    }
	}*/
});