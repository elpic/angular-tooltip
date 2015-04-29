(function(window, angular, undefined) {
  'use strict';

  var extend = angular.extend;

  angular.module('ngTooltip', [])
    .factory('safeApply', [function() {
      return function($scope, fn) {
        var phase = $scope.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
          if (fn) {
            $scope.$eval(fn);
          }
        } else {
          if (fn) {
            $scope.$apply(fn);
          } else {
            $scope.$apply();
          }
        }
      }
    }])

    .provider('$tooltip', function() {
      // Default template for tooltips.
      var defaultTemplateUrl = 'template/ng-tooltip.html';
      var defaultTetherOptions = {
        attachment: 'top middle',
        targetAttachment: 'bottom middle'
      };

      this.setDefaultTemplateUrl = function(templateUrl) {
        defaultTemplateUrl = templateUrl;
      };

      this.setDefaultTetherOptions = function(options) {
        extend(defaultTetherOptions, options);
      };

      this.$get = ['$rootScope', '$animate', '$compile', '$templateCache', function($rootScope, $animate, $compile, $templateCache) {
        return function(options) {
          options = options || {};
          options = extend({ templateUrl: defaultTemplateUrl }, options);
          options.tether = extend({}, defaultTetherOptions, options.tether || {});

          var template = options.template || $templateCache.get(options.templateUrl),
            scope        = options.scope || $rootScope.$new(),
            target     = options.target,
            elem         = $compile(template)(scope),
            tether;

          /**
           * Attach a tether to the tooltip and the target element.
           */
          function attachTether() {
            new Tether(extend({
              element: elem,
              target: target
            }, options.tether));
          };

          /**
           * Detach the tether.
           */
          function detachTether() {
            if (tether) {
              tether.destroy();
            }
          };

          /**
           * Open the tooltip
           */
          function open() {
            $animate.enter(elem, null, target);
            attachTether();
          };

          /**
           * Close the tooltip
           */
          function close() {
            $animate.leave(elem);
            detachTether();
          };

          // Close the tooltip when the scope is destroyed.
          scope.$on('$destroy', close);

          return {
            open: open,
            close: close
          };
        };
      }]
    })

    .provider('$tooltipDirective', function() {

      /**
       * Returns a factory function for building a directive for tooltips.
       *
       * @param {String} name - The name of the directive.
       */
      this.$get = ['$tooltip', 'safeApply', function($tooltip, safeApply) {
        return function(name, options) {
          return {
            restrict: 'EA',
            scope: {
              content:    '=' + name,
              tether:    '=?' + name + 'Tether',
              binding:   '@?' + name + 'Binding'
            },
            link: function(scope, elem, attrs) {
              var tooltip = $tooltip(extend({
                target: elem,
                scope: scope
              }, options, { tether: scope.tether }));


              if (scope.binding === null) {
                scope.binding = 'hover';
              }

              if (scope.binding === 'hover') {
                /**
                 * Toggle the tooltip.
                 */
                elem.hover(function() {
                  safeApply(scope, tooltip.open);
                }, function() {
                  safeApply(scope, tooltip.close);
                });
              } else if (scope.binding === 'content') {
                scope.contentChanged = function() {
                  return scope.content;
                };

                scope.$watch('contentChanged()', function() {
                  if (scope.content) {
                    safeApply(scope, tooltip.close);
                    safeApply(scope, tooltip.open);
                  } else {
                    safeApply(scope, tooltip.close);
                  }
                }, true);
              }
            }
          };
        };
      }];
    })

    .directive('ngTooltip', ['$tooltipDirective', function($tooltipDirective) {
      return $tooltipDirective('ngTooltip');
    }])

    .run(['$templateCache', function($templateCache) {
      $templateCache.put('template/ng-tooltip.html', '<div class="js-tooltip tether-theme-basic"><div class="tether-content">{{content}}</div></div>');
    }]);

})(window, window.angular);
