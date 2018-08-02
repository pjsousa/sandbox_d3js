# [Sandbox d3js boilerplate](https://github.com/pjsousa/sandbox_d3js)




## Getting Started

* Clone the repo

* Run:

	```
		# run these     
	  npm install     # install all npm dependencies
	  bower install   # install client dependencies
	  gulp copy       # copy dependencies to vendor folder (new bower packages must be handled in gulpfile)
	  gulp dev        # run dev task (runs browserSync when finished)
	```

* *package.json* also as start and test scripts.
	```
	npm start         # this runs the gulp dev task
	npm test          # this starts testem and runs the test specs
	```


## Using the Source Files

After cloning the repo take a look at the `gulpfile.js` and check out the tasks available:
* `gulp` The default task will compile the LESS and JS into the `dist` directory and minify the output, and it will copy all vendor libraries from `public/libs` (instead of bower_components) into the `vendor` directory
* `gulp dev` The dev task will serve up a local version of the template and will watch the LESS, JS, and HTML files for changes and reload the browser windo automatically

To update dependencies, run `bower update` and then run `gulp copy` to copy the updated dependencies into the `vendor` directory

