var generators = require('yeoman-generator');

module.exports = generators.Base.extend({
  prompting: function () {
      var questions = [
        {
          type: 'input',
          name: 'vendor_namespace',
          message: 'PHP vendor namespace',
          store: true,
          validate: function (input) {
            
          }
        },
        {
          type: 'input',
          name: 'vendor_composer_namespace',
          message: 'Vendor name to be used as part of the Composer package name, usually the lower cased PHP vendor namespace is used',
          default: function (answers) {
            var mappings = this._globalConfig.get('vendor_php_to_composer_namespace_mapping') || {};

            if (mappings[answers.vendor_namespace]) {
              return mappings[answers.vendor_namespace];
            }
            else {
              return answers.vendor_namespace.toLowerCase();
            }
          }.bind(this)
        },
        {
          type: 'input',
          name: 'project_namespace',
          message: 'PHP project namespace'
        },
        {
          type: 'input',
          name: 'composer_package_name',
          message: 'Composer package name',
          default: function (answers) {
            return this._composer_package_name(
              answers.vendor_composer_namespace,
              answers.project_namespace
            );
          }.bind(this)
        }
      ];

      return this.prompt(
        questions
      ).then(
        function (answers) {
          this.vendor_namespace = answers.vendor_namespace;
          this.project_namespace = answers.project_namespace;
          this.composer_package_name = answers.composer_package_name;

          this.vendor_composer_namespace = answers.vendor_composer_namespace;

          var mappings = this._globalConfig.get('vendor_php_to_composer_namespace_mapping') || {};

          if (!mappings[this.vendor_namespace] ||
              mappings[this.vendor_namespace] != this.vendor_composer_namespace) {
            mappings[this.vendor_namespace] = this.vendor_composer_namespace;

            this._globalConfig.set('vendor_php_to_composer_namespace_mapping', mappings);
            this._globalConfig.save();
          }
        }.bind(this)
      );
  },

  writing: function () {
    var namespace = this._php_namespace(
      [
        this.vendor_namespace,
        this.project_namespace
      ],
      true
    );

    var autoload = {};
    autoload[namespace] = 'src/';

    var autoload_dev = {};
    autoload_dev[namespace] = 'tests/';

    var composer = {
      "name": this.composer_package_name,
      "description": "",
      "type": "library",
      "license": "Apache-2.0",
      "authors": [],
      "require": {},
      "require-dev": {
        "phpunit/phpunit": "~4.8",
        "squizlabs/php_codesniffer": "~2.3",
        "phing/phing": "~2.11",
        "satooshi/php-coveralls": "~0.7"
      },
      "autoload": {
        "psr-4": autoload
      },
      "autoload-dev": {
        "psr-4": autoload_dev
      },
      "minimum-stability": "dev",
      "prefer-stable": true,
      "extra": {
        "branch-alias": {
          "dev-master": "0.x-dev"
        }
      }
    };

    this.fs.writeJSON(
      this.destinationPath('composer.json'),
      composer
    );

    this.fs.copy(
      this.templatePath('dot-gitignore'),
      this.destinationPath('.gitignore')
    );

    this.fs.copy(
      this.templatePath('dot-travis.yml'),
      this.destinationPath('.travis.yml')
    );

    this.fs.copy(
      this.templatePath('contrib/pre-commit'),
      this.destinationPath('contrib/pre-commit')
    );

    this.fs.copy(
      this.templatePath('.empty'),
      this.destinationPath('src/.empty')
    );
    this.fs.copy(
      this.templatePath('.empty'),
      this.destinationPath('tests/.empty')
    );
    this.fs.copy(
      this.templatePath('.empty'),
      this.destinationPath('readme.md')
    );

    this.fs.copyTpl(
      this.templatePath('build.xml'),
      this.destinationPath('build.xml'),
      {
        project: this.project_namespace
      }
    );

    this.fs.copyTpl(
      this.templatePath('phpcs-ruleset.xml'),
      this.destinationPath('phpcs-ruleset.xml'),
      {
        project: this.project_namespace
      }
    );

    this.fs.copy(
      this.templatePath('phpunit.xml.dist'),
      this.destinationPath('phpunit.xml.dist')
    )
  },

  install: function () {
    this.spawnCommand('composer', ['install']);
  },

  _composer_package_name: function (vendor, project) {
    return vendor.toLowerCase() + '/' + project.toLowerCase();
  },

  _php_namespace: function (parts, add_trailing_namespace_separator) {
    var namespace_seperator = '\\';
    var namespace =  parts.join(namespace_seperator);

    if (add_trailing_namespace_separator) {
      namespace += namespace_seperator;
    }

    return namespace;
  }
});
