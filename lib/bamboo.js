var Base = require('mocha').reporters.Base
  , cursor = Base.cursor
  , color = Base.color
  , fs = require('fs')
  , filename = process.env.MOCHA_FILE || 'mocha.json';

exports = module.exports = BambooJSONReporter;

/**
 * Initialize a new `JSON` reporter.
 *
 * @param {Runner} runner
 * @param {Object} options
 * @api public
 */

function BambooJSONReporter(runner, options) {
  var self = this;
  Base.call(this, runner);

  var tests = []
    , failures = []
    , passes = []
    , skipped = [];

  if (options && options.reporterOptions && options.reporterOptions.output) {
    filename = options.reporterOptions.output;
  }

  runner.on('test end', function(test){
    tests.push(test);
  });

  runner.on('pending', function(test) {
    skipped.push(test);
  });
  
  runner.on('pass', function(test){
    passes.push(test);
  });

  runner.on('fail', function(test){
    failures.push(test);
  });

  runner.on('end', function(){
    var obj = {
        stats: self.stats
      , failures: failures.map(clean)
      , passes: passes.map(clean)
      , skipped: skipped.map(clean)
    };

    fs.writeFileSync(filename, JSON.stringify(obj, null, 2), 'utf-8');
  });
  runner.on('start', function() {
    if (fs.existsSync(filename)) {
      fs.unlinkSync(filename); // if we die at some point, we don't want bamboo to have a stale results file lying around...      
    }
  });
}

/**
 * Return a plain-object representation of `test`
 * free of cyclic properties etc.
 *
 * @param {Object} test
 * @return {Object}
 * @api private
 */

function clean(test) {

    // exclude full path, and only include relative path to client repo
    let target = '/lib/';

    let relativeFileName = test.file.split(target)[1];
 
    if (!relativeFileName) {
        relativeFileName = 'file name undefined';
    }
    
  var o = {
      title: test.title 
    , fullTitle: test.fullTitle() + ' : test file: ' + relativeFileName
    , duration: test.duration
  };
  if (test.hasOwnProperty("err")) {
    if (test.err.stack) {
      o.error = test.err.stack.toString();
    }
    else if (test.err.message) {
      o.error = test.err.message;
    }
  }
  return o;
}
