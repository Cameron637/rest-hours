# Restaurant Hours

This is a simple coding exercise.  Given a list of restaurants
(found in rest_hours.json), write a simple UI wherein the user can input
a date and time.  Display the restaurants open during that day and time.

> Running live on [my website](https://rest-hours.cameronjsanchez.com/).

## Running locally

Since this uses the
[Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
to retrieve the rest_hours.json file, if you try to run this by simply opening
index.html it will not work. Instead, you can run this using the npm module
[live-server](https://www.npmjs.com/package/live-server).