import Ember from 'ember';
import { TestModuleForComponent } from 'ember-test-helpers';
import test from 'tests/test-support/qunit-test';
import qunitModuleFor from 'tests/test-support/qunit-module-for';
import { setResolverRegistry } from 'tests/test-support/resolver';

function moduleForComponent(name, description, callbacks) {
  var module = new TestModuleForComponent(name, description, callbacks);
  qunitModuleFor(module);
}


moduleForComponent('Component Integration Tests', {
  integration: true,
  beforeSetup: function() {
    setResolverRegistry({
      'template:components/my-component': Ember.Handlebars.compile(
        '<span>{{name}}</span>'
      )
    });
  }
});

test('it can render a template', function() {
  this.render("<span>Hello</span>");
  equal(this.$('span').text(), 'Hello');
});

test('it complains if you try to use bare render', function() {
  var self = this;
  throws(function() {
    self.render();
  }, /in a component integration test you must pass a template to `render\(\)`/);
});

test('it complains if you try to use subject()', function() {
  var self = this;
  throws(function() {
    self.subject();
  }, /component integration tests do not support `subject\(\)`\./);
});


test('it can access the full container', function() {
  this.set('myColor', 'red');
  this.render('{{my-component name=myColor}}');
  equal(this.$('span').text(), 'red');
  this.set('myColor', 'blue');
  equal(this.$('span').text(), 'blue');
});

test('it can handle actions', function() {
  var handlerArg;
  this.render('<button {{action "didFoo" 42}} />');
  this.on('didFoo', function(thing) {
    handlerArg = thing;
  });
  this.$('button').click();
  equal(handlerArg, 42);
});

test('it accepts precompiled templates', function() {
  this.render(Ember.Handlebars.compile("<span>Hello</span>"));
  equal(this.$('span').text(), 'Hello');
});

test('it supports DOM events', function() {
  setResolverRegistry({
    'component:my-component': Ember.Component.extend({
      value: 0,
      layout: Ember.Handlebars.compile("<span class='target'>Click to increment!</span><span class='value'>{{value}}</span>"),
      incrementOnClick: Ember.on('click', function() {
        this.incrementProperty('value');
      })
    })
  });
  this.render('{{my-component}}');
  this.$('.target').click();
  equal(this.$('.value').text(), '1');
});

test('it supports updating an input', function() {
  setResolverRegistry({
    'component:my-input': Ember.TextField.extend({
      value: null
    })
  });
  this.render('{{my-input value=value}}');
  this.$('input').val('1').change();
  equal(this.get('value'), '1');
});

test('it supports dom triggered focus events', function() {
  setResolverRegistry({
    'component:my-input': Ember.TextField.extend({
      _onInit: Ember.on('init', function() {
        this.set('value', 'init');
      }),
      focusIn: function() {
        this.set('value', 'focusin');
      },
      focusOut: function() {
        this.set('value', 'focusout');
      }
    })
  });
  this.render('{{my-input}}');
  equal(this.$('input').val(), 'init');

  this.$('input').trigger('focusin');
  equal(this.$('input').val(), 'focusin');

  this.$('input').trigger('focusout');
  equal(this.$('input').val(), 'focusout');
});

moduleForComponent('Component Integration Tests: render during setup', {
  integration: true,
  beforeSetup: function() {
    setResolverRegistry({
      'component:my-component': Ember.Component.extend({
        value: 0,
        layout: Ember.Handlebars.compile("<span class='target'>Click to increment!</span><span class='value'>{{value}}</span>"),
        incrementOnClick: Ember.on('click', function() {
          this.incrementProperty('value');
        })
      })
    });
  },
  setup: function() {
    this.render('{{my-component}}');
  }
});

test('it has working events', function() {
  this.$('.target').click();
  equal(this.$('.value').text(), '1');
});

var origDeprecate;
moduleForComponent('Component Integration Tests: implicit views are not deprecated', {
  integration: true,
  setup: function () {
    origDeprecate = Ember.deprecate;
    Ember.deprecate = function(msg, check) {
      if (!check) {
        throw new Error("unexpected deprecation: " + msg);
      }
    };
  },
  teardown: function () {
    Ember.deprecate = origDeprecate;
  }
});

test('the toplevel view is not deprecated', function () {
  expect(0);
  (this.registry || this.container).register('component:my-toplevel', this.container.lookupFactory('view:toplevel'));
  this.render("{{my-toplevel}}");
});
